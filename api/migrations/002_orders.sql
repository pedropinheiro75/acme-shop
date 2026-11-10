-- 002: orders, filled by the api and settled by the worker
CREATE TABLE orders (
  id          serial PRIMARY KEY,
  product_id  integer NOT NULL REFERENCES products(id),
  email       text NOT NULL,
  amount_cents integer NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  charge_id   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  paid_at     timestamptz
);

CREATE INDEX orders_created_at_idx ON orders (created_at DESC);
