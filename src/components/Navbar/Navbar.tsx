"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CitySearchBar from "@/components/CitySearchBar/CitySearchBar";
import styles from "./Navbar.module.css";
import { MapPin, Plus, User, LogOut, Menu, X } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <MapPin size={20} className={styles.logoIcon} />
          <span>Local<span className={styles.logoAccent}>Lens</span></span>
        </Link>

        {/* Search — hidden on small screens */}
        <div className={styles.searchWrap}>
          <CitySearchBar compact />
        </div>

        {/* Desktop nav */}
        <div className={styles.actions}>
          {session ? (
            <>
              <Link href="/submit" className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}>
                <Plus size={15} /> Add Place
              </Link>
              <Link href={`/profile/${session?.user?.name}`} className={styles.avatarBtn}>
                {session?.user?.image ? (
                  <img src={session.user.image} alt="" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {session?.user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={styles.iconBtn}
                title="Sign out"
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost" style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}>
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}>
                Join
              </Link>
            </>
          )}
          <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <CitySearchBar compact />
          {session ? (
            <>
              <Link href="/submit" onClick={() => setMenuOpen(false)}>+ Add Place</Link>
              <Link href={`/profile/${session?.user?.name}`} onClick={() => setMenuOpen(false)}>My Profile</Link>
              <button onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>Join Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
