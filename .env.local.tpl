# Run pnpm env:local to inject these 1Password references.
DATABASE_URI="op://Environment Variables/studio-uto-website env local/DATABASE_URI"
PAYLOAD_SECRET="op://Environment Variables/studio-uto-website env local/PAYLOAD_SECRET"
NEXT_PUBLIC_SERVER_URL="op://Environment Variables/studio-uto-website env local/NEXT_PUBLIC_SERVER_URL"
# Mailpit catches all mail locally; view it at http://localhost:8025.
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
EMAIL_FROM_ADDRESS=website@studio-uto.test
EMAIL_FROM_NAME="Studio Uto"
# Optional absolute upload directory; defaults to the repo-root media/.
# MEDIA_DIR=/srv/studio-uto/shared/media
