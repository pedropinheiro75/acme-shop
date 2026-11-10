-- 001: the catalog
CREATE TABLE products (
  id          serial PRIMARY KEY,
  sku         text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji       text NOT NULL DEFAULT '📦',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  stock       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id         serial PRIMARY KEY,
  email      text UNIQUE NOT NULL,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
