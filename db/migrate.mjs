import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { existsSync } from "node:fs";

const envPath = path.join(process.cwd(), ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const { Pool } = createRequire(import.meta.url)("pg");
const root = process.cwd();
const directory = path.join(root, "db", "migrations");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL est requise pour appliquer les migrations");
}

const pool = new Pool({ connectionString });
const client = await pool.connect();

try {
  await client.query("create table if not exists schema_migrations (filename text primary key, applied_at timestamptz not null default now())");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();

  for (const filename of files) {
    const { rowCount } = await client.query("select 1 from schema_migrations where filename = $1", [filename]);
    if (rowCount) continue;

    const sql = await readFile(path.join(directory, filename), "utf8");
    try {
      await client.query(sql);
      await client.query("insert into schema_migrations (filename) values ($1)", [filename]);
      console.log(`[db] migration appliquee: ${filename}`);
    } catch (error) {
      throw error;
    }
  }
} finally {
  client.release();
  await pool.end();
}
