/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/db";
import Link from "next/link";
import CitySearchBar from "@/components/CitySearchBar/CitySearchBar";
import PlaceCard from "@/components/PlaceCard/PlaceCard";
import { serializePlaces } from "@/lib/serialize";
import styles from "./page.module.css";
import { TrendingUp, Gem, Zap, Globe, Clock } from "lucide-react";

async function getHomepageData() {
  try {
    const [trending, underrated, viral, recent] = await Promise.all([
      prisma.place.findMany({
        where: { status: { not: "possibly_closed" } },
        orderBy: [{ visitCount: "desc" }, { likeCount: "desc" }],
        take: 8,
        include: { city: { include: { country: true } }, submitter: { select: { username: true } } },
      }),
      prisma.place.findMany({
        where: { visitCount: { gt: 5 }, status: { not: "possibly_closed" } },
        orderBy: { score: "desc" },
        take: 8,
        include: { city: { include: { country: true } }, submitter: { select: { username: true } } },
      }),
      prisma.place.findMany({
        where: { status: "viral" },
        take: 4,
        include: { city: { include: { country: true } }, submitter: { select: { username: true } } },
      }),
      prisma.place.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { city: { include: { country: true } }, submitter: { select: { username: true } } },
      }),
    ]);

    const stats = await prisma.$queryRaw<[{ places: bigint; cities: bigint; users: bigint }]>`
      SELECT COUNT(DISTINCT p.id) AS places,
             COUNT(DISTINCT p.city_id) AS cities,
             COUNT(DISTINCT u.id) AS users
      FROM places p, users u
    `;

    return {
      trending: serializePlaces(trending as any[]),
      underrated: serializePlaces(underrated as any[]),
      viral: serializePlaces(viral as any[]),
      recent: serializePlaces(recent as any[]),
      stats: stats[0],
    };
  } catch {
    // DB not available yet — return empty state
    return { trending: [], underrated: [], viral: [], recent: [], stats: null };
  }
}


export default async function HomePage() {
  const { trending, underrated, viral, recent, stats } = await getHomepageData();

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroDots} />
        <div className="container">
          <div className={styles.heroContent}>
            <div className={`badge badge-amber ${styles.heroPill}`}>
              <Gem size={11} /> Community-powered discovery
            </div>
            <h1 className={styles.heroTitle}>
              Find the places<br />
              <span className="gradient-text">locals actually love</span>
            </h1>
            <p className={styles.heroSub}>
              Skip the tourist traps. Every spot on Local Lens was submitted by a real person
              who genuinely loves it — ranked by community trust, not paid placement.
            </p>
            <div className={styles.heroSearch}>
              <CitySearchBar />
            </div>
            {/* Stats */}
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <Globe size={14} />
                <span><strong>{Number(stats?.cities ?? 0)}</strong> cities</span>
              </div>
              <div className={styles.statDot} />
              <div className={styles.stat}>
                <span><strong>{Number(stats?.places ?? 0)}</strong> places</span>
              </div>
              <div className={styles.statDot} />
              <div className={styles.stat}>
                <span><strong>{Number(stats?.users ?? 0)}</strong> locals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Going Viral ──────────────────────────────────── */}
      {viral.length > 0 && (
        <section className={`section ${styles.viralSection}`}>
          <div className="container">
            <div className={styles.sectionHead}>
              <h2><Zap size={20} className={styles.iconAmber} /> Going Viral</h2>
              <p className={styles.sectionSub}>Spotted a sudden spike in attention</p>
            </div>
            <div className="scroll-strip">
              {viral.map((p: any) => (
                <div key={p.id} style={{ width: 280 }}>
                  <PlaceCard
                    id={p.id} name={p.name} description={p.description}
                    category={p.category}
                    city={p.city.name} country={p.city.country.name}
                    likeCount={p.likeCount} visitCount={p.visitCount}
                    score={Number(p.score)} status={p.status}
                    photoUrls={p.photoUrls}
                    submitter={{ username: p.submitter.username }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Trending ─────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <h2><TrendingUp size={20} className={styles.iconAmber} /> Hot Right Now</h2>
            <p className={styles.sectionSub}>Most visited places across all cities</p>
          </div>
          <div className="scroll-strip">
            {trending.map((p: any) => (
              <div key={p.id} style={{ width: 280 }}>
                <PlaceCard
                  id={p.id} name={p.name} description={p.description}
                  category={p.category}
                  city={p.city.name} country={p.city.country.name}
                  likeCount={p.likeCount} visitCount={p.visitCount}
                  score={Number(p.score)} status={p.status}
                  photoUrls={p.photoUrls}
                  submitter={{ username: p.submitter.username }}
                />
              </div>
            ))}
          </div>
          {trending.length === 0 && <EmptyState />}
        </div>
      </section>

      {/* ─── Underrated Gems ──────────────────────────────── */}
      <section className="section" style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2><Gem size={20} className={styles.iconAmber} /> Underrated Gems</h2>
            <p className={styles.sectionSub}>Highest likes-to-visits ratio — the hidden ones that truly deliver</p>
          </div>
          <div className="grid-places">
            {underrated.map((p: any) => (
              <PlaceCard
                key={p.id} id={p.id} name={p.name} description={p.description}
                category={p.category}
                city={p.city.name} country={p.city.country.name}
                likeCount={p.likeCount} visitCount={p.visitCount}
                score={Number(p.score)} status={p.status}
                photoUrls={p.photoUrls}
                submitter={{ username: p.submitter.username }}
              />
            ))}
          </div>
          {underrated.length === 0 && <EmptyState />}
        </div>
      </section>

      {/* ─── Recently Added ───────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <h2><Clock size={20} className={styles.iconAmber} /> Recently Added</h2>
            <p className={styles.sectionSub}>Fresh discoveries from the community</p>
          </div>
          <div className="grid-places">
            {recent.map((p: any) => (
              <PlaceCard
                key={p.id} id={p.id} name={p.name} description={p.description}
                category={p.category}
                city={p.city.name} country={p.city.country.name}
                likeCount={p.likeCount} visitCount={p.visitCount}
                score={Number(p.score)} status={p.status}
                photoUrls={p.photoUrls}
                submitter={{ username: p.submitter.username }}
              />
            ))}
          </div>
          {recent.length === 0 && <EmptyState />}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaInner}>
            <h2>Know a hidden gem?</h2>
            <p>Share it with the community. Your city needs your local knowledge.</p>
            <Link href="/submit" className="btn btn-primary" style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
              Add a Place →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-3)" }}>
      <p>No places yet — be the first to add one!</p>
      <Link href="/submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
        Add a Place
      </Link>
    </div>
  );
}
