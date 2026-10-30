// Future booking/customer tables need an anonymiser here; the classification guard enforces it.
import { statSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

export interface AnonymiseReport {
  tablesHandled: string[];
  rowsChanged: number;
}

const userColumns = [
  "email",
  "name",
  "salt",
  "hash",
  "reset_password_token",
  "reset_password_expiration",
  "reset_password_requested_at",
  "lock_until",
  "login_attempts",
];

const unchangedUserColumns = ["id", "created_at", "updated_at"];

function empty(table: string): (db: DatabaseSync) => number {
  return (db) => Number(db.prepare(`DELETE FROM "${table}"`).run().changes);
}

export const anonymisers: Readonly<
  Record<string, (db: DatabaseSync) => number>
> = {
  // Delete children first so cascades do not hide rows from the report.
  users_sessions: empty("users_sessions"),
  payload_preferences_rels: empty("payload_preferences_rels"),
  payload_preferences: empty("payload_preferences"),
  payload_locked_documents_rels: empty("payload_locked_documents_rels"),
  payload_locked_documents: empty("payload_locked_documents"),
  users: (db) =>
    Number(
      db
        .prepare(
          `UPDATE users SET
    email = 'user-' || id || '@example.invalid', name = 'User ' || id,
    salt = NULL, hash = NULL, reset_password_token = NULL,
    reset_password_expiration = NULL, reset_password_requested_at = NULL,
    lock_until = NULL, login_attempts = 0`,
        )
        .run().changes,
    ),
};

export const tablesWithoutPersonalData: readonly string[] = [
  "users_roles",
  "users_rels",
  "media",
  "media_rels",
  "impressionen_images",
  "impressionen",
  "impressionen_rels",
  "payload_kv",
  "payload_migrations",
  "payload_llm_instructions",
  "payload_llm_instructions_rels",
  "site_settings_primary_nav",
  "site_settings_socials",
  "site_settings_beteiligte",
  "site_settings",
  "site_settings_rels",
  "_site_settings_v_version_primary_nav",
  "_site_settings_v_version_socials",
  "_site_settings_v_version_beteiligte",
  "_site_settings_v",
  "_site_settings_v_rels",
  "information_sections_blocks_pairs",
  "information_sections_blocks_links",
  "information_sections_blocks",
  "information_sections",
  "information",
  "information_rels",
  "_information_v_version_sections_blocks_pairs",
  "_information_v_version_sections_blocks_links",
  "_information_v_version_sections_blocks",
  "_information_v_version_sections",
  "_information_v",
  "_information_v_rels",
];

export function anonymise(db: DatabaseSync): AnonymiseReport {
  db.exec("BEGIN IMMEDIATE");
  try {
    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT GLOB 'sqlite_*' ORDER BY name`,
      )
      .all()
      .map((row) => String(row.name));
    const unknown = tables.filter(
      (table) =>
        !Object.hasOwn(anonymisers, table) &&
        !tablesWithoutPersonalData.includes(table),
    );
    if (unknown.length) {
      throw new Error(
        `Unclassified tables: ${unknown.join(", ")}. Please classify them in scripts/server/anonymise.ts: add an anonymiser for personal data, or list the table as without personal data.`,
      );
    }
    if (tables.includes("users")) {
      const columns = db
        .prepare('PRAGMA table_info("users")')
        .all()
        .map((row) => String(row.name));
      const unclassified = columns.filter(
        (column) =>
          !userColumns.includes(column) &&
          !unchangedUserColumns.includes(column),
      );
      if (unclassified.length)
        throw new Error(
          `Unclassified users columns: ${unclassified.join(", ")}. Please classify them in scripts/server/anonymise.ts: anonymise personal data, or list the column in unchangedUserColumns.`,
        );
      const missing = [...userColumns, ...unchangedUserColumns].filter(
        (column) => !columns.includes(column),
      );
      if (missing.length)
        throw new Error(
          `Schema drift in users: missing expected columns ${missing.join(", ")}`,
        );
    }
    let rowsChanged = 0;
    for (const [table, rewrite] of Object.entries(anonymisers)) {
      if (tables.includes(table)) rowsChanged += rewrite(db);
    }
    db.exec("COMMIT");
    return { tablesHandled: tables, rowsChanged };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

if (import.meta.main) {
  try {
    const filename = process.argv[2];
    if (process.argv.length !== 3 || !filename) {
      throw new Error("Usage: node --no-warnings anonymise.ts <path-to-db>");
    }
    if (!statSync(filename).isFile())
      throw new Error("Database must be an existing file");
    const db = new DatabaseSync(filename);
    let report: AnonymiseReport;
    try {
      // A DELETE journal and a closed connection leave no original values in a WAL.
      const mode = db.prepare("PRAGMA journal_mode=DELETE").get();
      if (mode?.journal_mode !== "delete")
        throw new Error("Could not disable snapshot WAL");
      report = anonymise(db);
      db.exec("VACUUM");
    } finally {
      db.close();
    }
    console.log(
      `Anonymised ${report.tablesHandled.length} tables; ${report.rowsChanged} rows changed.`,
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Anonymisation failed",
    );
    process.exitCode = 1;
  }
}
