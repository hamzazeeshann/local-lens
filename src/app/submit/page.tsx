"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import styles from "./page.module.css";
import { MapPin, ChevronRight, ChevronLeft, Check, Loader } from "lucide-react";
import CitySearchBar from "@/components/CitySearchBar/CitySearchBar";

const MapPicker = dynamic(() => import("@/components/MapPicker/MapPicker"), { ssr: false });

const CATEGORIES = ["cafe","viewpoint","market","restaurant","park","shop","museum","beach","street","other"] as const;

interface FormState {
  cityId: number | null;
  cityName: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  category: string;
  description: string;
}

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    cityId: null, cityName: "", latitude: null, longitude: null,
    name: "", category: "", description: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?next=/submit");
  }, [status, router]);

  if (status === "loading") return <div style={{ padding: "4rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>;

  const canNext = () => {
    if (step === 1) return !!form.cityId;
    if (step === 2) return form.latitude !== null && form.longitude !== null;
    if (step === 3) return form.name.length > 1 && form.category && form.description.length >= 10;
    return true;
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, description: form.description,
          category: form.category, cityId: form.cityId,
          latitude: form.latitude, longitude: form.longitude,
          photoUrls: [],
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const place = await res.json();
      toast.success("Place submitted! 🎉");
      router.push(`/place/${place.id}`);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className="container">
          <h1>Add a Place</h1>
          <p className={styles.sub}>Share a hidden gem with the community</p>
          {/* Progress */}
          <div className={styles.progress}>
            {[1,2,3,4].map((s) => (
              <div key={s} className={styles.progressItem}>
                <div className={`${styles.progressDot} ${step > s ? styles.done : ""} ${step === s ? styles.active : ""}`}>
                  {step > s ? <Check size={12} /> : s}
                </div>
                <span className={styles.progressLabel}>
                  {["City","Location","Details","Confirm"][s-1]}
                </span>
                {s < 4 && <div className={`${styles.progressLine} ${step > s ? styles.doneLine : ""}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.card}>

          {/* Step 1 — City */}
          {step === 1 && (
            <div className="fade-up">
              <h2 className={styles.stepTitle}>Which city is this in?</h2>
              <p className={styles.stepSub}>Search and select the city where this place is located.</p>
              {form.cityId ? (
                <div className={styles.selectedCity}>
                  <MapPin size={16} className={styles.pinIcon} />
                  <span>{form.cityName}</span>
                  <button onClick={() => setForm({ ...form, cityId: null, cityName: "" })} className={styles.clearBtn}>×</button>
                </div>
              ) : (
                <div style={{ maxWidth: 420 }}>
                  <CitySearchBarPickable onSelect={(city) => setForm({ ...form, cityId: city.id, cityName: `${city.name}, ${city.country}` })} />
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Map pin */}
          {step === 2 && (
            <div className="fade-up">
              <h2 className={styles.stepTitle}>Pin the exact location</h2>
              <p className={styles.stepSub}>Click on the map to drop a pin where this place is.</p>
              <div style={{ height: 420 }} className="map-container">
                <MapPicker
                  onLocationSelect={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
                  selected={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
                />
              </div>
              {form.latitude && (
                <p className={styles.coordHint}>
                  📍 {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
                </p>
              )}
            </div>
          )}

          {/* Step 3 — Details */}
          {step === 3 && (
            <div className="fade-up">
              <h2 className={styles.stepTitle}>Tell us about it</h2>
              <p className={styles.stepSub}>What makes this place worth visiting?</p>
              <div className={styles.fields}>
                <div className="form-group">
                  <label className="form-label">Place name *</label>
                  <input className="form-input" placeholder="e.g. Rooftop chai spot on Burns Road"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <div className={styles.categories}>
                    {CATEGORIES.map((c) => (
                      <button key={c}
                        className={`${styles.catBtn} ${form.category === c ? styles.catActive : ""}`}
                        onClick={() => setForm({ ...form, category: c })}
                      >{c}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Why do you love it? * (min 10 chars)</label>
                  <textarea className="form-input" rows={4}
                    placeholder="Tell travelers what makes this place special..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <div className="fade-up">
              <h2 className={styles.stepTitle}>Looks good?</h2>
              <div className={styles.review}>
                <div className={styles.reviewRow}><span>City</span><strong>{form.cityName}</strong></div>
                <div className={styles.reviewRow}><span>Name</span><strong>{form.name}</strong></div>
                <div className={styles.reviewRow}><span>Category</span><strong>{form.category}</strong></div>
                <div className={styles.reviewRow}><span>Location</span><strong>{form.latitude?.toFixed(4)}, {form.longitude?.toFixed(4)}</strong></div>
                <div className={styles.reviewRow}><span>Description</span><strong>{form.description}</strong></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className={styles.nav}>
            {step > 1 && (
              <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 4 ? (
              <button className="btn btn-primary" disabled={!canNext()} onClick={() => setStep(step + 1)}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={submit} disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : null}
                Submit Place
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline selectable city search (passes city object on select)
function CitySearchBarPickable({ onSelect }: { onSelect: (city: { id: number; name: string; country: string }) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: number; name: string; country: string }>>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length < 2) { setResults([]); return; }
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
      setOpen(true);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input className="form-input" style={{ width: "100%" }}
        placeholder="Type a city name..."
        value={query} onChange={(e) => setQuery(e.target.value)} />
      {open && results.length > 0 && (
        <ul style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)", listStyle: "none", zIndex: 200,
          boxShadow: "var(--shadow)"
        }}>
          {results.map((c) => (
            <li key={c.id}
              onMouseDown={() => { onSelect(c); setOpen(false); setQuery(""); }}
              style={{ padding: "0.65rem 1rem", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
              <span>{c.name}</span><span style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>{c.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
