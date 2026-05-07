"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { MapPin, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Registration failed");
        return;
      }
      // Auto login
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      toast.success("Welcome to Local Lens! 🎉");
      router.push("/");
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
