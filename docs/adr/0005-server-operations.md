# 5. Server operations: deploys, secrets, backups and production data

Status: Accepted. Builds on [ADR 0004](0004-vps-sqlite-local-media.md).

Date: 2026-10-29

## Context

ADR 0004 put the site on one VPS with SQLite and local media. This ADR records how that server is set up, deployed, backed up and copied for debugging. The scripts live in `scripts/server/`, and `scripts/setup-infra.sh` walks a human through the steps only they can do. Everything was tested against an Ubuntu 24.04 VM in OrbStack. The VPS provider is still open, so nothing depends on one.

## Decision

**Layout.** Everything lives under `/srv/studio-uto`, owned by the `uto` user. Releases sit in `releases/<UTC timestamp>-<sha12>/` and `current` is a symlink to one of them. Persistent state sits in `shared/`: `.env`, `data/payload.db`, `media/` and `backups/`. The scripts are installed root-owned in `/usr/local/lib/studio-uto/` with `studio-uto-*` commands in `/usr/local/bin`, so the app user cannot change the code that deploys or backs it up. Re-running `setup.sh` (through `provision.sh`) is how they get updated.

**Secrets reach the server once, from 1Password.** The wizard runs `op inject` on `.env.tpl` and `scripts/server/backup.env.tpl` and writes `shared/.env` and `shared/backup.env` (mode 600) over SSH. The server holds no 1Password token. After changing the production item, re-run the wizard's secrets stage. `deploy` and `backup` refuse to run when `DATABASE_URI` or `MEDIA_DIR` in `shared/.env` point anywhere other than the fixed layout, so a backup can't miss the live database.

**Deploys stream the code; the server never pulls from GitHub.** A deploy is `git archive <sha> | ssh uto@host studio-uto-deploy deploy <sha>`. GitHub's deploy key is pinned in `authorized_keys` to a forced command that accepts only `deploy <40-hex sha>` and `rollback`, with `restrict` (no shell, no forwarding). The server needs no GitHub credentials.

`studio-uto-deploy` takes a lock and extracts the archive into a new release. Then it runs `pnpm install --frozen-lockfile`, takes an online SQLite snapshot into `shared/backups/pre-deploy/`, and runs `pnpm migrate` and `pnpm build` with `NODE_ENV=production`. It switches `current` atomically, restarts the systemd unit, and checks that `/` and `/api/media?limit=1` answer within 90 seconds. On failure before the switch it deletes the release and leaves the running app alone. On a failed health check it switches back, restarts and renames the release `.failed`. It keeps five releases.

**Migrations are not rolled back.** A rollback runs old code against the migrated schema. Migrations must stay compatible with the previous release (add columns before using them, drop them a release later). The pre-deploy snapshot is there for a manual restore.

**The first deploy seeds before it builds.** The pages can't pre-render from an empty database. `STUDIO_UTO_SEED=1` makes the deploy run `pnpm seed` between migrate and build, and the script refuses it once any release exists. Only a human SSH session can set it, because the forced command ignores the client's environment. Outside that path, `pnpm seed` with `NODE_ENV=production` refuses to run unless `SEED_ALLOW_REMOTE=true` is set.

**Next's page cache stays per release.** Each deploy builds from the live database, so a new release starts with current content. An edit saved during the build's few minutes reaches the old release's cache but not the new one: if a change is missing after a deploy, save it again.

**Backups are encrypted with age to a public key.** The nightly `studio-uto-backup.timer` (03:15 Swiss time) takes an online SQLite snapshot, checks its integrity, tars it with `media/`, encrypts it to the age recipients in `shared/backup-recipients.txt` and uploads it to the shared DigitalOcean backup Space under `studio-uto/backups/`. The private key exists only in the 1Password item `studio-uto-website backups`. The server can write backups but cannot read them. The latest unencrypted archive stays in `shared/backups/latest.tar.gz` for fast restores, next to the live data it copies.

**Retention counts periods that have backups, like `restic forget`.** It keeps the newest backup of each of the last 7 days, 4 ISO weeks and 12 months that have one. If backups stop for a while, old ones are not deleted for being old. Files that don't match the backup name pattern are never deleted.

**`pnpm db:pull` anonymises on the server and fails closed.** `studio-uto-pull-snapshot` snapshots the database, runs `scripts/server/anonymise.ts` on the copy, vacuums it and streams it with the media. Personal data never leaves the server. Every table must be classified in `anonymise.ts`, either with an anonymiser or as holding no personal data. An unclassified table stops the pull, and a test fails when a migration adds a table nobody classified. Locally, every user gets the password `uto-local`.

## Consequences

- The DigitalOcean Space key is scoped to the whole backup Space, so a compromised server could delete other projects' backups there. A dedicated Space for Studio Uto would remove that risk.
- Losing the age private key makes every uploaded backup unreadable. 1Password is its only copy.
- Booking and customer tables (step 5) must get an anonymiser before `db:pull` works again. That is deliberate.
- The deploy and SSH tests need GNU/Linux and are skipped on macOS. They run in the VM and will run in CI.
- `restore` runs as root and stops the app. It moves the previous database and media to `shared/backups/pre-restore-<timestamp>/` rather than deleting them.
