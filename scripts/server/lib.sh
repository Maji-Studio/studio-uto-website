#!/usr/bin/env bash
# Shared helpers; source from the resolved script directory.
set -euo pipefail

ROOT=${STUDIO_UTO_ROOT:-/srv/studio-uto}
ROOT=${ROOT%/}
[[ "$ROOT" == /* && "$ROOT" != / && "$ROOT" != *$'\n'* ]] || {
  printf 'Invalid STUDIO_UTO_ROOT\n' >&2
  exit 1
}

log() { printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*"; }
die() { log "$*" >&2; exit 1; }

check_app_paths() (
  readonly ROOT
  [[ -f "$ROOT/shared/.env" ]] || die "Missing $ROOT/shared/.env"
  unset DATABASE_URI MEDIA_DIR
  # This is the human-managed shell-compatible environment file.
  # shellcheck disable=SC1091
  . "$ROOT/shared/.env"
  [[ "${DATABASE_URI:-}" == "file:$ROOT/shared/data/payload.db" ]] || die "DATABASE_URI must be file:$ROOT/shared/data/payload.db"
  [[ "${MEDIA_DIR:-}" == "$ROOT/shared/media" ]] || die "MEDIA_DIR must be $ROOT/shared/media"
)

sqlite_snapshot() {
  local destination=$2
  destination=${destination//\\/\\\\}
  destination=${destination//\"/\\\"}
  sqlite3 "$1" ".backup \"$destination\""
  chmod 600 "$2"
}

service_control() { sudo -n /usr/bin/systemctl "$@" studio-uto.service; }

health_check() {
  local timeout=${HEALTH_TIMEOUT:-90} interval=${HEALTH_INTERVAL:-2}
  local base=${HEALTH_BASE_URL:-http://127.0.0.1:3000} deadline remaining request_timeout
  [[ "$timeout" =~ ^[1-9][0-9]*$ ]] || { log 'HEALTH_TIMEOUT must be a positive integer' >&2; return 1; }
  [[ "$interval" =~ ^[0-9]+([.][0-9]+)?$ ]] || { log 'Invalid HEALTH_INTERVAL' >&2; return 1; }
  deadline=$((SECONDS + timeout))
  while (( SECONDS < deadline )); do
    remaining=$((deadline - SECONDS))
    request_timeout=$((remaining < 10 ? remaining : 10))
    if service_control is-active >/dev/null 2>&1 &&
      curl -fsSL --max-time "$request_timeout" -o /dev/null "${base%/}/"; then
      remaining=$((deadline - SECONDS))
      if (( remaining > 0 )); then
        request_timeout=$((remaining < 10 ? remaining : 10))
        if curl -fsSL --max-time "$request_timeout" -o /dev/null "${base%/}/api/media?limit=1"; then
          return 0
        fi
      fi
    fi
    (( SECONDS < deadline )) || break
    sleep "$interval"
  done
  log "Health check failed after ${timeout}s" >&2
  return 1
}

switch_current() {
  local target=$1 temporary
  temporary=$(mktemp -d "$ROOT/.switch.XXXXXX")
  if ! ln -s "$target" "$temporary/current" || ! mv -Tf "$temporary/current" "$ROOT/current"; then
    rm -rf -- "$temporary"
    return 1
  fi
  rmdir "$temporary" || log "Warning: could not remove switch directory $temporary" >&2
  return 0
}
