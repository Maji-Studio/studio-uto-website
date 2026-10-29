# 3. Payload CMS 4 on Next.js, set up like CITY STAY

Date: 2026-10-29

## Context

The studio needs to edit the site's content (facts, prices, Impressionen, the people behind the studio) without a developer. The site was a static Astro build with the content in `src/lib/*.ts`. Our other Payload project, CITY STAY, runs Payload 3 on Next.js with MongoDB, DigitalOcean Spaces for media, secrets in 1Password, Vercel hosting, and nightly backups from GitHub Actions.

## Decision

- **Payload 4 (beta), pinned to `4.0.0-beta.5`.** The first v4 beta shipped on 2026-10-09; 3.92 was the stable line at the time. We chose v4 so the site doesn't need a major upgrade soon after launch, and accept that betas can break between releases. Every `@payloadcms/*` package is pinned to the exact same version.
- **Astro is replaced by Next.js 16.4.** Payload's admin runs inside a Next.js (or TanStack Start) app. Keeping Astro would mean two apps and two deploys for a five-page site. The port kept the markup, CSS and scripts. Links stay plain `<a>` so cross-document View Transitions keep working.
- **Copy CITY STAY's infrastructure:** MongoDB on DigitalOcean, media in its own Space through `@payloadcms/storage-s3`, 1Password items `studio-uto-website env local|staging|production` and `studio-uto-website backups`, Vercel, and daily Mongo and Spaces backups into the shared backup Space under `studio-uto/`.
- **Content model follows the old data files.** `site-settings` and `information` are globals, `impressionen` is an orderable collection and `media` holds the images. Pages read them only through `src/lib/content/index.ts`, which maps Payload documents into the shapes in `types.ts`.
- **Decorative imagery stays in the repo:** the chrome intro, the transition reel and `/sketch/`.

## Consequences

- `next build` needs a reachable MongoDB, because the pages are pre-rendered from the CMS. Saving in the admin revalidates them.
- Payload betas need a deliberate upgrade: bump every `@payloadcms/*` package together, read the release notes, then run `pnpm generate:types`, `pnpm generate:importmap` and the build.
- Node 24.22.1 or newer is required locally, in CI and on Vercel.
