# Production 1Password references. ./scripts/setup-infra.sh writes the server's
# /srv/studio-uto/shared/.env from this file with `op inject`.
DATABASE_URI="op://Environment Variables/studio-uto-website env production/DATABASE_URI"
PAYLOAD_SECRET="op://Environment Variables/studio-uto-website env production/PAYLOAD_SECRET"
NEXT_PUBLIC_SERVER_URL="op://Environment Variables/studio-uto-website env production/NEXT_PUBLIC_SERVER_URL"
MEDIA_DIR="op://Environment Variables/studio-uto-website env production/MEDIA_DIR"
