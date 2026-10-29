#!/usr/bin/env bash
set -euo pipefail

command=${SSH_ORIGINAL_COMMAND:-}
# sshd does not accept client environment overrides by default.
deploy_bin=${STUDIO_UTO_DEPLOY_BIN:-/usr/local/bin/studio-uto-deploy}
if [[ "$command" =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  exec "$deploy_bin" deploy "${BASH_REMATCH[1]}"
elif [[ "$command" == rollback ]]; then
  exec "$deploy_bin" rollback
fi
printf '[%s] Refused SSH command: expected deploy <40 lowercase hex sha> or rollback\n' "$(date -u +%FT%TZ)" >&2
exit 64
