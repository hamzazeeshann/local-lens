import Link from "next/link";
import styles from "./PlaceCard.module.css";
import { Heart, Eye, MapPin, Star } from "lucide-react";

interface PlaceCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  country: string;
  likeCount: number;
  visitCount: number;
  score: number;
  status: string;
  photoUrls: string[];
  submitter: { username: string; avatarUrl?: string | null };
  localReviewCount?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  cafe: "#f5a623",
  viewpoint: "#60a5fa",
  market: "#4ade80",
  restaurant: "#f87171",
  park: "#34d399",
  shop: "#a78bfa",
  museum: "#fb923c",
  beach: "#22d3ee",
  street: "#fbbf24",
  other: "#9ba3b8",
};

export default function PlaceCard({
  id, name, description, category, city, country,
  likeCount, visitCount, score, status, photoUrls, submitter, localReviewCount,
}: PlaceCardProps) {
  const fillPct = Math.min(score * 100, 100);
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;

  return (
    <Link href={`/place/${id}`} className={`card ${styles.card}`}>
      {/* Photo */}
      <div className={styles.photo}>
        {photoUrls?.[0] ? (
          <img src={photoUrls[0]} alt={name} />
        ) : (
          <div className={styles.photoPlaceholder} style={{ "--color": color } as React.CSSProperties}>
            <MapPin size={28} />
          </div>
        )}
        {/* Status badge overlay */}
        {status === "viral" && (
          <div className={`badge badge-red ${styles.statusBadge} pulse-glow`}>🔥 Going Viral</div>
        )}
        {status === "possibly_closed" && (
          <div className={`badge badge-amber ${styles.statusBadge}`}>⚠ Check status</div>
        )}
        {/* Category chip */}
        <div className={styles.categoryChip} style={{ "--color": color } as React.CSSProperties}>
          {category}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.location}>
          <MapPin size={11} /> {city}, {country}
        </p>
        <p className={styles.desc}>{description}</p>

        {/* Score bar */}
        <div className={styles.scoreRow}>
          <div className={styles.scoreLabel}>
            <Heart size={12} /> {likeCount}
            <Eye size={12} style={{ marginLeft: "0.5rem" }} /> {visitCount}
          </div>
          <span className={styles.scoreNum}>{(score * 100).toFixed(0)}%</span>
        </div>
        <div className="score-bar">
          <div className="score-bar-fill" style={{ width: `${fillPct}%` }} />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.submitter}>by @{submitter.username}</span>
          {localReviewCount ? (
            <span className="badge badge-local">
              <Star size={9} /> {localReviewCount} locals
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
