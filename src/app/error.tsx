"use client";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: "1.5rem", padding: "2rem",
      textAlign: "center",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <AlertTriangle size={32} style={{ color: "var(--red)" }} />
      </div>
      <div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h2>
        <p style={{ color: "var(--text-2)", maxWidth: 380, lineHeight: 1.6, fontSize: "0.9rem" }}>
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button className="btn btn-primary" onClick={reset}>Try again</button>
        <Link href="/" className="btn btn-ghost">Go home</Link>
      </div>
    </div>
  );
}
