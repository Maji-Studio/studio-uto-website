# 6. Email through Resend, Mailpit locally

Status: Accepted. Builds on [ADR 0004](0004-vps-sqlite-local-media.md) and [ADR 0005](0005-server-operations.md).

Date: 2026-10-30

## Context

Payload had no email adapter, so it wrote every mail to the log. Password resets need real mail now. The booking tool and its reminder jobs will need it later, and they will send through `payload.sendEmail`, so the adapter has to sit in the Payload config rather than in the auth code. The VPS provider is still open, and many providers block outbound SMTP ports on new accounts (DigitalOcean blocks 25, 465 and 587).

## Decision

**Resend in production, over its HTTP API.** We compared Resend and Postmark. Payload 4.0.0-beta.5 ships `@payloadcms/email-resend` but has no Postmark adapter, so Postmark would have meant SMTP on port 2525 or an adapter of our own. Resend's free plan (3,000 mails a month, 100 a day) covers a small studio, and it can send from its Ireland region (`eu-west-1`). The API key has sending access to the site's domain only.

**Mailpit locally, over SMTP.** `@payloadcms/email-nodemailer` sends to Mailpit on `127.0.0.1:1025`, and its inbox is at http://localhost:8025. Nothing leaves the machine. Mailpit is a single binary from Homebrew, so there is still no Docker.

**The environment picks the adapter** (`src/payload/email.ts`). `RESEND_API_KEY` selects Resend. Without it, `SMTP_HOST` selects SMTP. With neither, development keeps Payload's console output, and production refuses to start. A server that quietly logs reset mail instead of sending it is worse than one that fails its deploy health check. Both adapters need `EMAIL_FROM_ADDRESS`. `EMAIL_FROM_NAME` defaults to "Studio Uto".

**Our own reset mail, in German.** Payload builds the reset link from `serverURL`, or from the request's Host when the CORS or CSRF list names it. This config sets neither, so Payload's link came out relative and useless in a mail. The Users collection now builds the link from `NEXT_PUBLIC_SERVER_URL`, which also stops a forged Host header from pointing the link elsewhere. We left `serverURL` unset on purpose: setting it would turn every media URL absolute.

**The sender domain is verified by DNS.** Resend asks for an MX and an SPF TXT record on `send.<domain>` (its return path) and a DKIM key on `resend._domainkey.<domain>`. Neither touches the domain's own MX records, so existing mailboxes keep working. The wizard's two email stages walk through the records, check them with `dig`, store the key and sender in the production 1Password item, and can send a test mail. The sender should be a mailbox someone reads, because people reply to these mails.

**A real Mailpit in the tests.** `src/payload/email.mailpit.test.ts` starts its own Mailpit on free ports, runs Payload's forgot-password flow against a temporary SQLite file and reads the mail back through Mailpit's API. CI installs the Mailpit release binary (pinned version and checksum) and fails if that suite was skipped, like the Linux server suites.

## Consequences

- Production needs `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS`. `pnpm env:check` treats both as required, and the deploy fails without them.
- Locally, run `mailpit` (or `brew services start mailpit`) before testing anything that sends mail. Without it, sends fail with a connection error.
- No mail is stored in the database, so `anonymise.ts` is unchanged. If bookings ever keep an outbox, that table needs an anonymiser.
- Switching provider later means a new adapter in `src/payload/email.ts` and new DNS records. Callers of `payload.sendEmail` don't change.
- The free plan allows one domain and 100 mails a day. Booking reminders may outgrow it.
