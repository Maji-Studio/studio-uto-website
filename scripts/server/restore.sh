#!/usr/bin/env bash
set -euo pipefail
umask 0077
SCRIPT_DIR=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"
service_control() { /usr/bin/systemctl "$@" studio-uto.service; }

[[ $EUID == 0 ]] || die 'Restore must run as root'
[[ $# -ge 1 && $# -le 2 ]] || die 'Usage: studio-uto-restore <backup.tar.gz | backup.tar.gz.age> [age identity file]'
as_uto() { runuser -u uto -- "$@"; }
# Read-only descriptors: flock works on them, and root never writes through a planted link.
for lock in deploy.lock backup.lock; do
  [[ -f "$ROOT/$lock" && ! -L "$ROOT/$lock" ]] || die "$ROOT/$lock must be a regular file; run setup"
done
exec 9<"$ROOT/deploy.lock" 8<"$ROOT/backup.lock"
flock -w 1800 9 || die 'Timed out waiting for deployment lock'
flock -w 1800 8 || die 'Timed out waiting for backup lock'
case "$1" in
  *.tar.gz.age) [[ $# == 2 && -f "$2" ]] || die 'An age identity file is required for encrypted backups' ;;
  *.tar.gz) [[ $# == 1 ]] || die 'Identity is only used with encrypted backups' ;;
  *) die 'Expected a .tar.gz or .tar.gz.age backup' ;;
esac
[[ -f "$1" ]] || die 'Backup archive does not exist'
# Stage outside the app's writable tree. Root copies the archive first, so the
# file it checks is the file it extracts, even when it came from shared/backups.
work=$(mktemp -d /tmp/studio-uto-restore.XXXXXX)
trap 'rm -rf -- "$work"' EXIT
trap 'exit 1' HUP INT TERM
if [[ "$1" == *.age ]]; then
  age -d -i "$2" -o "$work/backup.tar.gz" "$1"
else
  cp -- "$1" "$work/backup.tar.gz"
fi
archive="$work/backup.tar.gz"
mkdir -m 700 "$work/extracted"
# Inspect in Python before root extracts: only our regular db/media entries are allowed.
python3 - "$archive" <<'PY'
import pathlib
import sys
import tarfile

with tarfile.open(sys.argv[1], "r:gz") as archive:
    seen = set()
    for member in archive:
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts or not path.parts:
            raise SystemExit("Unsafe path in restore archive")
        if path.as_posix() in seen:
            raise SystemExit("Duplicate path in restore archive")
        seen.add(path.as_posix())
        if not (member.isfile() or member.isdir()):
            raise SystemExit("Links and special files are not allowed in restore archives")
        if not ((path.parts == ("payload.db",) and member.isfile()) or path.parts[0] == "media"):
            raise SystemExit("Unexpected entry in restore archive")
PY
tar -xzf "$archive" -C "$work/extracted" --no-same-owner --no-same-permissions
[[ -f "$work/extracted/payload.db" && -d "$work/extracted/media" ]] || die 'Backup must contain payload.db and media/'
[[ "$(sqlite3 "$work/extracted/payload.db" 'PRAGMA integrity_check;')" == ok ]] || die 'Restored database integrity check failed'
if [[ "${RESTORE_YES:-0}" != 1 ]]; then
  printf 'Replace the live database and media? Type restore: ' > /dev/tty
  IFS= read -r answer < /dev/tty
  [[ "$answer" == restore ]] || die 'Restore cancelled'
fi
live=$(as_uto readlink -f -- "$ROOT/current")
revision=$(as_uto cat -- "$live/REVISION")
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || die 'Live release has no valid REVISION'
aside="$ROOT/shared/backups/pre-restore-$(date -u +%Y%m%d-%H%M%S)"
# Only the validated staging tree needs root to change ownership.
chown -hR uto:uto "$work/extracted"
chmod 711 "$work"
log "Stopping the app; previous data will be kept in $aside"
service_control stop
trap 'status=$?; if (( status != 0 )); then log "Restore failed; restored data may be in place; previous data: $aside; check the app service status" >&2; fi; rm -rf -- "$work"' EXIT
as_uto bash -s -- "$ROOT" "$work/extracted" "$aside" <<'SWAP'
set -euo pipefail
root=$1 extracted=$2 aside=$3
for directory in "$root/shared" "$root/shared/data" "$root/shared/media" "$root/shared/backups"; do
  [[ -d "$directory" && ! -L "$directory" ]] || { printf 'Unsafe restore directory: %s\n' "$directory" >&2; exit 1; }
done
mkdir -m 700 "$aside"
for database in "$root/shared/data/"payload.db*; do
  [[ -e "$database" || -L "$database" ]] || continue
  mv -T -- "$database" "$aside/${database##*/}"
done
mv -T -- "$root/shared/media" "$aside/media"
mv -T -- "$extracted/payload.db" "$root/shared/data/payload.db"
mv -T -- "$extracted/media" "$root/shared/media"
chmod 700 "$root/shared/data"
chmod 600 "$root/shared/data/payload.db"
find "$root/shared/media" -type d -exec chmod 750 {} +
find "$root/shared/media" -type f -exec chmod 640 {} +
SWAP
# Keep the deploy lock on fd 9 and hand it to the redeploy, so nothing queued
# runs in between. Backups may run again.
flock -u 8
exec 8<&-
if ! as_uto bash -c '
  set -euo pipefail
  tar -cf - --exclude=./node_modules --exclude=./.next --exclude=./REVISION --exclude=./.env -C "$1" . |
    env STUDIO_UTO_ROOT="$2" STUDIO_UTO_DEPLOY_LOCK_HELD=1 /usr/local/bin/studio-uto-deploy deploy "$3"
' bash "$live" "$ROOT" "$revision"; then
  # Serve the restored data from the old build rather than leave the site down.
  service_control start || true
  die "Restore redeploy failed; restored data is live but pages may be stale until a deploy succeeds; previous data: $aside"
fi
log "Restore complete; rebuilt and migrated restored data; previous data: $aside"
