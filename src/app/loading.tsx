export default function Loading() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "calc(100vh - 60px)", flexDirection: "column", gap: "1rem",
    }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <p style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>Loading...</p>
    </div>
  );
}
