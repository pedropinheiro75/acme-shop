const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

async function columnExists(table, column) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return r.rowCount > 0;
}

async function tableExists(table) {
  const r = await pool.query(`SELECT to_regclass($1) AS t`, [table]);
  return r.rows[0].t !== null;
}

module.exports = { pool, columnExists, tableExists };
