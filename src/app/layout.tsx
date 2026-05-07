import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import { Toaster } from "react-hot-toast";
import SessionProvider from "@/components/SessionProvider";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Local Lens — Discover Real Places, Not Tourist Traps",
  description:
    "Community-driven platform where locals share genuinely underrated spots. Find hidden cafes, secret viewpoints, and local markets in any city.",
  keywords: ["travel", "local recommendations", "hidden gems", "underrated places", "community"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
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
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
