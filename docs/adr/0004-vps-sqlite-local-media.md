# 4. Single VPS with SQLite and local media

Status: Accepted. Supersedes the infrastructure decisions in [ADR 0003](0003-payload-cms-on-nextjs.md).

Date: 2026-10-29

## Context

ADR 0003 copied the CITY STAY plan: Vercel hosting, managed MongoDB, uploads in DigitalOcean Spaces, a staging environment and nightly GitHub Actions backups. This is one small studio site. A booking tool with inventory and email will be built in Payload later, and it needs an always-on process. One server gives the site and that tool a simpler home.

## Decision

- **One production VPS.** The provider is still to be chosen. Run Node 24 (at least 24.22.1) with systemd and Caddy, chosen over Docker Compose. systemd manages the app process; Caddy handles HTTPS and proxies app requests. There is no staging environment and no Vercel hosting.
- **SQLite in WAL mode.** `DATABASE_URI` points to a local database file, defaulting to `file:./data/payload.db` for development. Production uses a persistent file outside release directories. Keep Payload's default numeric document IDs.
- **Uploads on local disk.** `MEDIA_DIR` points to an absolute persistent directory on the server, such as `/srv/studio-uto/shared/media`, and defaults to the repo-root `media/` locally. Keep Payload's `/api/media/file/<filename>` URLs. Caddy will serve that path directly from `MEDIA_DIR`. Upload-time WebP conversion, source copies and image variants from ADR 0003 stay as they are.
- **Deploy from GitHub on push to `main`.** Apply committed migrations with `pnpm migrate`, then run `pnpm build` on the server because Next pre-renders pages from the live database. Run one app instance.
- **Daily encrypted backups.** Take a consistent SQLite snapshot plus a media tarball and upload them to the shared DigitalOcean backup Space under `studio-uto/`. Keep one latest copy on the server. Encrypt backups because future bookings will contain personal data.
- **Two secret items.** Keep only `studio-uto-website env local` and `studio-uto-website env production` in 1Password. The production template contains `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` and `MEDIA_DIR`.

## Consequences

- Schema changes ship as committed migrations. After changing a collection or global, run `pnpm migrate:create <name>` and commit the generated files and index. Local development keeps Payload's default schema push behaviour.
- Only one instance is supported. Database, media and Next's page cache need persistent local disk; scaling to multiple instances would need a new decision.
- There is no Docker locally either. Local development needs Node and pnpm, with writable database and media directories.
- Server scripts, Caddy and systemd configuration, deploys and backups: see [ADR 0005](0005-server-operations.md).
- Payload 4 beta, Next.js, upload-time image optimization and the content model from ADR 0003 still stand.
