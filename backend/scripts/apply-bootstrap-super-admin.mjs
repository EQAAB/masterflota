import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const EMAIL = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL ?? "owner@example.com";
const PASSWORD = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD ?? "FleetAdmin123!";
const FIRST_NAME = process.env.BOOTSTRAP_SUPER_ADMIN_FIRST_NAME ?? "System";
const LAST_NAME = process.env.BOOTSTRAP_SUPER_ADMIN_LAST_NAME ?? "Owner";

try {
  const existing = await pool.query(
    `SELECT u.email FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'super_admin'`,
  );
  if (existing.rows.length > 0) {
    console.log("Super admin already exists:", existing.rows.map((r) => r.email).join(", "));
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (
        organization_id, email, password_hash, first_name, last_name, role_id, is_active
      )
      SELECT NULL, $1, $2, $3, $4, r.id, true
      FROM roles r
      WHERE r.name = 'super_admin'
      RETURNING id::text, email`,
    [EMAIL.toLowerCase(), passwordHash, FIRST_NAME, LAST_NAME],
  );

  if (!rows[0]) {
    console.error("Failed: super_admin role not found. Apply migration 091 first.");
    process.exitCode = 1;
  } else {
    console.log("Bootstrap super_admin created:");
    console.log("  id:", rows[0].id);
    console.log("  email:", rows[0].email);
    console.log("  password:", PASSWORD);
    console.log("(Change this password after first login.)");
  }
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
