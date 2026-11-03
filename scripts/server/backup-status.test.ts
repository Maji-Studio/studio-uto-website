import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repo = process.cwd();
const object =
  "s3://bucket/studio-uto/backups/studio-uto-20261030-011700.tar.gz.age";
let root: string;

function timestamp(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 3600000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");
}

function record(body: string) {
  writeFileSync(path.join(root, "shared/backups/last-success"), body);
}

function run(env: Record<string, string> = {}) {
  // Do not inherit a developer's age limit; exercise the script's default.
  const inherited = { ...process.env };
  delete inherited.BACKUP_MAX_AGE_HOURS;
  return spawnSync(
    "bash",
    [path.join(repo, "scripts/server/backup-status.sh")],
    {
      encoding: "utf8",
      env: { ...inherited, STUDIO_UTO_ROOT: root, ...env },
      timeout: 5000,
    },
  );
}

// Timestamp parsing requires GNU date; CI also checks that this suite ran.
describe.skipIf(process.platform !== "linux")("backup status command", () => {
  beforeEach(() => {
    root = mkdtempSync(path.join(os.tmpdir(), "studio-uto-backup-status-"));
    mkdirSync(path.join(root, "shared/backups"), { recursive: true });
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("prints the fresh backup time, whole hours and object on one line", () => {
    const time = timestamp(2.5);
    record(`${time} ${object}\n`);
    const result = run();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(`Last backup ${time}, 2h ago: ${object}\n`);
    expect(result.stderr).toBe("");
  });

  it("accepts a single record without a trailing newline", () => {
    record(`${timestamp(1.5)} ${object}`);
    expect(run().status).toBe(0);
  });

  it.each(["missing", "empty"])("rejects a %s record", (kind) => {
    if (kind === "empty") record("");
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("No successful backup recorded");
    expect(result.stdout).toBe("");
  });

  it.each([
    "untrusted file body",
    "2026-02-30T01:17:42Z s3://bucket/studio-uto-20261030-011700.tar.gz.age",
    `${timestamp(1)} https://bucket/studio-uto-20261030-011700.tar.gz.age`,
    `${timestamp(1)} ${object} extra`,
    ` ${timestamp(1)} ${object}`,
    `${timestamp(1)} ${object}\0ignored`,
  ])("rejects malformed content without echoing it: %j", (body) => {
    record(`${body}\n`);
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unreadable last-success");
    expect(result.stderr).not.toContain(body);
    expect(result.stdout).toBe("");
  });

  it.each(["\n", `${timestamp(1)} ${object}\n`, "untrusted second line\n"])(
    "rejects an extra line: %j",
    (extra) => {
      record(`${timestamp(1)} ${object}\n${extra}`);
      const result = run();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Unreadable last-success");
      expect(result.stdout).toBe("");
    },
  );

  it("rejects a 27-hour-old backup with the default limit and states its age", () => {
    const time = timestamp(27.5);
    record(`${time} ${object}\n`);
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(time);
    expect(result.stderr).toMatch(/27h|27 hours/);
    expect(result.stdout).toBe("");
  });

  it("checks the limit in seconds, including a partial hour beyond it", () => {
    record(`${timestamp(26.5)} ${object}\n`);
    expect(run().status).toBe(1);
  });

  it("honours a custom maximum age", () => {
    record(`${timestamp(27.5)} ${object}\n`);
    expect(run({ BACKUP_MAX_AGE_HOURS: "28" }).status).toBe(0);
    record(`${timestamp(2.5)} ${object}\n`);
    expect(run({ BACKUP_MAX_AGE_HOURS: "2" }).status).toBe(1);
  });

  it.each(["", "0", "-1", "1.5", "abc", "2 hours", "1+2", " 26", "10000"])(
    "rejects invalid BACKUP_MAX_AGE_HOURS %j",
    (limit) => {
      record(`${timestamp(1)} ${object}\n`);
      const result = run({ BACKUP_MAX_AGE_HOURS: limit });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "BACKUP_MAX_AGE_HOURS must be a whole number",
      );
      expect(result.stdout).toBe("");
    },
  );

  it("accepts the largest four-digit limit", () => {
    record(`${timestamp(27.5)} ${object}\n`);
    expect(run({ BACKUP_MAX_AGE_HOURS: "9999" }).status).toBe(0);
  });

  it("rejects a timestamp more than ten minutes in the future", () => {
    record(`${timestamp(-0.5)} ${object}\n`);
    const result = run();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("future");
    expect(result.stdout).toBe("");
  });

  it("allows a small amount of clock skew", () => {
    const time = timestamp(-0.05);
    record(`${time} ${object}\n`);
    const result = run();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe(`Last backup ${time}, 0h ago: ${object}\n`);
  });
});
