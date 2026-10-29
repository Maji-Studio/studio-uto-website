#!/usr/bin/env bash
set -euo pipefail
umask 0077
SCRIPT_DIR=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"
service_control() { /usr/bin/systemctl "$@" studio-uto.service; }

[[ $EUID == 0 ]] || die 'Restore must run as root'
[[ $# -ge 1 && $# -le 2 ]] || die 'Usage: studio-uto-restore <backup.tar.gz | backup.tar.gz.age> [age identity file]'
archive=$(readlink -f -- "$1")
[[ -f "$archive" ]] || die 'Backup archive does not exist'
case "$archive" in
  *.tar.gz.age) [[ $# == 2 && -f "$2" ]] || die 'An age identity file is required for encrypted backups' ;;
  *.tar.gz) [[ $# == 1 ]] || die 'Identity is only used with encrypted backups' ;;
  *) die 'Expected a .tar.gz or .tar.gz.age backup' ;;
esac
[[ -d "$ROOT/shared/backups" ]] || die 'Run setup first'
# Serialize with deploys and backups before touching live data.
exec 9>"$ROOT/deploy.lock"
flock -w 1800 9 || die 'Timed out waiting for deployment lock'
exec 8<"$ROOT/backup.lock"
flock -w 1800 8 || die 'Timed out waiting for backup lock'
work=$(mktemp -d "$ROOT/shared/backups/tmp/restore.XXXXXX")
trap 'rm -rf -- "$work"' EXIT
trap 'exit 1' HUP INT TERM
if [[ "$archive" == *.age ]]; then
  age -d -i "$2" -o "$work/backup.tar.gz" "$archive"
  archive="$work/backup.tar.gz"
fi
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
aside="$ROOT/shared/backups/pre-restore-$(date -u +%Y%m%d-%H%M%S)"
mkdir -m 700 "$aside"
log "Stopping the app; previous data will be kept in $aside"
service_control stop
# Keep the service stopped on a partial restore; starting with mixed data is unsafe.
trap 'status=$?; if (( status != 0 )); then log "Restore failed; previous data: $aside; check the app service status" >&2; fi; rm -rf -- "$work"' EXIT
for database in "$ROOT/shared/data/"payload.db*; do
  [[ -e "$database" ]] || continue
  mv -- "$database" "$aside/"
done
if [[ -d "$ROOT/shared/media" ]]; then mv -- "$ROOT/shared/media" "$aside/media"; fi
mv -- "$work/extracted/payload.db" "$ROOT/shared/data/payload.db"
mv -- "$work/extracted/media" "$ROOT/shared/media"
chown -R uto:uto "$ROOT/shared/data" "$ROOT/shared/media" "$aside"
chmod 700 "$ROOT/shared/data" "$aside"
chmod 600 "$ROOT/shared/data/payload.db"
find "$ROOT/shared/media" -type d -exec chmod 750 {} +
find "$ROOT/shared/media" -type f -exec chmod 640 {} +
service_control start
health_check || die "Restored data is in place but health failed; previous data: $aside"
log "Restore complete; previous data: $aside"
