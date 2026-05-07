"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PlaceCard from "@/components/PlaceCard/PlaceCard";
import styles from "./city.module.css";
import { MapPin, TrendingUp, Gem, Map as MapIcon, Globe } from "lucide-react";

const CityMapView = dynamic(() => import("@/components/CityMapView/CityMapView"), { ssr: false });

interface CityData {
  id: number; name: string; country: string; countryCode: string;
}
interface Props {
  city: CityData;
  trending: any[];
  underrated: any[];
  categoryStats: any[];
  totalPlaces: number;
  localReviewCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Place = any;

const CATEGORY_ICONS: Record<string, string> = {
  cafe: "☕", viewpoint: "🏔", market: "🛍", restaurant: "🍽",
  park: "🌿", shop: "🏪", museum: "🏛", beach: "🏖", street: "🛤", other: "📍",
};

type Tab = "trending" | "underrated" | "map";

export default function CityPageClient({ city, trending, underrated, categoryStats, totalPlaces, localReviewCount }: Props) {
  const [tab, setTab] = useState<Tab>("trending");
  const [category, setCategory] = useState<string>("");

  const allPlaces = tab === "trending" ? trending : underrated;
  const filtered = category ? allPlaces.filter((p: Place) => p.category === category) : allPlaces;
  const allForMap: Place[] = [...new globalThis.Map([...trending, ...underrated].map((p: Place) => [p.id, p])).values()];

  function getFlagEmoji(code: string) {
    return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  }

  return (
    <div className={styles.page}>
      {/* ─── Header ─────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerBg} />
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span>/</span>
            <span>{city.country}</span>
            <span>/</span>
            <span className={styles.breadcrumbActive}>{city.name}</span>
          </div>

          <div className={styles.headerContent}>
            <div className={styles.cityInfo}>
              <div className={styles.cityFlag}>{getFlagEmoji(city.countryCode)}</div>
              <div>
                <h1 className={styles.cityName}>{city.name}</h1>
                <p className={styles.cityCountry}>
                  <Globe size={13} /> {city.country}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <span className={styles.statNum}>{totalPlaces}</span>
                <span className={styles.statLabel}>Places</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNum}>{localReviewCount}</span>
                <span className={styles.statLabel}>Local Reviews</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNum}>{categoryStats.length}</span>
                <span className={styles.statLabel}>Categories</span>
              </div>
            </div>
          </div>

          {/* Category breakdown pills */}
          {categoryStats.length > 0 && (
            <div className={styles.catPills}>
              {categoryStats.slice(0, 6).map((s: any) => (
                <button
                  key={s.category}
                  className={`${styles.catPill} ${category === s.category ? styles.catPillActive : ""}`}
                  onClick={() => setCategory(category === s.category ? "" : s.category)}
                >
                  {CATEGORY_ICONS[s.category] ?? "📍"} {s.category}
                  <span className={styles.catCount}>{s._count.id}</span>
                </button>
              ))}
              {category && (
                <button className={styles.clearCat} onClick={() => setCategory("")}>
                  Clear filter ×
                </button>
              )}
            </div>
          )}

          {/* Tab bar */}
          <div className={styles.tabBar}>
            {(["trending", "underrated", "map"] as Tab[]).map((t) => (
              <button
                key={t}
                className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "trending" && <TrendingUp size={14} />}
                {t === "underrated" && <Gem size={14} />}
                {t === "map" && <MapIcon size={14} />}
                {t === "trending" ? "Trending" : t === "underrated" ? "Most Underrated" : "Map View"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
        {tab === "map" ? (
          <div style={{ height: 520 }} className="map-container">
            <CityMapView places={allForMap} cityName={city.name} />
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <MapPin size={32} style={{ color: "var(--text-3)" }} />
                <p>No places found{category ? ` in "${category}"` : ""}.</p>
                <Link href="/submit" className="btn btn-primary">Be the first to add one →</Link>
              </div>
            ) : (
              <>
                <div className={styles.resultsMeta}>
                  <span className={styles.resultsCount}>
                    {filtered.length} place{filtered.length !== 1 ? "s" : ""}
                    {category ? ` · ${category}` : ""}
                  </span>
                  {tab === "underrated" && (
                    <span className={styles.resultsHint}>
                      Sorted by likes ÷ visits ratio
                    </span>
                  )}
                </div>
                <div className="grid-places">
                  {filtered.map((p: Place) => (
                    <PlaceCard
                      key={p.id}
                      id={p.id} name={p.name} description={p.description}
                      category={p.category}
                      city={city.name} country={city.country}
                      likeCount={p.likeCount} visitCount={p.visitCount}
                      score={Number(p.score)} status={p.status}
                      photoUrls={p.photoUrls}
                      submitter={{ username: p.submitter.username, avatarUrl: p.submitter.avatarUrl }}
                      localReviewCount={p._count?.reviews ?? 0}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
