const http = require('http');
const { createClient } = require('redis');
const { pool, tableExists } = require('./db');
const { secretStatus } = require('./secrets');

const PORT = Number(process.env.PORT || 3000);
const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (e) => console.error('redis:', e.message));

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}

async function environmentInfo() {
  const [cluster, migrations, counts] = await Promise.all([
    // Unique per Postgres cluster: two environments never share one.
    pool.query('SELECT system_identifier::text AS id FROM pg_control_system()'),
    tableExists('schema_migrations').then((ok) =>
      ok ? pool.query('SELECT name FROM schema_migrations ORDER BY name') : { rows: [] }
    ),
    tableExists('orders').then((ok) =>
      ok
        ? pool.query(`SELECT (SELECT count(*) FROM products)::int AS products,
                             (SELECT count(*) FROM customers)::int AS customers,
                             (SELECT count(*) FROM orders)::int AS orders`)
        : { rows: [{}] }
    ),
  ]);
  return {
    storeName: process.env.STORE_NAME || 'Acme Shop',
    announcement: process.env.ANNOUNCEMENT || '',
    databaseCluster: cluster.rows[0].id,
    migrations: migrations.rows.map((r) => r.name),
    counts: counts.rows[0],
    secrets: secretStatus(['STRIPE_SECRET_KEY', 'JWT_SECRET']),
    container: require('os').hostname(),
  };
}

const routes = {
  'GET /api/health': async () => ({ ok: true }),
  'GET /api/environment': environmentInfo,
  'GET /api/products': async () => (await pool.query('SELECT * FROM products ORDER BY id')).rows,
  'GET /api/orders': async () =>
    (
      await pool.query(
        `SELECT o.*, p.name AS product, p.emoji FROM orders o
         JOIN products p ON p.id = o.product_id ORDER BY o.id DESC LIMIT 8`
      )
    ).rows,
  'POST /api/orders': async (req) => {
    const { productId, email } = await readBody(req);
    const p = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (!p.rowCount) return [404, { error: 'unknown product' }];
    const product = p.rows[0];
    const amount = Math.round(product.price_cents * (1 - (product.discount_pct || 0) / 100));
    const o = await pool.query(
      `INSERT INTO orders (product_id, email, amount_cents) VALUES ($1, $2, $3) RETURNING *`,
      [product.id, email || 'demo@acme.test', amount]
    );
    await redis.lPush('orders', String(o.rows[0].id));
    return [201, o.rows[0]];
  },
};

const server = http.createServer(async (req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`;
  const handler = routes[key];
  if (!handler) return send(res, 404, { error: 'not found' });
  try {
    const out = await handler(req);
    if (Array.isArray(out) && typeof out[0] === 'number') return send(res, out[0], out[1]);
    send(res, 200, out);
  } catch (e) {
    console.error(key, e.message);
    send(res, 500, { error: e.message });
  }
});

redis.connect().then(() => {
  server.listen(PORT, () => console.log(`api listening on :${PORT}`));
});
