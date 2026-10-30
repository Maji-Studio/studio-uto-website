#!/usr/bin/env bash
set -euo pipefail
PNPM_VERSION=11.13.1
MIN_NODE_VERSION=24.22.1
ROOT=${STUDIO_UTO_ROOT:-/srv/studio-uto}
ROOT=${ROOT%/}
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
log() { printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*"; }
die() { log "$*" >&2; exit 1; }
[[ $EUID == 0 ]] || die 'Setup must run as root'
# shellcheck disable=SC1091
. /etc/os-release
[[ "$ID" == ubuntu && "$VERSION_ID" == 24.04 ]] || die 'Only Ubuntu 24.04 is supported'
(( BASH_VERSINFO[0] >= 5 )) || die 'Bash 5 is required'
# systemd unit paths are unquoted, so no spaces.
root_pattern='^/[a-zA-Z0-9_./-]+$'
[[ "$ROOT" =~ $root_pattern && "$ROOT" != / ]] || die 'STUDIO_UTO_ROOT must be an absolute path using letters, digits, dots, slashes, underscores or hyphens'
[[ "${DOMAIN:-}" =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ && "$DOMAIN" != *..* ]] || die 'DOMAIN is required and must be a DNS hostname'
[[ -z "${ACME_EMAIL:-}" || "$ACME_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$ ]] || die 'Invalid ACME_EMAIL'
for flag in TLS_INTERNAL WWW_REDIRECT SKIP_FIREWALL; do
  case "${!flag:-}" in ''|0|1) ;; *) die "$flag must be 0 or 1" ;; esac
done
export DEBIAN_FRONTEND=noninteractive
# A fresh VPS often runs unattended-upgrades right after boot; wait for its apt lock.
apt_get() {
  local attempt
  for attempt in $(seq 60); do
    if apt-get -o DPkg::Lock::Timeout=600 "$@"; then return 0; fi
    pgrep -x 'apt|apt-get|dpkg' >/dev/null || pgrep -f '/usr/bin/unattended-upgrade( |$)' >/dev/null || return 1
    log "apt is locked by another process; retrying ($attempt/60)"
    sleep 10
  done
  return 1
}
log 'Installing Ubuntu prerequisites'
apt_get update
# Python validates restore archives; sudo provides the restricted deploy operations.
apt_get install -y ca-certificates curl gnupg debian-keyring debian-archive-keyring apt-transport-https sqlite3 age s3cmd unattended-upgrades ufw python3 sudo
install -d -o root -g root -m 755 /etc/apt/keyrings
log 'Installing Node 24 from NodeSource'
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --batch --yes --dearmor -o /etc/apt/keyrings/nodesource.gpg
chmod 644 /etc/apt/keyrings/nodesource.gpg
printf 'deb [arch=%s signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main\n' "$(dpkg --print-architecture)" > /etc/apt/sources.list.d/nodesource.list
apt_get update
apt_get install -y nodejs
node_version=$(node --version)
dpkg --compare-versions "${node_version#v}" ge "$MIN_NODE_VERSION" || die "Node >= $MIN_NODE_VERSION is required; NodeSource installed $node_version. Wait for that version or resolve the repository before deploying."
if ! command -v pnpm >/dev/null 2>&1 || [[ "$(pnpm --version)" != "$PNPM_VERSION" ]]; then
  npm install -g "pnpm@$PNPM_VERSION"
fi
log 'Installing official Caddy stable packages'
curl -1fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
chmod 644 /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
apt_get update
apt_get install -y caddy

if [[ -z "$(swapon --show --noheadings)" ]]; then
  if [[ ! -e /swapfile ]]; then
    log 'Creating 4G swapfile for builds'
    (umask 0077; fallocate -l 4G /swapfile)
    chmod 600 /swapfile
    mkswap /swapfile
  else
    [[ -f /swapfile && ! -L /swapfile ]] || die '/swapfile must be a regular file'
    chmod 600 /swapfile
    [[ "$(stat -c %s /swapfile)" == 4294967296 ]] || die 'Existing /swapfile is not 4G; inspect it manually'
    [[ "$(blkid -p -s TYPE -o value /swapfile)" == swap ]] || die 'Existing /swapfile has no swap signature; refusing to reformat it'
  fi
  swapon /swapfile
fi
if swapon --show=NAME --noheadings | grep -qx /swapfile; then
  if ! awk '$1 == "/swapfile" { found=1 } END { exit !found }' /etc/fstab; then
    printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
  fi
fi

log 'Preparing user and persistent directories'
getent group uto >/dev/null || groupadd uto
if ! id -u uto >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash --gid uto uto
else
  [[ "$(id -u uto)" != 0 ]] || die 'uto must be a non-root account'
  usermod --shell /bin/bash --gid uto --home /home/uto uto
fi
install -d -o uto -g uto -m 750 /home/uto
caddy_group_changed=0
if ! id -nG caddy | tr ' ' '\n' | grep -qx uto; then
  usermod -aG uto caddy
  caddy_group_changed=1
fi
for directory in "$ROOT" "$ROOT/releases" "$ROOT/shared" "$ROOT/shared/media"; do
  install -d -o uto -g uto -m 750 "$directory"
done
for directory in "$ROOT/shared/data" "$ROOT/shared/backups" "$ROOT/shared/backups/pre-deploy" "$ROOT/shared/backups/tmp"; do
  install -d -o uto -g uto -m 700 "$directory"
done
# Pre-create locks so the backup unit can flock with a read-only descriptor.
for lock in "$ROOT/deploy.lock" "$ROOT/backup.lock"; do
  [[ -e "$lock" ]] || touch "$lock"
  chown uto:uto "$lock"
  chmod 600 "$lock"
done

install -d -o uto -g uto -m 700 /home/uto/.ssh
authorized=/home/uto/.ssh/authorized_keys
if [[ ! -e "$authorized" && -f /root/.ssh/authorized_keys ]]; then
  install -o uto -g uto -m 600 /root/.ssh/authorized_keys "$authorized"
fi
if [[ -n "${DEPLOY_SSH_PUBLIC_KEY:-}" ]]; then
  [[ "$DEPLOY_SSH_PUBLIC_KEY" != *$'\n'* && "$DEPLOY_SSH_PUBLIC_KEY" != *$'\r'* ]] || die 'Deploy public key must be one line'
  if [[ "$DEPLOY_SSH_PUBLIC_KEY" =~ ^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521))\ ([A-Za-z0-9+/]+={0,3})(\ .*)?$ ]]; then
    key_type=${BASH_REMATCH[1]}
    key_data=${BASH_REMATCH[3]}
  else
    die 'Expected a plain SSH public key without authorized_keys options'
  fi
  keyfile=$(mktemp /home/uto/.ssh/.authorized-keys.XXXXXX)
  if [[ -f "$authorized" ]]; then sed '/studio-uto-deploy$/d' "$authorized" > "$keyfile"; fi
  printf '\ncommand="/usr/local/bin/studio-uto-ssh-command",restrict %s %s studio-uto-deploy\n' "$key_type" "$key_data" >> "$keyfile"
  chown uto:uto "$keyfile"
  chmod 600 "$keyfile"
  mv -Tf "$keyfile" "$authorized"
fi
if [[ -e "$authorized" ]]; then chown uto:uto "$authorized"; chmod 600 "$authorized"; fi

log 'Installing scripts and restricted sudoers policy'
installed=/usr/local/lib/studio-uto
install -d -o root -g root -m 755 "$installed"
shopt -s nullglob
for file in "$installed/"*.sh "$installed/"*.ts; do
  base=${file##*/}
  if [[ ! -f "$SCRIPT_DIR/$base" || "$base" == *.test.ts ]]; then rm -f -- "$file"; fi
done
for file in "$SCRIPT_DIR/"*.sh "$SCRIPT_DIR/"*.ts; do
  base=${file##*/}
  [[ "$base" != *.test.ts ]] || continue
  mode=644
  if [[ "$base" == *.sh ]]; then mode=755; fi
  install -o root -g root -m "$mode" "$file" "$installed/$base"
  if [[ "$base" == *.sh && "$base" != setup.sh && "$base" != provision.sh && "$base" != lib.sh ]]; then
    ln -sfn "$installed/$base" "/usr/local/bin/studio-uto-${base%.sh}"
  fi
done
for link in /usr/local/bin/studio-uto-*; do
  [[ -L "$link" ]] || continue
  target=$(readlink "$link")
  if [[ "$target" == "$installed/"* ]]; then
    base=${target##*/}
    if [[ ! -f "$SCRIPT_DIR/$base" || "$base" != *.sh || "$base" == setup.sh || "$base" == provision.sh || "$base" == lib.sh ]]; then rm -f -- "$link"; fi
  fi
done
sudoers=$(mktemp /etc/sudoers.d/.studio-uto.XXXXXX)
printf 'uto ALL=(root) NOPASSWD: /usr/bin/systemctl restart studio-uto.service, /usr/bin/systemctl is-active studio-uto.service\n' > "$sudoers"
chmod 440 "$sudoers"
if ! visudo -cf "$sudoers"; then rm -f "$sudoers"; die 'sudoers validation failed'; fi
chown root:root "$sudoers"
mv -Tf "$sudoers" /etc/sudoers.d/studio-uto

render() {
  local source=$1 destination=$2 escaped_root
  escaped_root=$(printf '%s' "$ROOT" | sed 's/[&|\\]/\\&/g')
  sed "s|__ROOT__|$escaped_root|g" "$source" > "$destination"
}
for unit in studio-uto.service studio-uto-backup.service studio-uto-backup.timer; do
  render "$SCRIPT_DIR/$unit" "/etc/systemd/system/$unit"
  chown root:root "/etc/systemd/system/$unit"
  chmod 644 "/etc/systemd/system/$unit"
done
systemctl daemon-reload
systemctl enable studio-uto.service
if [[ -e "$ROOT/current" ]]; then systemctl restart studio-uto.service; fi
systemctl enable --now studio-uto-backup.timer

email_directive='# ACME email not configured'
if [[ -n "${ACME_EMAIL:-}" ]]; then email_directive="email $ACME_EMAIL"; fi
tls_directive='# Public ACME certificates'
if [[ "${TLS_INTERNAL:-0}" == 1 ]]; then tls_directive='tls internal'; fi
www_block=''
if [[ "${WWW_REDIRECT:-1}" == 1 ]]; then
  www_block=$(printf 'www.%s {\n\t%s\n\tredir https://%s{uri} permanent\n}' "$DOMAIN" "$tls_directive" "$DOMAIN")
fi
caddyfile=$(mktemp)
render "$SCRIPT_DIR/Caddyfile" "$caddyfile"
# Values are validated above; line-wise substitution also preserves the optional block.
while IFS= read -r line; do
  case "$line" in
    *__EMAIL_DIRECTIVE__*) printf '\t%s\n' "$email_directive" ;;
    *__TLS_DIRECTIVE__*) printf '\t%s\n' "$tls_directive" ;;
    __WWW_BLOCK__) printf '%s\n' "$www_block" ;;
    *) printf '%s\n' "${line//__DOMAIN__/$DOMAIN}" ;;
  esac
done < "$caddyfile" > /etc/caddy/Caddyfile
rm -f "$caddyfile"
chown root:root /etc/caddy/Caddyfile
chmod 644 /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl enable caddy
if systemctl is-active --quiet caddy; then
  # A reload cannot acquire new supplementary groups for the existing process.
  if (( caddy_group_changed )); then systemctl restart caddy; else systemctl reload caddy; fi
else
  systemctl start caddy
fi
if [[ "${SKIP_FIREWALL:-0}" != 1 ]]; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 443/udp
  ufw --force enable
fi
log "Setup complete for $DOMAIN at $ROOT"
for file in .env backup.env backup-recipients.txt; do
  if [[ ! -s "$ROOT/shared/$file" ]]; then log "Still missing: $ROOT/shared/$file (create with the human-run wizard)"; fi
done
if [[ ! -e "$ROOT/current" ]]; then log 'Still missing: first release; deploy a git archive'; fi
