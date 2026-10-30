import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const repo = process.cwd();
const sha = "a".repeat(40);
const previous = "20260102000000-bbbbbbbbbbbb";
let root: string;

function executable(name: string, body: string) {
  const file = path.join(root, "bin", name);
  writeFileSync(file, `#!/usr/bin/env bash\nset -euo pipefail\n${body}\n`);
  chmodSync(file, 0o755);
}

function fixture() {
  root = mkdtempSync(path.join(os.tmpdir(), "studio-uto-deploy-"));
  for (const dir of [
    "bin",
    "releases",
    "shared/data",
    "shared/media",
    "shared/backups/pre-deploy",
    "archive",
  ]) {
    mkdirSync(path.join(root, dir), { recursive: true });
  }
  writeFileSync(
    path.join(root, "shared/.env"),
    `DATABASE_URI="file:${root}/shared/data/payload.db"\nMEDIA_DIR="${root}/shared/media"\nNODE_ENV=production\n`,
  );
  writeFileSync(path.join(root, "archive/package.json"), "{}");
  executable(
    "pnpm",
    `printf 'pnpm %s NODE_ENV=%s CI=%s\\n' "$*" "\${NODE_ENV-unset}" "\${CI-unset}" >> "$STUDIO_UTO_ROOT/calls"
if [[ "\${FAIL_STEP:-}" == "$1" ]]; then exit 1; fi`,
  );
  executable(
    "sudo",
    `printf 'sudo %s\\n' "$*" >> "$STUDIO_UTO_ROOT/calls"
[[ "\${FAIL_RESTART:-0}" != 1 || "$*" != *restart* ]]`,
  );
  executable(
    "curl",
    `printf 'curl %s\\n' "$*" >> "$STUDIO_UTO_ROOT/calls"
if [[ "\${FAIL_HEALTH:-}" == all ]]; then exit 1; fi
if [[ "\${FAIL_HEALTH:-}" == interrupt && "$(readlink "$STUDIO_UTO_ROOT/current")" == *aaaaaaaaaaaa ]]; then kill -TERM "$PPID"; exit 1; fi
if [[ "\${FAIL_HEALTH:-}" == new && "$(readlink "$STUDIO_UTO_ROOT/current")" == *aaaaaaaaaaaa ]]; then exit 1; fi`,
  );
  executable(
    "sqlite3",
    `printf 'sqlite3 %s\\n' "$*" >> "$STUDIO_UTO_ROOT/calls"
destination="\${2#*.backup }"
destination="\${destination:1:\${#destination}-2}"
touch "$destination"`,
  );
}

function release(name: string, current = false) {
  mkdirSync(path.join(root, "releases", name));
  if (current) symlinkSync(`releases/${name}`, path.join(root, "current"));
}

function run(
  args = ["deploy", sha],
  env: Record<string, string> = {},
  holdLock = false,
) {
  const archive = spawnSync("tar", [
    "-cf",
    "-",
    "-C",
    path.join(root, "archive"),
    ".",
  ]);
  expect(archive.status).toBe(0);
  const script = path.join(repo, "scripts/server/deploy.sh");
  // holdLock runs deploy the way restore does: with deploy.lock held on fd 9.
  const command = holdLock
    ? [
        "-c",
        'exec 9>"$STUDIO_UTO_ROOT/deploy.lock"; flock 9; exec bash "$0" "$@"',
        script,
        ...args,
      ]
    : [script, ...args];
  return spawnSync("bash", command, {
    input: archive.stdout,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${root}/bin:${process.env.PATH}`,
      STUDIO_UTO_ROOT: root,
      HEALTH_TIMEOUT: "1",
      HEALTH_INTERVAL: "0.1",
      KEEP_RELEASES: "2",
      ...env,
    },
    timeout: 10000,
  });
}

function calls() {
  return existsSync(path.join(root, "calls"))
    ? readFileSync(path.join(root, "calls"), "utf8")
    : "";
}

// Requires GNU/Linux flock and mv -T; exercised in the Linux VM and CI.
describe.skipIf(process.platform !== "linux")("deploy command", () => {
  beforeEach(fixture);
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("builds, switches, checks both URLs and prunes while preserving current and previous", () => {
    release("20260101000000-cccccccccccc");
    release(previous, true);
    release("20260103000000-dddddddddddd");
    release("20250101000000-eeeeeeeeeeee.failed");
    release("20260104000000-eeeeeeeeeeee.failed");
    writeFileSync(
      path.join(
        root,
        "shared/backups/pre-deploy/20260101000000-cccccccccccc.db",
      ),
      "old",
    );
    writeFileSync(
      path.join(root, `shared/backups/pre-deploy/${previous}.db`),
      "kept",
    );
    const result = run();
    expect(result.status, result.stderr + result.stdout).toBe(0);
    const current = readlinkSync(path.join(root, "current"));
    expect(current).toMatch(/^releases\/\d{14}-aaaaaaaaaaaa$/);
    expect(
      readFileSync(path.join(root, current, "REVISION"), "utf8").trim(),
    ).toBe(sha);
    expect(readlinkSync(path.join(root, current, ".env"))).toBe(
      "../../shared/.env",
    );
    expect(readdirSync(path.join(root, "releases")).sort()).toEqual(
      [previous, "20260103000000-dddddddddddd", path.basename(current)].sort(),
    );
    expect(calls()).toContain(
      "pnpm install --frozen-lockfile --prod=false NODE_ENV=unset CI=true",
    );
    expect(calls()).toContain("pnpm migrate NODE_ENV=production");
    expect(calls().indexOf("pnpm migrate")).toBeLessThan(
      calls().indexOf("pnpm build"),
    );
    expect(calls()).toContain("restart studio-uto.service");
    expect(calls()).toContain("http://127.0.0.1:3000/");
    expect(calls()).toContain("http://127.0.0.1:3000/api/media?limit=1");
    expect(readdirSync(path.join(root, "shared/backups/pre-deploy"))).toEqual([
      `${previous}.db`,
    ]);
  });

  it.each(["build", "migrate"])(
    "leaves current untouched and cleans up on %s failure",
    (step) => {
      release(previous, true);
      const result = run(undefined, { FAIL_STEP: step });
      expect(result.status).toBe(1);
      expect(readlinkSync(path.join(root, "current"))).toBe(
        `releases/${previous}`,
      );
      expect(readdirSync(path.join(root, "releases"))).toEqual([previous]);
      expect(calls()).not.toContain("restart");
      expect(result.stderr + result.stdout).toContain(step);
      expect(result.stderr + result.stdout).toContain("migrations");
    },
  );

  it("rolls back on failed health and marks the release failed", () => {
    release(previous, true);
    const result = run(undefined, { FAIL_HEALTH: "new" });
    expect(result.status, result.stderr).toBe(1);
    expect(readlinkSync(path.join(root, "current"))).toBe(
      `releases/${previous}`,
    );
    expect(calls().match(/restart studio-uto.service/g)).toHaveLength(2);
    expect(
      readdirSync(path.join(root, "releases")).some((entry) =>
        entry.endsWith(".failed"),
      ),
    ).toBe(true);
    expect(result.stdout + result.stderr).toContain("migrations");
  });

  it("leaves the first failed deploy available for inspection", () => {
    const result = run(undefined, { FAIL_HEALTH: "all" });
    expect(result.status).toBe(1);
    expect(readlinkSync(path.join(root, "current"))).toMatch(/aaaaaaaaaaaa$/);
  });

  it("exits 2 if automatic rollback is unhealthy too", () => {
    release(previous, true);
    expect(run(undefined, { FAIL_HEALTH: "all" }).status).toBe(2);
    expect(readlinkSync(path.join(root, "current"))).toBe(
      `releases/${previous}`,
    );
  });

  it("refuses the wrong database path before extraction", () => {
    writeFileSync(
      path.join(root, "shared/.env"),
      `DATABASE_URI=file:/wrong.db\nMEDIA_DIR=${root}/shared/media\n`,
    );
    expect(run().status).toBe(1);
    expect(readdirSync(path.join(root, "releases"))).toEqual([]);
    expect(calls()).toBe("");
  });

  it.each(["abc", "A".repeat(40), `${sha} extra`])(
    "rejects invalid sha %s",
    (invalid) => {
      expect(run(["deploy", invalid]).status).toBe(1);
      expect(readdirSync(path.join(root, "releases"))).toEqual([]);
    },
  );

  it("rolls back to the newest older release and ignores failed releases", () => {
    release("20260101000000-cccccccccccc");
    release("20260101500000-eeeeeeeeeeee.failed");
    release(previous, true);
    expect(run(["rollback"]).status).toBe(0);
    expect(readlinkSync(path.join(root, "current"))).toBe(
      "releases/20260101000000-cccccccccccc",
    );
    expect(
      existsSync(path.join(root, "releases", `${previous}.rolled-back`)),
    ).toBe(true);
  });

  it("never rolls back to a release that was rolled back from before", () => {
    release("20260101000000-cccccccccccc");
    release("20260101500000-dddddddddddd.rolled-back");
    release(previous, true);
    expect(run(["rollback"]).status).toBe(0);
    expect(readlinkSync(path.join(root, "current"))).toBe(
      "releases/20260101000000-cccccccccccc",
    );
  });

  it("switches back when interrupted before the new release is healthy", () => {
    release(previous, true);
    const result = run(["deploy", sha], { FAIL_HEALTH: "interrupt" });
    expect(result.status).not.toBe(0);
    expect(readlinkSync(path.join(root, "current"))).toBe(
      `releases/${previous}`,
    );
    expect(calls().match(/sudo .*restart/g)).toHaveLength(2);
    const failed = readdirSync(path.join(root, "releases")).filter((name) =>
      name.endsWith(`${sha.slice(0, 12)}.failed`),
    );
    expect(failed).toHaveLength(1);
  });

  it("restores the current target if manual rollback fails health", () => {
    release("20260101000000-cccccccccccc");
    release(previous, true);
    expect(run(["rollback"], { FAIL_HEALTH: "all" }).status).toBe(1);
    expect(readlinkSync(path.join(root, "current"))).toBe(
      `releases/${previous}`,
    );
  });

  it("restores the original release when manual rollback is interrupted", () => {
    release("20260101000000-aaaaaaaaaaaa");
    release(previous, true);
    const result = run(["rollback"], { FAIL_HEALTH: "interrupt" });
    expect(result.status).not.toBe(0);
    expect(readlinkSync(path.join(root, "current"))).toBe(
      `releases/${previous}`,
    );
    expect(calls().match(/sudo .*restart/g)).toHaveLength(2);
    expect(existsSync(path.join(root, "releases", previous))).toBe(true);
  });

  it.each(["migrate", "build"])(
    "retains a failed %s snapshot until two newer releases exist",
    (step) => {
      release(previous, true);
      writeFileSync(path.join(root, "shared/data/payload.db"), "fixture");
      executable(
        "date",
        'if [[ "$*" == *+%Y%m%d%H%M%S* ]]; then printf "20260201000000\\n"; else /bin/date "$@"; fi',
      );
      expect(run(undefined, { FAIL_STEP: step }).status).toBe(1);
      const snapshot = path.join(
        root,
        "shared/backups/pre-deploy/20260201000000-aaaaaaaaaaaa.db",
      );
      expect(existsSync(snapshot)).toBe(true);
      executable(
        "date",
        'if [[ "$*" == *+%Y%m%d%H%M%S* ]]; then printf "20260202000000\\n"; else /bin/date "$@"; fi',
      );
      expect(run(["deploy", "c".repeat(40)]).status).toBe(0);
      expect(existsSync(snapshot)).toBe(true);
      executable(
        "date",
        'if [[ "$*" == *+%Y%m%d%H%M%S* ]]; then printf "20260203000000\\n"; else /bin/date "$@"; fi',
      );
      expect(run(["deploy", "d".repeat(40)]).status).toBe(0);
      expect(existsSync(snapshot)).toBe(false);
    },
  );

  it("refuses rollback when no older release exists", () => {
    release(previous, true);
    expect(run(["rollback"]).status).toBe(1);
    expect(calls()).not.toContain("restart");
  });

  it("seeds between migrate and build on the first deploy when asked", () => {
    const result = run(["deploy", sha], { STUDIO_UTO_SEED: "1" });
    expect(result.status, result.stderr).toBe(0);
    const pnpm = calls()
      .split("\n")
      .filter((line) => line.startsWith("pnpm "))
      .map((line) => line.split(" ")[1]);
    expect(pnpm).toEqual(["install", "migrate", "seed", "build"]);
  });

  it("refuses to seed once a release is live", () => {
    release(previous, true);
    const result = run(["deploy", sha], { STUDIO_UTO_SEED: "1" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("only allowed for the first deploy");
    expect(calls()).not.toContain("pnpm");
    expect(readlinkSync(path.join(root, "current"))).toBe(
      `releases/${previous}`,
    );
  });

  it("takes a pre-deploy snapshot when a database exists", () => {
    writeFileSync(path.join(root, "shared/data/payload.db"), "fixture");
    const result = run();
    expect(result.status, result.stderr).toBe(0);
    const snapshots = readdirSync(path.join(root, "shared/backups/pre-deploy"));
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatch(/aaaaaaaaaaaa\.db$/);
    expect(calls().indexOf("sqlite3")).toBeLessThan(
      calls().indexOf("pnpm migrate"),
    );
  });

  it("deploys under a deployment lock handed over on fd 9", () => {
    const result = run(
      ["deploy", sha],
      { STUDIO_UTO_DEPLOY_LOCK_HELD: "1" },
      true,
    );
    expect(result.status, result.stderr).toBe(0);
    expect(readlinkSync(path.join(root, "current"))).toMatch(/aaaaaaaaaaaa$/);
  });

  it("refuses a handed-over lock that is not open on fd 9", () => {
    const result = run(["deploy", sha], { STUDIO_UTO_DEPLOY_LOCK_HELD: "1" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Expected the held deployment lock");
    expect(calls()).not.toContain("pnpm");
  });
});

describe("SSH forced command", () => {
  beforeEach(() => {
    fixture();
    executable("studio-uto-deploy", 'printf "%s\\n" "$@"');
    executable("studio-uto-backup-status", "printf 'backup status routed\\n'");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  function ssh(command: string) {
    return spawnSync("bash", ["scripts/server/ssh-command.sh"], {
      encoding: "utf8",
      env: {
        ...process.env,
        SSH_ORIGINAL_COMMAND: command,
        STUDIO_UTO_DEPLOY_BIN: path.join(root, "bin/studio-uto-deploy"),
        STUDIO_UTO_BACKUP_STATUS_BIN: path.join(
          root,
          "bin/studio-uto-backup-status",
        ),
      },
    });
  }

  it.each([`deploy ${sha}`, "rollback"])("accepts %s", (command) => {
    const result = ssh(command);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim().split("\n")).toEqual(command.split(" "));
  });

  it("routes backup-status to its override binary without arguments", () => {
    executable(
      "studio-uto-backup-status",
      '[[ $# == 0 ]]\nprintf "backup status routed\\n"',
    );
    const result = ssh("backup-status");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe("backup status routed\n");
  });

  it.each([
    "deploy abc; rm -rf /",
    `deploy ${sha} extra`,
    "",
    "sh",
    "rollback ",
    `deploy ${sha}\n`,
    "backup-status extra",
    "backup-status;id",
    " backup-status",
    "Backup-status",
  ])("rejects %j", (command) => {
    expect(ssh(command).status).toBe(64);
  });
});
