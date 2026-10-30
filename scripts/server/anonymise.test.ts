import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { anonymise, anonymisers, tablesWithoutPersonalData } from "./anonymise";

const root = fileURLToPath(new URL("../../", import.meta.url));
const migrationDir = path.join(root, "src/migrations");
const migrations = readdirSync(migrationDir)
  .filter((name) => name.endsWith(".ts"))
  .map((name) => readFileSync(path.join(migrationDir, name), "utf8"));
const initial = readFileSync(
  path.join(migrationDir, "20261029_161534_initial.ts"),
  "utf8",
).replaceAll("\\`", "`");
const originalEmail = "private-person-with-unique-email@example.org";
const databases: DatabaseSync[] = [];
const directories: string[] = [];

function fixture(filename = ":memory:") {
  const db = new DatabaseSync(filename);
  databases.push(db);
  for (const match of initial.matchAll(
    /CREATE (?:TABLE|UNIQUE INDEX) `[^`]+`[\s\S]*?;/g,
  )) {
    db.exec(match[0]);
  }
  db.prepare(
    `INSERT INTO users
    (id, name, email, salt, hash, reset_password_token, reset_password_expiration,
     reset_password_requested_at, login_attempts, lock_until)
    VALUES (7, 'Private Person', ?, 'secret-salt', 'secret-hash', 'reset-token',
      '2027-01-01', '2026-10-29', 9, '2027-01-01')`,
  ).run(originalEmail);
  db.exec(`
    INSERT INTO users_roles (id, "order", parent_id, value) VALUES (1, 1, 7, 'admin');
    INSERT INTO users_sessions (_order, _parent_id, id, expires_at)
      VALUES (1, 7, 'private-session', '2027-01-01');
    INSERT INTO payload_preferences (id, key, value) VALUES (1, 'user', 'private-state');
    INSERT INTO payload_preferences_rels (id, parent_id, path, users_id)
      VALUES (1, 1, 'user', 7);
    INSERT INTO payload_locked_documents (id, global_slug) VALUES (1, 'information');
    INSERT INTO payload_locked_documents_rels (id, parent_id, path, users_id)
      VALUES (1, 1, 'user', 7);
    INSERT INTO media (id, alt, filename) VALUES (1, 'Public studio photo', 'studio.webp');
    INSERT INTO payload_kv (id, key, data) VALUES (1, 'public-setting', '{"hello":true}');
  `);
  return db;
}

function tempDir() {
  mkdirSync(path.join(root, "node_modules/.cache"), { recursive: true });
  const dir = mkdtempSync(path.join(root, "node_modules/.cache/db-pull-test-"));
  directories.push(dir);
  return dir;
}

afterEach(() => {
  for (const db of databases.splice(0)) {
    if (db.isOpen) db.close();
  }
  for (const dir of directories.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

describe("server anonymisation", () => {
  it("rewrites users, clears user state and leaves every content table untouched", () => {
    const db = fixture();
    const contentBefore = tablesWithoutPersonalData.map((table) =>
      db.prepare(`SELECT * FROM "${table}"`).all(),
    );
    const report = anonymise(db);
    expect(db.prepare("SELECT * FROM users").get()).toMatchObject({
      id: 7,
      email: "user-7@example.invalid",
      name: "User 7",
      salt: null,
      hash: null,
      reset_password_token: null,
      reset_password_expiration: null,
      reset_password_requested_at: null,
      lock_until: null,
      login_attempts: 0,
    });
    for (const table of Object.keys(anonymisers).filter(
      (table) => table !== "users",
    )) {
      expect(db.prepare(`SELECT * FROM "${table}"`).all()).toEqual([]);
    }
    expect(
      tablesWithoutPersonalData.map((table) =>
        db.prepare(`SELECT * FROM "${table}"`).all(),
      ),
    ).toEqual(contentBefore);
    expect(report.tablesHandled).toHaveLength(39);
    expect(report.rowsChanged).toBe(6);
  });

  it("rejects all unclassified tables before changing any rows", () => {
    const db = fixture();
    db.exec(
      "CREATE TABLE bookings (email TEXT); CREATE TABLE customers (name TEXT)",
    );
    expect(() => anonymise(db)).toThrow(
      /bookings.*customers.*classify.*scripts\/server\/anonymise\.ts/i,
    );
    expect(db.prepare("SELECT email FROM users").get()?.email).toBe(
      originalEmail,
    );
    expect(
      db.prepare("SELECT count(*) AS n FROM users_sessions").get()?.n,
    ).toBe(1);
    expect(db.isTransaction).toBe(false);
  });

  it("rejects a missing expected column without changing rows", () => {
    const db = fixture();
    db.exec("ALTER TABLE users DROP COLUMN reset_password_requested_at");
    expect(() => anonymise(db)).toThrow(/users.*reset_password_requested_at/i);
    expect(db.prepare("SELECT email FROM users").get()?.email).toBe(
      originalEmail,
    );
    expect(
      db.prepare("SELECT count(*) AS n FROM users_sessions").get()?.n,
    ).toBe(1);
  });

  it("rejects unclassified users columns before changing rows", () => {
    const db = fixture();
    db.exec(
      "ALTER TABLE users ADD COLUMN api_key TEXT; ALTER TABLE users ADD COLUMN phone TEXT",
    );
    expect(() => anonymise(db)).toThrow(
      /users columns: api_key, phone.*classify.*scripts\/server\/anonymise\.ts/i,
    );
    expect(db.prepare("SELECT email FROM users").get()?.email).toBe(
      originalEmail,
    );
    expect(
      db.prepare("SELECT count(*) AS n FROM users_sessions").get()?.n,
    ).toBe(1);
    expect(db.isTransaction).toBe(false);
  });

  it("rolls back every change if an anonymiser fails", () => {
    const db = fixture();
    db.exec(`CREATE TRIGGER refuse_user_update BEFORE UPDATE ON users
      BEGIN SELECT RAISE(ABORT, 'fixture failure'); END`);
    expect(() => anonymise(db)).toThrow("fixture failure");
    expect(
      db.prepare("SELECT count(*) AS n FROM payload_preferences").get()?.n,
    ).toBe(1);
    expect(
      db.prepare("SELECT count(*) AS n FROM users_sessions").get()?.n,
    ).toBe(1);
    expect(db.prepare("SELECT email FROM users").get()?.email).toBe(
      originalEmail,
    );
  });

  it("classifies every migration table exactly once, with no stale registry entries", () => {
    const tables = new Set(
      migrations.flatMap((source) =>
        [
          ...source.replaceAll("\\`", "`").matchAll(/CREATE TABLE `([^`]+)`/g),
        ].map((match) => match[1]),
      ),
    );
    const registered = [
      ...Object.keys(anonymisers),
      ...tablesWithoutPersonalData,
    ];
    expect(tables.size).toBeGreaterThan(0);
    expect(new Set(registered).size).toBe(registered.length);
    expect([...registered].sort()).toEqual([...tables].sort());
  });

  it("runs with plain Node and removes original emails from the file and WAL", () => {
    const filename = path.join(tempDir(), "payload.db");
    const db = fixture(filename);
    db.exec("PRAGMA journal_mode=WAL");
    db.prepare("UPDATE users SET name = ?").run(originalEmail.repeat(2000));
    db.close();
    expect(readFileSync(filename).includes(Buffer.from(originalEmail))).toBe(
      true,
    );
    const result = spawnSync(
      process.execPath,
      ["--no-warnings", "scripts/server/anonymise.ts", filename],
      { cwd: root, encoding: "utf8" },
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/39 tables.*6 rows/i);
    expect(readFileSync(filename).includes(Buffer.from(originalEmail))).toBe(
      false,
    );
    expect(existsSync(`${filename}-wal`)).toBe(false);
    expect(existsSync(`${filename}-shm`)).toBe(false);
  });

  it("exits non-zero when the CLI encounters an unknown table", () => {
    const filename = path.join(tempDir(), "payload.db");
    const db = fixture(filename);
    db.exec("CREATE TABLE bookings (email TEXT)");
    db.close();
    const result = spawnSync(
      process.execPath,
      ["--no-warnings", "scripts/server/anonymise.ts", filename],
      { cwd: root, encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("bookings");
    expect(result.stdout).toBe("");
  });
});
