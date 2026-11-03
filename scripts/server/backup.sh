#!/usr/bin/env bash
set -euo pipefail
umask 0077
SCRIPT_DIR=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"
export LC_ALL=C

# setup creates this file; a read-only descriptor also works with Linux flock.
if [[ ! -e "$ROOT/backup.lock" ]]; then : > "$ROOT/backup.lock"; fi
exec 9<"$ROOT/backup.lock"
if ! flock -n 9; then log 'Another backup is running; skipping'; exit 0; fi
check_app_paths
for variable in DO_BACKUP_SPACE_KEY DO_BACKUP_SPACE_SECRET DO_BACKUP_SPACE_NAME DO_BACKUP_SPACE_REGION; do
  [[ -n "${!variable:-}" ]] || die "Missing $variable"
  [[ "${!variable}" != *$'\n'* && "${!variable}" != *$'\r'* ]] || die "Invalid multiline $variable"
done
[[ "$DO_BACKUP_SPACE_NAME" =~ ^[a-z0-9][a-z0-9.-]*$ ]] || die 'Invalid backup bucket name'
[[ "$DO_BACKUP_SPACE_REGION" =~ ^[a-z0-9-]+$ ]] || die 'Invalid backup region'
recipients="$ROOT/shared/backup-recipients.txt"
[[ -s "$recipients" ]] || die "Missing or empty $recipients"
[[ -f "$ROOT/shared/data/payload.db" ]] || die 'Database does not exist'

stamp=$(date -u +%Y%m%d-%H%M%S)
name="studio-uto-$stamp.tar.gz"
work="$ROOT/shared/backups/tmp/$stamp"
mkdir -p "$ROOT/shared/backups/tmp"
chmod 700 "$ROOT/shared/backups" "$ROOT/shared/backups/tmp"
mkdir -m 700 "$work"
cleanup() {
  local status=$?
  trap - EXIT
  rm -rf -- "$work"
  if (( status != 0 )); then log 'Backup failed; last-success was not updated' >&2; fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
log "Taking SQLite snapshot for $name"
sqlite_snapshot "$ROOT/shared/data/payload.db" "$work/payload.db"
[[ "$(sqlite3 "$work/payload.db" 'PRAGMA integrity_check;')" == ok ]] || die 'Snapshot integrity check failed'
tar_status=0
tar -czf "$work/$name" -C "$work" payload.db -C "$ROOT/shared" media || tar_status=$?
case "$tar_status" in
  0) ;;
  1) log 'Warning: media changed during tar; the SQLite snapshot is consistent' >&2 ;;
  *) die "tar failed with status $tar_status" ;;
esac
log 'Encrypting backup'
age -R "$recipients" -o "$work/$name.age" "$work/$name"

# Overrides are test-only, for a local MinIO endpoint.
host=${DO_BACKUP_SPACE_HOST:-$DO_BACKUP_SPACE_REGION.digitaloceanspaces.com}
host_bucket=${DO_BACKUP_SPACE_HOST_BUCKET:-%(bucket)s.$DO_BACKUP_SPACE_REGION.digitaloceanspaces.com}
use_https=${DO_BACKUP_SPACE_USE_HTTPS:-True}
for value in "$host" "$host_bucket" "$use_https"; do
  [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || die 'Invalid multiline S3 configuration'
done
config="$work/s3cmd.conf"
printf '[default]\naccess_key = %s\nsecret_key = %s\nhost_base = %s\nhost_bucket = %s\nuse_https = %s\n' \
  "$DO_BACKUP_SPACE_KEY" "$DO_BACKUP_SPACE_SECRET" "$host" "$host_bucket" "$use_https" > "$config"
chmod 600 "$config"
prefix="s3://$DO_BACKUP_SPACE_NAME/studio-uto/backups/"
object="$prefix$name.age"
log "Uploading $name.age"
s3cmd --config "$config" --no-progress put "$work/$name.age" "$object"
s3cmd --config "$config" info "$object" > "$work/object-info"
remote_size=$(awk '/^[[:space:]]*File size:/ { print $3 }' "$work/object-info")
local_size=$(stat -c %s "$work/$name.age")
[[ "$remote_size" == "$local_size" ]] || die 'Uploaded object size does not match the encrypted archive'

# Materialize both results before deleting anything: failures must retain all objects.
s3cmd --config "$config" ls "$prefix" > "$work/listing"
awk '{ if ($NF ~ /^s3:\/\//) { n=split($NF, parts, "/"); print parts[n] } }' "$work/listing" > "$work/names"
node --no-warnings "${BACKUP_RETENTION_SCRIPT:-/usr/local/lib/studio-uto/backup-retention.ts}" < "$work/names" > "$work/delete"
while IFS= read -r old; do
  [[ -n "$old" ]] || continue
  [[ "$old" =~ ^studio-uto-[0-9]{8}-[0-9]{6}\.tar\.gz\.age$ ]] || die 'Retention returned an invalid object name'
done < "$work/delete"
while IFS= read -r old; do
  [[ -n "$old" ]] || continue
  log "Deleting retained-out backup $old"
  s3cmd --config "$config" del "$prefix$old"
done < "$work/delete"

# This copy sits beside the live data and stays unencrypted for fast restores.
chmod 600 "$work/$name"
mv -Tf "$work/$name" "$ROOT/shared/backups/latest.tar.gz"
printf '%s %s\n' "$(date -u +%FT%TZ)" "$object" > "$work/last-success"
mv -Tf "$work/last-success" "$ROOT/shared/backups/last-success"
log "Backup complete: $object ($local_size encrypted bytes)"
