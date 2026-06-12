"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import PlaceCard from "@/components/PlaceCard/PlaceCard";
import styles from "./place.module.css";
import {
  Heart, Eye, MapPin, Star, Clock, User,
  CheckCircle, AlertTriangle, Zap, Send, ChevronLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const MiniMap = dynamic(() => import("@/components/MiniMap/MiniMap"), { ssr: false });

interface Props { place: any; nearby: any[]; }

export default function PlaceDetailClient({ place, nearby }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(place.likeCount);
  const [visitLogged, setVisitLogged] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<any[]>(place.reviews || []);
  const [activePhoto, setActivePhoto] = useState(0);
  const [placeStatus, setPlaceStatus] = useState(place.status);

  const score = place.visitCount > 0 ? (place.likeCount / place.visitCount) : 0;

  // Log visit on page load (once per session)
  useEffect(() => {
    if (visitLogged) return;
    fetch(`/api/places/${place.id}/visit`, { method: "POST" }).catch(() => {});
    setVisitLogged(true);
  }, [place.id, visitLogged]);

  const toggleLike = async () => {
    if (!session) { toast.error("Sign in to like places"); return; }
    const res = await fetch(`/api/places/${place.id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount((c: number) => data.liked ? c + 1 : c - 1);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) { toast.error("Sign in to write a review"); return; }
    if (reviewContent.length < 10) { toast.error("Review must be at least 10 characters"); return; }
    setSubmittingReview(true);
    const res = await fetch(`/api/places/${place.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reviewContent }),
    });
    setSubmittingReview(false);
    if (res.ok) {
      const review = await res.json();
      setReviews((prev) => [review, ...prev]);
      setReviewContent("");
      toast.success("Review added!");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to submit review");
    }
  };

  const confirmOpen = async () => {
    if (!session) { toast.error("Sign in to confirm places"); return; }
    const res = await fetch(`/api/places/${place.id}/confirm-open`, { method: "POST" });
    if (res.ok) {
      setPlaceStatus("active");
      toast.success("Thanks! Marked as still open.");
    }
  };

  const STATUS_MAP: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    active:          { icon: <CheckCircle size={13} />, label: "Active", cls: "badge-green" },
    viral:           { icon: <Zap size={13} />, label: "Going Viral 🔥", cls: "badge-red" },
    possibly_closed: { icon: <AlertTriangle size={13} />, label: "Possibly Closed", cls: "badge-amber" },
  };
  const statusInfo = STATUS_MAP[placeStatus] ?? STATUS_MAP.active;

  return (
    <div className={styles.page}>
      {/* ─── Hero Photo ───────────────────────────────────── */}
      <div className={styles.hero}>
        {place.photoUrls?.length > 0 ? (
          <>
            <img src={place.photoUrls[activePhoto]} alt={place.name} className={styles.heroImg} />
            {place.photoUrls.length > 1 && (
              <div className={styles.photoThumbs}>
                {place.photoUrls.map((url: string, i: number) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${i === activePhoto ? styles.thumbActive : ""}`}
                    onClick={() => setActivePhoto(i)}
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={styles.heroPlaceholder}>
            <MapPin size={48} style={{ color: "var(--amber)" }} />
          </div>
        )}
        <div className={styles.heroOverlay} />

        {/* Back button */}
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      {/* ─── Main content ─────────────────────────────────── */}
      <div className="container">
        <div className={styles.layout}>
          {/* Left: Details */}
          <div className={styles.main}>
            {/* Title block */}
            <div className={styles.titleBlock}>
              <div className={styles.badges}>
                <span className={`badge ${statusInfo.cls}`}>
                  {statusInfo.icon} {statusInfo.label}
                </span>
                <span className="badge badge-amber" style={{ textTransform: "capitalize" }}>
                  {place.category}
                </span>
              </div>
              <h1 className={styles.title}>{place.name}</h1>
              <div className={styles.locationLine}>
                <MapPin size={14} style={{ color: "var(--amber)" }} />
                <Link href={`/city/${place.cityId}`} className={styles.cityLink}>
                  {place.city?.name}, {place.city?.country?.name}
                </Link>
              </div>
            </div>

            {/* Score display */}
            <div className={styles.scoreCard}>
              <div className={styles.scoreLeft}>
                <div className={styles.scoreBig}>
                  {(score * 100).toFixed(0)}<span className={styles.scorePct}>%</span>
                </div>
                <div className={styles.scoreDesc}>Community Score</div>
                <div className={styles.scoreSub}>likes ÷ visits ratio</div>
              </div>
              <div className={styles.scoreRight}>
                <div className={styles.scoreMetric}>
                  <Heart size={14} style={{ color: "var(--red)" }} />
                  <span>{likeCount} likes</span>
                </div>
                <div className={styles.scoreMetric}>
                  <Eye size={14} style={{ color: "var(--blue)" }} />
                  <span>{place.visitCount} visits</span>
                </div>
                <div className={styles.scoreMetric}>
                  <Star size={14} style={{ color: "var(--amber)" }} />
                  <span>{reviews.length} reviews</span>
                </div>
              </div>
              <div className={styles.scoreBarWrap}>
                <div className="score-bar" style={{ height: 6 }}>
                  <div className="score-bar-fill" style={{ width: `${Math.min(score * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>About this place</h2>
              <p className={styles.description}>{place.description}</p>
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              <button
                className={`btn ${liked ? "btn-danger" : "btn-ghost"} ${styles.likeBtn} ${liked ? styles.liked : ""}`}
                onClick={toggleLike}
              >
                <Heart size={16} fill={liked ? "currentColor" : "none"} />
                {liked ? "Liked" : "Like this place"}
              </button>
              {placeStatus === "possibly_closed" && (
                <button className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={confirmOpen}>
                  <CheckCircle size={14} /> Still open? Confirm
                </button>
              )}
            </div>

            {/* Submitter credit */}
            <div className={styles.submitterCard}>
              <div className={styles.submitterAvatar}>
                {place.submitter?.avatarUrl ? (
                  <img src={place.submitter.avatarUrl} alt="" />
                ) : (
                  <span>{place.submitter?.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className={styles.submitterLabel}>Submitted by</div>
                <Link href={`/profile/${place.submitter?.username}`} className={styles.submitterName}>
                  @{place.submitter?.username}
                </Link>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span className={styles.submitterDate}>
                  <Clock size={11} />
                  {formatDistanceToNow(new Date(place.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Reviews */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Reviews</h2>

              {/* Write review */}
              <form onSubmit={submitReview} className={styles.reviewForm}>
                <textarea
                  className={`form-input ${styles.reviewInput}`}
                  placeholder={session ? "Share your experience..." : "Sign in to write a review"}
                  rows={3}
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  disabled={!session}
                />
                {session && (
                  <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                    <Send size={14} />
                    {submittingReview ? "Posting..." : "Post Review"}
                  </button>
                )}
              </form>

              {/* Review list */}
              <div className={styles.reviewList}>
                {reviews.length === 0 ? (
                  <p className={styles.noReviews}>No reviews yet. Be the first!</p>
                ) : (
                  reviews.map((r: any) => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewUser}>
                          <div className={styles.reviewAvatar}>
                            {r.user?.avatarUrl ? (
                              <img src={r.user.avatarUrl} alt="" />
                            ) : (
                              <span><User size={12} /></span>
                            )}
                          </div>
                          <span className={styles.reviewUsername}>@{r.user?.username}</span>
                          {r.isLocal && (
                            <span className="badge badge-local" style={{ fontSize: "0.65rem" }}>
                              📍 Local
                            </span>
                          )}
                        </div>
                        <span className={styles.reviewDate}>
                          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={styles.reviewContent}>{r.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className={styles.sidebar}>
            {/* Mini Map */}
            <div className={styles.sideSection}>
              <h3 className={styles.sideSectionTitle}>Location</h3>
              <div style={{ height: 200 }} className="map-container">
                <MiniMap lat={Number(place.latitude)} lng={Number(place.longitude)} name={place.name} />
              </div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}&zoom=16`}
                target="_blank" rel="noopener noreferrer"
                className={styles.osmLink}
              >
                Open in OpenStreetMap →
              </a>
            </div>

            {/* More in this city */}
            {nearby.length > 0 && (
              <div className={styles.sideSection}>
                <h3 className={styles.sideSectionTitle}>
                  More in {place.city?.name}
                </h3>
                <div className={styles.nearbList}>
                  {nearby.map((p: any) => (
                    <Link key={p.id} href={`/place/${p.id}`} className={styles.nearbyItem}>
                      <div className={styles.nearbyPhoto}>
                        {p.photoUrls?.[0] ? (
                          <img src={p.photoUrls[0]} alt="" />
                        ) : (
                          <MapPin size={16} style={{ color: "var(--amber)" }} />
                        )}
                      </div>
                      <div className={styles.nearbyInfo}>
                        <span className={styles.nearbyName}>{p.name}</span>
                        <span className={styles.nearbyMeta}>{p.category} · ❤ {p.likeCount}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href={`/city/${place.cityId}`} className={styles.seeAllLink}>
                  See all in {place.city?.name} →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
