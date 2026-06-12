import Link from "next/link";
import { MapPin, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: "1.5rem", padding: "2rem",
      textAlign: "center",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "var(--surface)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <MapPin size={32} style={{ color: "var(--amber)" }} />
      </div>
      <div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "4rem", color: "var(--amber)", marginBottom: "0.5rem" }}>
          404
        </h1>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>This place doesn&apos;t exist</h2>
        <p style={{ color: "var(--text-2)", maxWidth: 380, lineHeight: 1.6 }}>
          The page you&apos;re looking for has moved, been removed, or never existed on Local Lens.
        </p>
      </div>
      <Link href="/" className="btn btn-primary" style={{ gap: "0.5rem" }}>
        <Home size={16} /> Back to Home
      </Link>
    </div>
  );
}
