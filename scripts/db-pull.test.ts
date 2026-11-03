import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const dirs: string[] = [];
function tempDir() {
  const cache = path.join(root, "node_modules/.cache");
  mkdirSync(cache, { recursive: true });
  const dir = mkdtempSync(path.join(cache, "pull-shell-test-"));
  dirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

function database(filename: string, unknown = false) {
  const db = new DatabaseSync(filename);
  const migration = readFileSync(
    path.join(root, "src/migrations/20261029_161534_initial.ts"),
    "utf8",
  ).replaceAll("\\`", "`");
  for (const match of migration.matchAll(/CREATE TABLE `[^`]+`[\s\S]*?;/g))
    db.exec(match[0]);
  db.exec(
    "INSERT INTO users (id, email, name) VALUES (1, 'private@example.org', 'Private Person')",
  );
  if (unknown) db.exec("CREATE TABLE bookings (email TEXT)");
  db.close();
}

describe("server snapshot using temporary databases and media", () => {
  function server(unknown = false) {
    const dir = tempDir();
    for (const name of ["data", "media", "backups"])
      mkdirSync(path.join(dir, "shared", name), { recursive: true });
    database(path.join(dir, "shared/data/payload.db"), unknown);
    writeFileSync(
      path.join(dir, "shared/media/public.webp"),
      "public image fixture",
    );
    const result = spawnSync(
      "/bin/bash",
      [path.join(root, "scripts/server/pull-snapshot.sh")],
      {
        env: {
          ...process.env,
          STUDIO_UTO_ROOT: dir,
          ANONYMISE_SCRIPT: path.join(root, "scripts/server/anonymise.ts"),
        },
      },
    );
    return { dir, result };
  }

  it("exports only an anonymised self-contained database and public media, then cleans scratch space", () => {
    const { dir, result } = server();
    expect(result.status, result.stderr.toString()).toBe(0);
    expect(result.stderr.toString()).toMatch(/39 tables/);
    const archive = path.join(dir, "snapshot.tar.gz");
    writeFileSync(archive, result.stdout);
    const extracted = path.join(dir, "extracted");
    mkdirSync(extracted);
    expect(spawnSync("tar", ["-xzf", archive, "-C", extracted]).status).toBe(0);
    expect(readdirSync(extracted).sort()).toEqual(["media", "payload.db"]);
    expect(
      readFileSync(path.join(extracted, "payload.db")).includes(
        Buffer.from("private@example.org"),
      ),
    ).toBe(false);
    const db = new DatabaseSync(path.join(extracted, "payload.db"));
    try {
      expect(db.prepare("SELECT email FROM users").get()?.email).toBe(
        "user-1@example.invalid",
      );
    } finally {
      db.close();
    }
    expect(
      readFileSync(path.join(dir, "shared/data/payload.db")).includes(
        Buffer.from("private@example.org"),
      ),
    ).toBe(true);
    expect(readdirSync(path.join(dir, "shared/backups"))).toEqual([]);
  });

  it("emits no archive bytes on classification failure and removes the private scratch copy", () => {
    const { dir, result } = server(true);
    expect(result.status).not.toBe(0);
    expect(result.stdout.length).toBe(0);
    expect(result.stderr.toString()).toContain("bookings");
    expect(readdirSync(path.join(dir, "shared/backups"))).toEqual([]);
  });
});

describe("Mac pull workflow with mocked transport and login command", () => {
  function developer() {
    const dir = tempDir();
    for (const name of [
      "scripts",
      "bin",
      "tmp",
      "data/before-pull",
      "media",
      "snapshot/media",
    ]) {
      mkdirSync(path.join(dir, name), { recursive: true });
    }
    copyFileSync(
      path.join(root, "scripts/db-pull.sh"),
      path.join(dir, "scripts/db-pull.sh"),
    );
    const db = new DatabaseSync(path.join(dir, "snapshot/payload.db"));
    db.exec(
      "CREATE TABLE marker (value TEXT); INSERT INTO marker VALUES ('pulled')",
    );
    db.close();
    writeFileSync(path.join(dir, "snapshot/media/new.webp"), "new image");
    const archive = path.join(dir, "archive.tar.gz");
    expect(
      spawnSync("tar", [
        "-czf",
        archive,
        "-C",
        path.join(dir, "snapshot"),
        "payload.db",
        "media",
      ]).status,
    ).toBe(0);
    for (const file of ["payload.db", "payload.db-wal", "payload.db-shm"])
      writeFileSync(path.join(dir, "data", file), `old ${file}`);
    writeFileSync(path.join(dir, "media/old.webp"), "old image");
    for (const name of [
      "20260101-000000",
      "20260102-000000",
      "20260103-000000",
      "20260104-000000",
    ]) {
      mkdirSync(path.join(dir, "data/before-pull", name));
    }
    const stubs = {
      ssh: 'printf "%s\\n" "$*" > "$FIXTURE_ROOT/ssh-log"\nif [ "${FIXTURE_SSH_FAIL:-}" = 1 ]; then exit 1; fi\nif [ "${FIXTURE_EMPTY:-}" != 1 ]; then cat "$FIXTURE_ROOT/archive.tar.gz"; fi',
      pnpm: 'printf "%s\\n" "$*" > "$FIXTURE_ROOT/pnpm-log"\nexit "${FIXTURE_LOGIN_STATUS:-0}"',
      lsof: 'exit "${FIXTURE_LSOF_STATUS:-1}"',
      date: 'printf "20261029-123456\\n"',
    };
    for (const [name, body] of Object.entries(stubs)) {
      const filename = path.join(dir, "bin", name);
      writeFileSync(filename, `#!/bin/bash\nset -eu\n${body}\n`);
      chmodSync(filename, 0o700);
    }
    function run(
      env: Record<string, string | undefined> = {},
      args = ["uto@fixture.invalid"],
      input = "",
    ) {
      return spawnSync(
        "/bin/bash",
        [path.join(dir, "scripts/db-pull.sh"), ...args],
        {
          cwd: path.join(dir, "tmp"),
          input,
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${dir}/bin:${process.env.PATH}`,
            FIXTURE_ROOT: dir,
            TMPDIR: `${dir}/tmp`,
            STUDIO_UTO_SSH: "",
            DB_PULL_YES: "",
            ...env,
          },
        },
      );
    }
    return { dir, run };
  }

  it("installs a validated snapshot, preserves old files, retains three backups and invokes Payload", () => {
    const { dir, run } = developer();
    const result = run({ STUDIO_UTO_SSH: "uto@default.invalid" }, []);
    expect(result.status, result.stderr).toBe(0);
    const backup = path.join(dir, "data/before-pull/20261029-123456");
    for (const file of ["payload.db", "payload.db-wal", "payload.db-shm"]) {
      expect(readFileSync(path.join(backup, file), "utf8")).toBe(`old ${file}`);
    }
    expect(readFileSync(path.join(backup, "media/old.webp"), "utf8")).toBe(
      "old image",
    );
    expect(readFileSync(path.join(dir, "media/new.webp"), "utf8")).toBe(
      "new image",
    );
    expect(readFileSync(path.join(dir, "data/payload.db"))).toEqual(
      readFileSync(path.join(dir, "snapshot/payload.db")),
    );
    expect(existsSync(path.join(dir, "data/payload.db-wal"))).toBe(false);
    expect(readdirSync(path.join(dir, "data/before-pull"))).toEqual([
      "20260103-000000",
      "20260104-000000",
      "20261029-123456",
    ]);
    expect(readFileSync(path.join(dir, "ssh-log"), "utf8")).toBe(
      "uto@default.invalid studio-uto-pull-snapshot\n",
    );
    expect(readFileSync(path.join(dir, "pnpm-log"), "utf8")).toBe(
      "exec cross-env NODE_OPTIONS=--no-deprecation payload run scripts/db-pull-local-login.ts\n",
    );
    expect(result.stdout).toContain("start pnpm dev");
    expect(readdirSync(path.join(dir, "tmp"))).toEqual([]);
  });

  it.each([{ FIXTURE_SSH_FAIL: "1" }, { FIXTURE_EMPTY: "1" }])(
    "keeps local files on transfer failure (%j)",
    (env) => {
      const { dir, run } = developer();
      expect(run(env).status).not.toBe(0);
      expect(readFileSync(path.join(dir, "data/payload.db"), "utf8")).toBe(
        "old payload.db",
      );
      expect(readdirSync(path.join(dir, "data/before-pull"))).toHaveLength(4);
      expect(existsSync(path.join(dir, "pnpm-log"))).toBe(false);
      expect(readdirSync(path.join(dir, "tmp"))).toEqual([]);
    },
  );

  it("rejects an invalid SQLite snapshot before backing up or replacing local data", () => {
    const { dir, run } = developer();
    writeFileSync(path.join(dir, "snapshot/payload.db"), "corrupt fixture");
    expect(
      spawnSync("tar", [
        "-czf",
        path.join(dir, "archive.tar.gz"),
        "-C",
        path.join(dir, "snapshot"),
        "payload.db",
        "media",
      ]).status,
    ).toBe(0);
    expect(run().status).not.toBe(0);
    expect(readFileSync(path.join(dir, "data/payload.db"), "utf8")).toBe(
      "old payload.db",
    );
    expect(existsSync(path.join(dir, "pnpm-log"))).toBe(false);
  });

  it("refuses a snapshot whose media holds a symlink", () => {
    const { dir, run } = developer();
    symlinkSync("../../.env.local", path.join(dir, "snapshot/media/leak.txt"));
    expect(
      spawnSync("tar", [
        "-czf",
        path.join(dir, "archive.tar.gz"),
        "-C",
        path.join(dir, "snapshot"),
        "payload.db",
        "media",
      ]).status,
    ).toBe(0);
    const result = run();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("links or special files");
    expect(readFileSync(path.join(dir, "data/payload.db"), "utf8")).toBe(
      "old payload.db",
    );
  });

  it("defaults to cancelling when the dev port is occupied", () => {
    const { dir, run } = developer();
    const result = run({ FIXTURE_LSOF_STATUS: "0" }, undefined, "\n");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("[y/N]");
    expect(existsSync(path.join(dir, "ssh-log"))).toBe(false);
  });

  it("allows DB_PULL_YES=1 to bypass an occupied-port prompt", () => {
    const { run } = developer();
    const result = run({ FIXTURE_LSOF_STATUS: "0", DB_PULL_YES: "1" });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toContain("port 3060");
    expect(result.stderr).not.toContain("[y/N]");
  });

  it("reports the backup location when the local login command fails", () => {
    const { dir, run } = developer();
    const result = run({ FIXTURE_LOGIN_STATUS: "1" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "Previous local files are in data/before-pull/20261029-123456",
    );
    expect(
      existsSync(path.join(dir, "data/before-pull/20261029-123456/payload.db")),
    ).toBe(true);
    expect(result.stdout).not.toContain("Pull complete");
  });

  it("requires an explicit or environment SSH target", () => {
    const { dir, run } = developer();
    expect(run({}, []).stderr).toContain("Usage: pnpm db:pull");
    expect(existsSync(path.join(dir, "ssh-log"))).toBe(false);
  });
});
