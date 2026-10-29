#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT=${STUDIO_UTO_ROOT:-/srv/studio-uto}
database="$ROOT/shared/data/payload.db"
[[ -f "$database" && -d "$ROOT/shared/media" ]] || {
  echo "Database or media directory missing under $ROOT/shared" >&2
  exit 1
}

work=$(mktemp -d "$ROOT/shared/backups/pull.XXXXXX")
trap 'rm -rf -- "$work"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
chmod 700 "$work"

sqlite3 -bail "$database" ".backup '$work/payload.db'"
if [[ $(sqlite3 -bail "$work/payload.db" 'PRAGMA integrity_check') != ok ]]; then
  echo "Snapshot integrity check failed" >&2
  exit 1
fi
sqlite3 -bail "$work/payload.db" 'PRAGMA journal_mode=DELETE' >/dev/null
node --no-warnings "${ANONYMISE_SCRIPT:-/usr/local/lib/studio-uto/anonymise.ts}" "$work/payload.db" >&2
if [[ -e "$work/payload.db-wal" || -e "$work/payload.db-shm" ]]; then
  echo "Snapshot still has SQLite sidecars; refusing to export" >&2
  exit 1
fi

# Media are public images today. Revisit this export before adding private uploads.
tar -cz -C "$work" payload.db -C "$ROOT/shared" media
