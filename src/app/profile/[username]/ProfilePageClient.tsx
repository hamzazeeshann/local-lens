"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Link from "next/link";
import PlaceCard from "@/components/PlaceCard/PlaceCard";
import styles from "./profile.module.css";
import {
  MapPin, Calendar, Star, Heart, BookOpen,
  Globe, Grid, List, Clock,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Props {
  user: {
    id: string; username: string; avatarUrl?: string | null;
    bio?: string | null; createdAt: string;
    city: { name: string; country: string } | null;
  };
  submissions: any[];
  likedPlaces: any[];
  reviews: any[];
  stats: { submissions: number; likes: number; reviews: number; cities: number };
}

type Tab = "submissions" | "likes" | "reviews";

export default function ProfilePageClient({ user, submissions, likedPlaces, reviews, stats }: Props) {
  const [tab, setTab] = useState<Tab>("submissions");
  const [gridView, setGridView] = useState(true);

  // "Visit Again" = first 4 liked places (Letterboxd-style favorites)
  const visitAgain = likedPlaces.slice(0, 4);

  return (
    <div className={styles.page}>
      {/* ─── Header / Banner ──────────────────────────────── */}
      <div className={styles.banner}>
        <div className={styles.bannerBg} />
        <div className="container">
          <div className={styles.profileHeader}>
            {/* Avatar */}
            <div className={styles.avatarWrap}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className={styles.profileInfo}>
              <h1 className={styles.username}>@{user.username}</h1>
              {user.bio && <p className={styles.bio}>{user.bio}</p>}
              <div className={styles.metaRow}>
                {user.city && (
                  <span className={styles.metaItem}>
                    <MapPin size={13} /> {user.city.name}, {user.city.country}
                  </span>
                )}
                <span className={styles.metaItem}>
                  <Calendar size={13} />
                  Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className={styles.statsBar}>
            {[
              { icon: <Globe size={15} />, num: stats.submissions, label: "Submissions" },
              { icon: <Heart size={15} />, num: stats.likes, label: "Likes received" },
              { icon: <Star size={15} />, num: stats.reviews, label: "Reviews" },
              { icon: <MapPin size={15} />, num: stats.cities, label: "Cities" },
            ].map(({ icon, num, label }) => (
              <div key={label} className={styles.statItem}>
                <span className={styles.statIcon}>{icon}</span>
                <span className={styles.statNum}>{num}</span>
                <span className={styles.statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        {/* ─── Visit Again (Letterboxd Favorites) ────────── */}
        {visitAgain.length > 0 && (
          <div className={styles.visitAgainSection}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionHeadLeft}>
                <div className={styles.visitAgainDot} />
                <h2 className={styles.sectionTitle}>Visit Again</h2>
              </div>
              <span className={styles.sectionSub}>Places they keep coming back to</span>
            </div>
            <div className={styles.visitAgainGrid}>
              {visitAgain.map((p: any) => (
                <Link key={p.id} href={`/place/${p.id}`} className={styles.visitAgainCard}>
                  <div className={styles.visitAgainPhoto}>
                    {p.photoUrls?.[0] ? (
                      <img src={p.photoUrls[0]} alt={p.name} />
                    ) : (
                      <div className={styles.visitAgainPlaceholder}>
                        <MapPin size={20} />
                      </div>
                    )}
                    <div className={styles.visitAgainOverlay}>
                      <span className={styles.visitAgainName}>{p.name}</span>
                      <span className={styles.visitAgainCity}>{p.city?.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 4 - visitAgain.length) }).map((_, i) => (
                <div key={`empty-${i}`} className={`${styles.visitAgainCard} ${styles.visitAgainEmpty}`}>
                  <span className={styles.emptySlot}>+</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Recent Activity Feed ──────────────────────── */}
        {reviews.length > 0 && (
          <div className={styles.activitySection}>
            <div className={styles.sectionHead}>
              <div className={styles.sectionHeadLeft}>
                <Clock size={16} style={{ color: "var(--amber)" }} />
                <h2 className={styles.sectionTitle}>Recent Reviews</h2>
              </div>
            </div>
            <div className={styles.activityList}>
              {reviews.slice(0, 4).map((r: any) => (
                <Link key={r.id} href={`/place/${r.placeId}`} className={styles.activityItem}>
                  <div className={styles.activityLeft}>
                    <BookOpen size={14} style={{ color: "var(--amber)" }} />
                  </div>
                  <div className={styles.activityContent}>
                    <span className={styles.activityPlace}>{r.place?.name}</span>
                    <span className={styles.activityCity}>{r.place?.city?.name}</span>
                    <p className={styles.activityText}>&ldquo;{r.content.slice(0, 120)}{r.content.length > 120 ? "..." : ""}&rdquo;</p>
                  </div>
                  <span className={styles.activityTime}>
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── Main Tab Content ──────────────────────────── */}
        <div className={styles.tabSection}>
          <div className={styles.tabHeader}>
            <div className={styles.tabs}>
              {(["submissions", "likes", "reviews"] as Tab[]).map((t) => (
                <button
                  key={t}
                  className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "submissions" && <Globe size={13} />}
                  {t === "likes" && <Heart size={13} />}
                  {t === "reviews" && <BookOpen size={13} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  <span className={styles.tabCount}>
                    {t === "submissions" ? stats.submissions : t === "likes" ? likedPlaces.length : stats.reviews}
                  </span>
                </button>
              ))}
            </div>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewBtn} ${gridView ? styles.viewActive : ""}`} onClick={() => setGridView(true)}>
                <Grid size={15} />
              </button>
              <button className={`${styles.viewBtn} ${!gridView ? styles.viewActive : ""}`} onClick={() => setGridView(false)}>
                <List size={15} />
              </button>
            </div>
          </div>

          {/* Submissions */}
          {tab === "submissions" && (
            submissions.length === 0 ? (
              <EmptyTab label="No places submitted yet." cta={{ href: "/submit", label: "Add a place →" }} />
            ) : (
              <div className={gridView ? "grid-places" : styles.listView}>
                {submissions.map((p: any) => (
                  <PlaceCard
                    key={p.id} id={p.id} name={p.name} description={p.description}
                    category={p.category}
                    city={p.city?.name} country={p.city?.country?.name}
                    likeCount={p.likeCount} visitCount={p.visitCount}
                    score={Number(p.score)} status={p.status}
                    photoUrls={p.photoUrls}
                    submitter={{ username: user.username, avatarUrl: user.avatarUrl }}
                    localReviewCount={p._count?.reviews}
                  />
                ))}
              </div>
            )
          )}

          {/* Liked places */}
          {tab === "likes" && (
            likedPlaces.length === 0 ? (
              <EmptyTab label="No liked places yet." />
            ) : (
              <div className={gridView ? "grid-places" : styles.listView}>
                {likedPlaces.map((p: any) => (
                  <PlaceCard
                    key={p.id} id={p.id} name={p.name} description={p.description}
                    category={p.category}
                    city={p.city?.name} country={p.city?.country?.name}
                    likeCount={p.likeCount} visitCount={p.visitCount}
                    score={Number(p.score)} status={p.status}
                    photoUrls={p.photoUrls}
                    submitter={{ username: p.submitter?.username, avatarUrl: p.submitter?.avatarUrl }}
                  />
                ))}
              </div>
            )
          )}

          {/* Reviews */}
          {tab === "reviews" && (
            reviews.length === 0 ? (
              <EmptyTab label="No reviews written yet." />
            ) : (
              <div className={styles.reviewsList}>
                {reviews.map((r: any) => (
                  <Link key={r.id} href={`/place/${r.placeId}`} className={styles.reviewRow}>
                    <div className={styles.reviewThumb}>
                      {r.place?.photoUrls?.[0] ? (
                        <img src={r.place.photoUrls[0]} alt="" />
                      ) : (
                        <MapPin size={14} style={{ color: "var(--amber)" }} />
                      )}
                    </div>
                    <div className={styles.reviewBody}>
                      <span className={styles.reviewPlace}>{r.place?.name}</span>
                      <span className={styles.reviewCityTag}>{r.place?.city?.name}</span>
                      {r.isLocal && <span className="badge badge-local" style={{ fontSize: "0.65rem" }}>📍 Local</span>}
                      <p className={styles.reviewText}>&ldquo;{r.content}&rdquo;</p>
                      <span className={styles.reviewTime}>
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyTab({ label, cta }: { label: string; cta?: { href: string; label: string } }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-3)" }}>
      <p>{label}</p>
      {cta && <Link href={cta.href} className="btn btn-primary" style={{ marginTop: "1rem" }}>{cta.label}</Link>}
    </div>
  );
}
