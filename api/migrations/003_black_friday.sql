-- 003: Black Friday discounts, only on this branch
ALTER TABLE products ADD COLUMN discount_pct integer NOT NULL DEFAULT 0
  CHECK (discount_pct BETWEEN 0 AND 90);

UPDATE products SET discount_pct = 30 WHERE id % 2 = 0;
UPDATE products SET discount_pct = 15 WHERE id % 3 = 0 AND discount_pct = 0;
