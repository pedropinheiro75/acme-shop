// Applies every SQL file in migrations/ that this database has not seen yet.
// Safe to run on every start: stackfork runs it as the plan's `schema` step.
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function main() {
  const dir = path.join(__dirname, '..', 'migrations');
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const done = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  let applied = 0;
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [f]);
      await client.query('COMMIT');
      console.log(`migrate: applied ${f}`);
      applied++;
    } catch (e) {
      await client.query('ROLLBACK');
      throw new Error(`${f}: ${e.message}`);
    } finally {
      client.release();
    }
  }
  console.log(`migrate: ${applied} new, ${files.length} total, database is up to date`);
  await pool.end();
}

main().catch((e) => {
  console.error('migrate failed:', e.message);
  process.exit(1);
});
