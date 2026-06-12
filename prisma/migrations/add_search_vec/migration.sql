-- Add search_vec column for full-text search
ALTER TABLE cities ADD COLUMN search_vec tsvector;

-- Create index for better search performance
CREATE INDEX idx_cities_search_vec ON cities USING gin(search_vec);

-- Trigger to auto-update search_vec when city name changes
CREATE OR REPLACE FUNCTION update_cities_search_vec()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vec := to_tsvector('simple', NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cities_search_vec ON cities;
CREATE TRIGGER trg_cities_search_vec
  BEFORE INSERT OR UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_cities_search_vec();
