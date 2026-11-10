// Takes orders from the Redis queue, "charges" them with the payment key
// (a secret) and emails a receipt through the environment's own Mailpit.
const crypto = require('crypto');
const { createClient } = require('redis');
const nodemailer = require('nodemailer');
const { pool } = require('./db');
const { readSecret, fingerprint } = require('./secrets');

const redis = createClient({ url: process.env.REDIS_URL });
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function handle(id) {
  const key = readSecret('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  const r = await pool.query(
    `SELECT o.*, p.name AS product, p.emoji FROM orders o JOIN products p ON p.id = o.product_id WHERE o.id = $1`,
    [id]
  );
  if (!r.rowCount) return;
  const order = r.rows[0];
  await sleep(1200); // pretend to talk to the payment provider
  const chargeId = 'ch_' + crypto.randomBytes(6).toString('hex');
  await pool.query(`UPDATE orders SET status = 'paid', charge_id = $2, paid_at = now() WHERE id = $1`, [id, chargeId]);
  await mailer.sendMail({
    from: 'Acme Shop <orders@acme.test>',
    to: order.email,
    subject: `Receipt for order #${order.id}: ${order.emoji} ${order.product}`,
    text: `Thanks! We charged $${(order.amount_cents / 100).toFixed(2)} (charge ${chargeId}).`,
  });
  console.log(`worker: order #${id} paid (${chargeId}), receipt sent to ${order.email}`);
}

async function main() {
  await redis.connect();
  console.log(`worker: ready, payment key ${fingerprint(readSecret('STRIPE_SECRET_KEY')) || 'MISSING'}`);
  for (;;) {
    const item = await redis.brPop('orders', 0);
    try {
      await handle(item.element);
    } catch (e) {
      console.error(`worker: order #${item.element} failed: ${e.message}`);
      await pool.query(`UPDATE orders SET status = 'failed' WHERE id = $1`, [item.element]).catch(() => {});
    }
  }
}

main().catch((e) => {
  console.error('worker crashed:', e.message);
  process.exit(1);
});
