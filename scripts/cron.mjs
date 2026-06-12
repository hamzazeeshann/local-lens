/**
 * Cron job script — run with: node scripts/cron.mjs
 * Or set up as a Windows Task Scheduler task every 10 minutes.
 *
 * Jobs:
 *  1. Mark "viral" — places with >= 10 visits in last 48h
 *  2. Mark "possibly_closed" — places with no activity in 180 days
 *  3. Reset viral status — places no longer spiking
 */

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://locallens:secret@localhost:5432/locallens";

async function runCron() {
  // Use raw pg since this runs outside Next.js
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    console.log("[cron] Starting...");

    // 1. Mark viral — spike of visits in last 48 hours
    const viralResult = await pool.query(`
      UPDATE places
      SET status = 'viral'
      WHERE id IN (
        SELECT place_id
        FROM place_visits
        WHERE visited_at >= NOW() - INTERVAL '48 hours'
        GROUP BY place_id
        HAVING COUNT(*) >= 10
      )
      AND status != 'possibly_closed'
      RETURNING id, name
    `);
    console.log(`[cron] Marked viral: ${viralResult.rowCount} places`);

    // 2. Reset viral — places that haven't had 10 visits in last 48h but are still marked viral
    const resetViral = await pool.query(`
      UPDATE places
      SET status = 'active'
      WHERE status = 'viral'
      AND id NOT IN (
        SELECT place_id
        FROM place_visits
        WHERE visited_at >= NOW() - INTERVAL '48 hours'
        GROUP BY place_id
        HAVING COUNT(*) >= 10
      )
      RETURNING id, name
    `);
    console.log(`[cron] Reset viral->active: ${resetViral.rowCount} places`);

    // 3. Mark possibly_closed — no activity in 180 days
    const closedResult = await pool.query(`
      UPDATE places
      SET status = 'possibly_closed'
      WHERE last_activity < NOW() - INTERVAL '180 days'
      AND status = 'active'
      RETURNING id, name
    `);
    console.log(`[cron] Marked possibly_closed: ${closedResult.rowCount} places`);

    // 4. Recompute scores for all places (score = likes / visits, normalized 0-1)
    await pool.query(`
      UPDATE places
      SET score = CASE
        WHEN visit_count = 0 THEN 0
        ELSE LEAST(1.0, CAST(like_count AS DECIMAL) / CAST(visit_count AS DECIMAL))
      END
    `);
    console.log("[cron] Scores recomputed");

    console.log("[cron] Done.");
  } finally {
    await pool.end();
  }
}

runCron().catch((e) => { console.error("[cron] Error:", e); process.exit(1); });
