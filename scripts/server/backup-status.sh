#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"
export LC_ALL=C

max_age=${BACKUP_MAX_AGE_HOURS-26}
[[ "$max_age" =~ ^[1-9][0-9]{0,3}$ ]] || die 'BACKUP_MAX_AGE_HOURS must be a whole number of hours from 1 to 9999'
status_file="$ROOT/shared/backups/last-success"
[[ -s "$status_file" ]] || die 'No successful backup recorded'

# Read to EOF without discarding trailing newlines. A NUL delimiter is invalid,
# and only one optional final newline is allowed before validating the record.
record=''
if IFS= read -r -d '' record < "$status_file"; then
  die 'Unreadable last-success'
fi
record=${record%$'\n'}
pattern='^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z) (s3://[^ ]+/studio-uto-[0-9]{8}-[0-9]{6}\.tar\.gz\.age)$'
[[ "$record" != *$'\n'* && "$record" =~ $pattern ]] || die 'Unreadable last-success'
time=${BASH_REMATCH[1]}
object=${BASH_REMATCH[2]}
seconds=$(date -u -d "$time" +%s 2>/dev/null) || die 'Unreadable last-success timestamp'
now=$(date -u +%s)
age_seconds=$((now - seconds))
(( age_seconds >= -600 )) || die "Last backup $time is more than 10 minutes in the future"
age_hours=$((age_seconds / 3600))
if (( age_seconds > max_age * 3600 )); then
  die "Last backup $time, ${age_hours}h ago: older than ${max_age}h maximum"
fi
printf 'Last backup %s, %sh ago: %s\n' "$time" "$age_hours" "$object"
