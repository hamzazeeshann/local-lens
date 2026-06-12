import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/Navbar/Navbar";
import { Toaster } from "react-hot-toast";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Local Lens — Discover Real Places, Not Tourist Traps",
  description:
    "Community-driven platform where locals share genuinely underrated spots. Find hidden cafes, secret viewpoints, and local markets in any city.",
  keywords: ["travel", "local recommendations", "hidden gems", "underrated places", "community"],
  openGraph: {
    title: "Local Lens",
    description: "Find the places locals actually love.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <SessionProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem",
              },
              success: { iconTheme: { primary: "#f5a623", secondary: "#0f1117" } },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
