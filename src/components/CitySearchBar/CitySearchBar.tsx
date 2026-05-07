"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import styles from "./CitySearchBar.module.css";

interface City {
  id: number;
  name: string;
  country: string;
  code: string;
}

export default function CitySearchBar({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 280);
    return () => clearTimeout(timerRef.current);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (city: City) => {
    setQuery("");
    setOpen(false);
    router.push(`/city/${city.id}`);
  };

  const placeholders = ["Search Karachi...", "Search Istanbul...", "Search Lahore...", "Search Tokyo..."];
  const [phIdx, setPhIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhIdx((i) => (i + 1) % placeholders.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ""}`} ref={containerRef}>
      <div className={styles.inputWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={compact ? "Search cities..." : placeholders[phIdx]}
          className={styles.input}
          onFocus={() => results.length && setOpen(true)}
          id="city-search-input"
        />
        {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
      </div>
      {open && results.length > 0 && (
        <ul className={styles.dropdown}>
          {results.map((city) => (
            <li key={city.id} className={styles.item} onMouseDown={() => select(city)}>
              <MapPin size={13} className={styles.pin} />
              <span className={styles.cityName}>{city.name}</span>
              <span className={styles.country}>{city.country}</span>
              <span className={styles.flag}>{getFlagEmoji(city.code)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getFlagEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
