CREATE TABLE IF NOT EXISTS brands (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS models (
  id text PRIMARY KEY,
  brand_id text NOT NULL REFERENCES brands(id),
  name text NOT NULL,
  UNIQUE (brand_id, name)
);
CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  model_id text NOT NULL REFERENCES models(id),
  year integer NOT NULL,
  trim text NOT NULL,
  body_style text,
  engine_code text NOT NULL,
  displacement_l numeric(3,1),
  specifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (model_id, year, trim)
);
CREATE TABLE IF NOT EXISTS transmissions (
  id bigserial PRIMARY KEY,
  vehicle_id text NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  name text NOT NULL,
  UNIQUE (vehicle_id, name)
);
CREATE TABLE IF NOT EXISTS maintenance_items (
  id bigserial PRIMARY KEY,
  vehicle_id text NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  interval text,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS documents (
  id bigserial PRIMARY KEY,
  vehicle_id text NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  title text NOT NULL,
  document_type text NOT NULL,
  url text NOT NULL
);
CREATE INDEX IF NOT EXISTS vehicles_year_idx ON vehicles(year);
CREATE INDEX IF NOT EXISTS vehicles_engine_idx ON vehicles(engine_code);
