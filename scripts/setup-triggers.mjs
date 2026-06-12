/**
 * SQL migration script — creates PostgreSQL triggers and functions
 * for auto-computing scores and detecting local reviewers.
 *
 * Run AFTER prisma migrate dev:
 *   node scripts/setup-triggers.mjs
 */

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://locallens:secret@localhost:5432/locallens";

async function setupTriggers() {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    // Trigger 1: Auto-update score when like_count or visit_count changes
    await pool.query(`
      CREATE OR REPLACE FUNCTION compute_place_score()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.score := CASE
          WHEN NEW.visit_count = 0 THEN 0
          ELSE LEAST(1.0, CAST(NEW.like_count AS DECIMAL) / CAST(NEW.visit_count AS DECIMAL))
        END;
        NEW.last_activity := NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trg_compute_score ON places;
      CREATE TRIGGER trg_compute_score
        BEFORE UPDATE OF like_count, visit_count ON places
        FOR EACH ROW
        EXECUTE FUNCTION compute_place_score();
    `);
    console.log("✅ Score trigger created");

    // Trigger 2: Auto-set is_local on review insert
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_review_is_local()
      RETURNS TRIGGER AS $$
      DECLARE
        reviewer_city_id INT;
        place_city_id INT;
      BEGIN
        SELECT city_id INTO reviewer_city_id FROM users WHERE id = NEW.user_id;
        SELECT city_id INTO place_city_id FROM places WHERE id = NEW.place_id;
        NEW.is_local := (reviewer_city_id IS NOT NULL AND reviewer_city_id = place_city_id);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trg_set_is_local ON reviews;
      CREATE TRIGGER trg_set_is_local
        BEFORE INSERT ON reviews
        FOR EACH ROW
        EXECUTE FUNCTION set_review_is_local();
    `);
    console.log("✅ Local badge trigger created");

    // GIN index for full-text search on cities
    await pool.query(`
      ALTER TABLE cities ADD COLUMN IF NOT EXISTS search_vec tsvector;
      UPDATE cities SET search_vec = to_tsvector('english', name);
      CREATE INDEX IF NOT EXISTS idx_cities_fts ON cities USING GIN(search_vec);
    `);
    console.log("✅ FTS index created on cities");

    // Spatial indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_places_city ON places(city_id);
      CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
      CREATE INDEX IF NOT EXISTS idx_places_score ON places(score DESC);
      CREATE INDEX IF NOT EXISTS idx_place_visits_place ON place_visits(place_id, visited_at);
      CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id);
    `);
    console.log("✅ Performance indexes created");

    console.log("\n🎉 All database triggers and indexes set up successfully!");
  } finally {
    await pool.end();
  }
}

setupTriggers().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
