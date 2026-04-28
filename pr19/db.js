const { Pool } = require("pg");
require("dotenv").config();

const useSsl = String(process.env.DATABASE_SSL || "false").toLowerCase() === "true";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE || "pr19",
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        ssl: useSsl ? { rejectUnauthorized: false } : false,
      }
);

const USER_SELECT_COLUMNS = `
  id,
  first_name,
  last_name,
  age,
  EXTRACT(EPOCH FROM created_at)::BIGINT AS created_at,
  EXTRACT(EPOCH FROM updated_at)::BIGINT AS updated_at
`;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      age INTEGER NOT NULL CHECK (age >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function findUserById(id) {
  const { rows } = await pool.query(
    `SELECT ${USER_SELECT_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  pool,
  initDb,
  findUserById,
  USER_SELECT_COLUMNS,
};
