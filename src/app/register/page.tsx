"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { MapPin, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [cityId, setCityId] = useState<number | null>(null);
  const [cityName, setCityName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // City search state
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<Array<{ id: number; name: string; country: string }>>([]);
  const [cityOpen, setCityOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (cityQuery.length < 2) { setCityResults([]); return; }
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(cityQuery)}`);
      setCityResults(await res.json());
      setCityOpen(true);
    }, 280);
    return () => clearTimeout(t);
  }, [cityQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          cityId: cityId ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(typeof err.error === "string" ? err.error : "Registration failed");
        return;
      }
      // Auto login then redirect
      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signInResult?.error) {
        // Account created but auto-login failed — send to login page
        toast.success("Account created! Please sign in.");
        router.push("/login");
      } else {
        toast.success("Welcome to Local Lens! 🎉");
        router.refresh();
        router.push("/");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoMark}>
          <MapPin size={22} />
        </div>
        <h1 className={styles.title}>Join Local Lens</h1>
        <p className={styles.sub}>Start sharing hidden gems in your city</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className={styles.inputWrap}>
              <User size={14} className={styles.inputIcon} />
              <input className={`form-input ${styles.input}`} placeholder="your_username"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={14} className={styles.inputIcon} />
              <input type="email" className={`form-input ${styles.input}`} placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={14} className={styles.inputIcon} />
              <input type={showPass ? "text" : "password"} className={`form-input ${styles.input}`} placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* City picker — required for Local badge */}
          <div className="form-group">
            <label className="form-label">
              Your home city <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional — unlocks Local badge)</span>
            </label>
            {cityId ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "0.6rem 1rem", border: "1px solid var(--amber)" }}>
                <MapPin size={14} style={{ color: "var(--amber)" }} />
                <span style={{ flex: 1, fontSize: "0.9rem" }}>{cityName}</span>
                <button type="button" onClick={() => { setCityId(null); setCityName(""); setCityQuery(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: "1rem" }}>×</button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <div className={styles.inputWrap}>
                  <MapPin size={14} className={styles.inputIcon} />
                  <input className={`form-input ${styles.input}`} placeholder="Search your city..."
                    value={cityQuery} onChange={(e) => setCityQuery(e.target.value)} />
                </div>
                {cityOpen && cityResults.length > 0 && (
                  <ul style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", listStyle: "none", zIndex: 200,
                    boxShadow: "var(--shadow)", maxHeight: 180, overflowY: "auto"
                  }}>
                    {cityResults.map((c) => (
                      <li key={c.id}
                        onMouseDown={() => { setCityId(c.id); setCityName(`${c.name}, ${c.country}`); setCityOpen(false); setCityQuery(""); }}
                        style={{ padding: "0.65rem 1rem", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <span>{c.name}</span><span style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>{c.country}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link href="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
