#!/usr/bin/env bash
set -euo pipefail
# Keep this entry point compatible with macOS Bash 3.2.
[[ $# == 1 && -n "$1" && "$1" != -* ]] || { printf 'Usage: %s <ssh-target>\n' "$0" >&2; exit 1; }
[[ -n "${DOMAIN:-}" ]] || { printf 'DOMAIN is required\n' >&2; exit 1; }
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
prefix='env'
for variable in DOMAIN ACME_EMAIL TLS_INTERNAL WWW_REDIRECT SKIP_FIREWALL DEPLOY_SSH_PUBLIC_KEY; do
  if value=$(printenv "$variable"); then
    printf -v quoted '%q' "$value"
    prefix="$prefix $variable=$quoted"
  fi
done
remote='set -euo pipefail
work=$(mktemp -d)
trap '\''rm -rf -- "$work"'\'' EXIT
trap '\''exit 1'\'' HUP INT TERM
tar -xf - -C "$work"
cd "$work"
'
remote="$remote$prefix bash ./setup.sh"
printf -v remote_quoted '%q' "$remote"
printf '[%s] Provisioning %s\n' "$(date -u +%FT%TZ)" "$1"
COPYFILE_DISABLE=1 tar --no-xattrs --exclude='*.test.ts' -cf - -C "$SCRIPT_DIR" . | ssh "$1" "bash -c $remote_quoted"
