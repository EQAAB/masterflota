/**
 * Apply pending SQL migrations from backend/sql/migrations in numeric order.
 * Skips *.verify.sql, *.rollback.sql, and *.testcases.md.
 *
 * Usage (from backend/):
 *   node scripts/apply-all-migrations.mjs          # apply pending only
 *   node scripts/apply-all-migrations.mjs --init     # run schema.sql first if DB is empty
 *   node scripts/apply-all-migrations.mjs --dry-run  # list pending migrations
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "../sql/migrations");
const schemaPath = path.join(__dirname, "../sql/schema.sql");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const initSchema = args.has("--init");

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is required in backend/.env");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function isMigrationFile(name) {
  return (
    /^\d{3}_.+\.sql$/i.test(name) &&
    !name.endsWith(".verify.sql") &&
    !name.endsWith(".rollback.sql")
  );
}

function listMigrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter(isMigrationFile)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function isDatabaseEmpty() {
  const { rows } = await pool.query(
    `SELECT to_regclass('public.organizations') IS NULL AS empty`,
  );
  return Boolean(rows[0]?.empty);
}

async function appliedFilenames() {
  const { rows } = await pool.query(`SELECT filename FROM schema_migrations ORDER BY filename`);
  return new Set(rows.map((r) => r.filename));
}

async function applySqlFile(label, filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    if (label !== "schema.sql") {
      await client.query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [label]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

try {
  await ensureMigrationsTable();

  if (initSchema || (await isDatabaseEmpty())) {
    if (dryRun) {
      console.log("[dry-run] Would apply schema.sql (empty database)");
    } else {
      console.log("Applying schema.sql...");
      await applySqlFile("schema.sql", schemaPath);
      console.log("  OK");
    }
  }

  const applied = await appliedFilenames();
  const pending = listMigrationFiles().filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    process.exit(0);
  }

  console.log(`Pending migrations: ${pending.length}`);
  for (const file of pending) {
    if (dryRun) {
      console.log(`  [dry-run] ${file}`);
      continue;
    }
    console.log(`Applying ${file}...`);
    await applySqlFile(file, path.join(migrationsDir, file));
    console.log("  OK");
  }
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
