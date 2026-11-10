// Fills a NEW database with demo data. stackfork runs this once per data
// volume (the plan's `data` step), after the migrations. Restarting an
// environment never runs it again, so your test data survives.
const { pool } = require('./db');

const products = [
  ['KB-001', 'Mechanical Keyboard', 'Hot-swappable, brown switches', '⌨️', 12900, 40],
  ['MS-002', 'Wireless Mouse', 'Silent clicks, 70 days battery', '🖱️', 4900, 120],
  ['HP-003', 'Noise-cancelling Headphones', 'For deep work in open offices', '🎧', 24900, 25],
  ['MN-004', '4K Monitor 27"', 'USB-C, 90W charging', '🖥️', 39900, 12],
  ['CF-005', 'Developer Coffee', 'Single origin, extra caffeine', '☕', 1900, 300],
  ['DK-006', 'Standing Desk', 'Electric, memory presets', '🪑', 54900, 8],
  ['LP-007', 'Laptop Stand', 'Aluminium, foldable', '💻', 5900, 60],
  ['RD-008', 'Rubber Duck', 'Senior debugging consultant', '🦆', 900, 999],
];

const customers = [
  ['ana@acme.test', 'Ana Souza'],
  ['bruno@acme.test', 'Bruno Lima'],
  ['carla@acme.test', 'Carla Mendes'],
  ['diego@acme.test', 'Diego Rocha'],
];

async function main() {
  for (const [sku, name, description, emoji, price, stock] of products) {
    await pool.query(
      `INSERT INTO products (sku, name, description, emoji, price_cents, stock)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (sku) DO NOTHING`,
      [sku, name, description, emoji, price, stock]
    );
  }
  for (const [email, name] of customers) {
    await pool.query(`INSERT INTO customers (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`, [email, name]);
  }
  // Same discounts as migrations/003: a new database gets its products
  // after the migrations ran, so the migration's UPDATE found nothing.
  await pool.query('UPDATE products SET discount_pct = 30 WHERE id % 2 = 0');
  await pool.query('UPDATE products SET discount_pct = 15 WHERE id % 3 = 0 AND discount_pct = 0');
  console.log(`seed: ${products.length} products, ${customers.length} customers`);
  await pool.end();
}

main().catch((e) => {
  console.error('seed failed:', e.message);
  process.exit(1);
});
