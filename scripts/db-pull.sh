#!/usr/bin/env bash
# The local database must be data/payload.db (the default DATABASE_URI).
# Compatible with macOS bash 3.2 and BSD tools.
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."

usage() {
  echo "Usage: pnpm db:pull [ssh-target] (or set STUDIO_UTO_SSH=uto@studio-uto.ch)" >&2
  exit 1
}
[[ $# -le 1 ]] || usage
target=${1:-${STUDIO_UTO_SSH:-}}
[[ -n "$target" && "$target" != -* ]] || usage

if lsof -nP -iTCP:3060 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Warning: port 3060 is in use. The dev server may hold the local database open; stop it before continuing." >&2
  if [[ ${DB_PULL_YES:-} != 1 ]]; then
    printf 'Replace the local database and media anyway? [y/N] ' >&2
    answer=
    read -r answer || true
    case "$answer" in
      [yY]|[yY][eE][sS]) ;;
      *) echo "Pull cancelled." >&2; exit 1 ;;
    esac
  fi
fi

tmp=$(mktemp -d "${TMPDIR:-/tmp}/studio-uto-pull.XXXXXX")
backup=
cleanup() {
  status=$?
  rm -rf -- "$tmp"
  if [[ $status -ne 0 && -n "$backup" ]]; then
    echo "Pull did not complete. Previous local files are in $backup; inspect them before retrying." >&2
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Fetching anonymised snapshot from $target..." >&2
ssh "$target" studio-uto-pull-snapshot > "$tmp/snapshot.tar.gz"
[[ -s "$tmp/snapshot.tar.gz" ]] || { echo "Empty snapshot received." >&2; exit 1; }

# Only the snapshot's two documented paths may be installed.
tar -tzf "$tmp/snapshot.tar.gz" > "$tmp/entries"
while IFS= read -r entry; do
  case "$entry" in
    /*|../*|*/../*|*/..|*/./*) echo "Unsafe snapshot path: $entry" >&2; exit 1 ;;
    payload.db|media|media/|media/*) ;;
    *) echo "Unexpected snapshot path: $entry" >&2; exit 1 ;;
  esac
done < "$tmp/entries"
mkdir "$tmp/x"
tar -xzf "$tmp/snapshot.tar.gz" -C "$tmp/x"
[[ -f "$tmp/x/payload.db" && ! -L "$tmp/x/payload.db" && -d "$tmp/x/media" && ! -L "$tmp/x/media" ]] || {
  echo "Snapshot must contain payload.db and media/." >&2
  exit 1
}
# Symlinks or special files in media/ could expose local files through Payload.
if ! unexpected=$(find "$tmp/x" ! -type f ! -type d -print -quit) || [[ -n "$unexpected" ]]; then
  echo "Snapshot contains links or special files, or could not be scanned; refusing it." >&2
  exit 1
fi
if [[ $(sqlite3 "$tmp/x/payload.db" 'PRAGMA integrity_check') != ok ]]; then
  echo "Snapshot integrity check failed." >&2
  exit 1
fi

[[ ! -L data && ! -L data/before-pull ]] || { echo "Local data paths must not be symlinks." >&2; exit 1; }
mkdir -p data/before-pull
backup="data/before-pull/$(date +%Y%m%d-%H%M%S)"
mkdir "$backup"
for file in data/payload.db data/payload.db-wal data/payload.db-shm media; do
  if [[ -e "$file" || -L "$file" ]]; then
    mv "$file" "$backup/"
  fi
done
mv "$tmp/x/payload.db" data/payload.db
mv "$tmp/x/media" media
echo "Previous local files saved to $backup." >&2

shopt -s nullglob
backups=(data/before-pull/*/)
for ((i=0; i<${#backups[@]}-3; i++)); do
  rm -rf -- "${backups[$i]}"
done

pnpm exec cross-env NODE_OPTIONS=--no-deprecation payload run scripts/db-pull-local-login.ts
printf '\nPull complete. Previous local files: %s\nNext: start pnpm dev\n' "$backup"
