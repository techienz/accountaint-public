#!/usr/bin/env node
// Runs database migrations, then starts the Next.js standalone server.
// Used as the container entrypoint so a fresh `data/` volume auto-initialises.

import { readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const dbPath = process.env.DATABASE_PATH || "/data/accountaint.db";
const migrationsDir = process.env.MIGRATIONS_DIR || "/app/drizzle";

// Ensure parent dir exists
const parent = dirname(dbPath);
if (!existsSync(parent)) {
  mkdirSync(parent, { recursive: true });
}

console.log(`[init] Opening database at ${dbPath}`);
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Track applied migrations (drizzle's naming convention)
const createTrackingTable = `
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL,
    created_at INTEGER
  )
`;
db.prepare(createTrackingTable).run();

const applied = new Set(
  db.prepare("SELECT hash FROM __drizzle_migrations").all().map((r) => r.hash)
);

if (!existsSync(migrationsDir)) {
  console.warn(
    `[init] No migrations dir at ${migrationsDir} — skipping migrations.`
  );
} else {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const hash = file;
    if (applied.has(hash)) continue;

    console.log(`[init] Applying migration ${file}`);
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    const tx = db.transaction(() => {
      for (const stmt of statements) {
        db.prepare(stmt).run();
      }
      db.prepare(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)"
      ).run(hash, Date.now());
    });
    tx();
  }
  console.log(`[init] Migrations complete.`);
}

db.close();

console.log(`[init] Starting server...`);
await import("/app/server.js");
