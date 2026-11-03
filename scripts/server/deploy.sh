#!/usr/bin/env bash
set -euo pipefail
umask 0027
SCRIPT_DIR=$(dirname -- "$(readlink -f -- "${BASH_SOURCE[0]}")")
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

[[ -d "$ROOT/releases" ]] || die "Missing $ROOT/releases; run setup first"
# restore hands over its held lock on fd 9, so a queued deploy or rollback
# cannot run between its data swap and this redeploy.
if [[ "${STUDIO_UTO_DEPLOY_LOCK_HELD:-0}" == 1 ]]; then
  flock -n 9 || die 'Expected the held deployment lock on fd 9'
else
  exec 9>"$ROOT/deploy.lock"
  flock -w 1800 9 || die 'Timed out waiting for deployment lock'
fi
export LC_ALL=C

valid_release() { [[ "$1" =~ ^[0-9]{14}-[0-9a-f]{12}$ ]]; }
current_target() {
  local target
  if [[ -L "$ROOT/current" ]]; then
    target=$(readlink "$ROOT/current")
    if [[ "$target" != releases/* ]] || ! valid_release "${target#releases/}" || [[ ! -d "$ROOT/$target" ]]; then
      die 'Invalid current symlink'
    fi
    printf '%s' "$target"
  elif [[ -e "$ROOT/current" ]]; then
    die 'current must be a relative symlink'
  fi
}

prune() {
  local current=$1 previous=$2 keep=${KEEP_RELEASES:-5} entry name cutoff='' count=0 snapshot newer base
  local -a names=()
  [[ "$keep" =~ ^[1-9][0-9]*$ ]] || die 'KEEP_RELEASES must be a positive integer'
  for entry in "$ROOT/releases/"*; do
    name=${entry##*/}
    if [[ -d "$entry" && ! -L "$entry" ]] && valid_release "$name"; then names+=("$name"); fi
  done
  if (( ${#names[@]} )); then
    mapfile -t names < <(printf '%s\n' "${names[@]}" | sort -r)
    cutoff=${names[0]}
    for name in "${names[@]}"; do
      count=$((count + 1))
      if (( count > keep )) && [[ "releases/$name" != "$current" && "releases/$name" != "$previous" ]]; then
        rm -rf -- "$ROOT/releases/$name"
        log "Pruned release $name"
      fi
    done
    for entry in "$ROOT/releases/"*.failed "$ROOT/releases/"*.rolled-back; do
      name=${entry##*/}
      base=${name%.failed}
      base=${base%.rolled-back}
      if [[ -d "$entry" && ! -L "$entry" ]] && valid_release "$base" && [[ "$base" < "$cutoff" ]]; then
        rm -rf -- "$entry"
        log "Pruned release $name"
      fi
    done
  fi
  for snapshot in "$ROOT/shared/backups/pre-deploy/"*.db; do
    [[ -f "$snapshot" ]] || continue
    name=${snapshot##*/}
    name=${name%.db}
    valid_release "$name" || continue
    if [[ ! -d "$ROOT/releases/$name" && ! -d "$ROOT/releases/$name.failed" && ! -d "$ROOT/releases/$name.rolled-back" ]]; then
      # Failed builds have no release directory. Keep their snapshot until
      # KEEP_RELEASES newer successful releases exist.
      newer=0
      for entry in "${names[@]}"; do
        if [[ "$entry" > "$name" ]]; then newer=$((newer + 1)); fi
      done
      if (( newer >= keep )); then rm -f -- "$snapshot"; fi
    fi
  done
}

case "${1:-}" in
  rollback)
    [[ $# == 1 ]] || die 'Usage: studio-uto-deploy rollback'
    check_app_paths
    original=$(current_target)
    [[ -n "$original" ]] || die 'No current release to roll back from'
    candidate=''
    for entry in "$ROOT/releases/"*; do
      name=${entry##*/}
      if [[ -d "$entry" && ! -L "$entry" ]] && valid_release "$name" && [[ "$name" < "${original#releases/}" && "$name" > "$candidate" ]]; then
        candidate=$name
      fi
    done
    [[ -n "$candidate" ]] || die 'No older release to roll back to'
    rollback_healthy=0
    rollback_cleanup() {
      local status=$?
      trap - EXIT HUP INT TERM PIPE
      if (( rollback_healthy == 0 )) && [[ "$(readlink "$ROOT/current")" != "$original" ]]; then
        log "Rollback failed or interrupted; restoring $original" >&2
        if ! switch_current "$original" || ! service_control restart; then
          log 'Restoring the original release failed; inspect the service' >&2
        fi
      fi
      exit "$status"
    }
    trap rollback_cleanup EXIT
    trap 'exec >>"$ROOT/deploy-interrupted.log" 2>&1; exit 1' HUP INT TERM PIPE
    switch_current "releases/$candidate"
    if service_control restart && health_check; then
      rollback_healthy=1
      # Retire the release we left so a later rollback never returns to it.
      mv -- "$ROOT/$original" "$ROOT/$original.rolled-back"
      log "Rolled back to $candidate; migrations remain applied; retired ${original#releases/}.rolled-back"
      exit 0
    fi
    exit 1
    ;;
  deploy)
    [[ $# == 2 && "$2" =~ ^[0-9a-f]{40}$ ]] || die 'Usage: studio-uto-deploy deploy <40 lowercase hex sha>'
    sha=$2
    ;;
  *) die 'Usage: studio-uto-deploy deploy <sha> | rollback' ;;
esac

check_app_paths
[[ ! -t 0 ]] || die 'Expected a git archive tar stream on stdin'
[[ "${KEEP_RELEASES:-5}" =~ ^[1-9][0-9]*$ ]] || die 'KEEP_RELEASES must be a positive integer'
previous=$(current_target)
# The pages cannot pre-render from an empty database, so the first deploy may
# seed before building. Only a human SSH session can set this variable: the
# GitHub key's forced command does not pass the client's environment.
if [[ "${STUDIO_UTO_SEED:-0}" == 1 && -n "$previous" ]]; then
  die 'STUDIO_UTO_SEED=1 is only allowed for the first deploy'
fi
name="$(date -u +%Y%m%d%H%M%S)-${sha:0:12}"
release="$ROOT/releases/$name"
[[ ! -e "$release" && ! -e "$release.failed" && ! -e "$release.rolled-back" ]] || die "Release $name already exists; retry after one second"
snapshot='none (no existing database)'
step='create release'
switched=0
healthy=0
recovering=0
created=0
migration_started=0
migration_noticed=0

migration_notice() {
  if (( migration_started && ! migration_noticed )); then
    migration_noticed=1
    log "Database migrations were attempted and stay applied; pre-deploy snapshot: $snapshot" >&2
  fi
}
cleanup() {
  local status=$? live
  trap - EXIT
  (( status != 0 )) || exit 0
  # Decide from where current really points, not from the flags alone: the
  # session can drop between the symlink switch and the next statement.
  live=$(readlink "$ROOT/current" 2>/dev/null || true)
  if [[ "$live" == "releases/$name" ]] && (( healthy == 0 )); then
    if (( recovering == 0 )) && [[ -n "$previous" ]]; then
      log "Deploy interrupted before $name passed health checks; switching back to $previous" >&2
      if switch_current "$previous" && service_control restart; then
        live=$previous
      else
        log 'Switching back failed; inspect the service' >&2
      fi
    else
      log "Deploy stopped while $name is live and unverified; inspect the service" >&2
    fi
  elif (( switched == 0 && recovering == 0 )); then
    if (( created )); then rm -rf -- "$release"; fi
    log "Deploy failed during $step; current and the running app were left untouched" >&2
    migration_notice
    exit 1
  fi
  # A release that went live but is no longer current must never be picked by
  # a later rollback.
  if [[ -d "$release" && "$live" != "releases/$name" ]]; then
    mv -- "$release" "$release.failed" || true
  fi
  migration_notice
  exit "$status"
}
trap cleanup EXIT
# A dropped SSH session closes stdout; log to a file so cleanup can still run.
trap 'exec >>"$ROOT/deploy-interrupted.log" 2>&1; exit 1' HUP INT TERM PIPE

mkdir "$release"
created=1
step='extract archive'
log "Deploying $sha to $name"
tar -x -f - -C "$release" --no-same-owner --no-same-permissions
[[ -f "$release/package.json" && ! -L "$release/package.json" ]] || die 'Archive has no regular package.json'
printf '%s\n' "$sha" > "$release/REVISION"
# Refuse an archive-supplied environment file instead of following it.
[[ ! -e "$release/.env" && ! -L "$release/.env" ]] || die 'Archive must not contain .env'
ln -s ../../shared/.env "$release/.env"
cd "$release"
step='install dependencies'
log "$step"
env -u NODE_ENV CI=true pnpm install --frozen-lockfile --prod=false
step='pre-deploy snapshot'
if [[ -f "$ROOT/shared/data/payload.db" ]]; then
  mkdir -p "$ROOT/shared/backups/pre-deploy"
  chmod 700 "$ROOT/shared/backups/pre-deploy"
  snapshot="$ROOT/shared/backups/pre-deploy/$name.db"
  sqlite_snapshot "$ROOT/shared/data/payload.db" "$snapshot"
fi
step='migrate'
migration_started=1
log "$step"
(
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/shared/.env"
  set +a
  export NODE_ENV=production
  pnpm migrate
)
if [[ "${STUDIO_UTO_SEED:-0}" == 1 ]]; then
  step='seed'
  log "$step"
  (
    set -a
    # shellcheck disable=SC1091
    . "$ROOT/shared/.env"
    set +a
    export NODE_ENV=production SEED_ALLOW_REMOTE=true
    pnpm seed
  )
fi
step='build'
log "$step"
(
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/shared/.env"
  set +a
  export NODE_ENV=production
  pnpm build
)
step='switch current'
switch_current "releases/$name"
switched=1
if service_control restart && health_check; then
  healthy=1
  log "Healthy release $name"
  prune "releases/$name" "$previous"
  log "Deploy complete: $name (previous: ${previous:-none})"
  exit 0
fi
log "Release $name failed health checks" >&2
migration_notice
if [[ -z "$previous" ]]; then
  log 'First deploy: leaving current pointing at the failed release for inspection' >&2
  exit 1
fi
recovering=1
switch_current "$previous"
rollback_status=0
if ! service_control restart || ! health_check; then rollback_status=2; fi
mv -- "$release" "$release.failed"
if (( rollback_status == 2 )); then
  log "Automatic rollback to $previous also failed health checks; failed release: $name.failed" >&2
  exit 2
fi
log "Automatically rolled back to healthy $previous; failed release: $name.failed" >&2
exit 1
