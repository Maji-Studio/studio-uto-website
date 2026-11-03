# Content Model

Content lives in Payload CMS (`/admin`), backed by SQLite in WAL mode. Collection and global document IDs are numeric; nested array row IDs remain strings. The pages never read Payload directly: they await the getters in `src/lib/content/index.ts` and get the shapes defined in `src/lib/content/types.ts`. The mapping between the two is in `src/lib/content/payload.ts`, with tests.

| In the admin | Payload | Feeds | Getter |
| --- | --- | --- | --- |
| Website | global `site-settings` | name, description, contact, address, header navigation, Beteiligte (Kontakt) | `getSiteSettings()` |
| Information | global `information` | every section on `/information/`; the homepage intro reads its facts from it | `getInformationSections()`, `getStudioSections()`, `getStudioPhotos()` |
| Impressionen | collection `impressionen` (drag to reorder) | the rows on `/impressionen/` | `getImpressionen()` |
| Media | collection `media` | every content image, with its alt text | — |
| Users | collection `users` | admins and editors | — |

Media uploads keep the untouched source copy. Raster images become WebP at upload: a main file at most 2560 px wide and 480/768/1280/1920 px variants, without enlargement. SVG stays unchanged. The mapper returns the main file and a width-sorted `srcSet`, excluding the admin thumbnail. Files live in the repo-root `media/` locally, or the absolute directory set by `MEDIA_DIR` on the server. URLs stay at `/api/media/file/<filename>`; Caddy will serve that path directly from the media directory on the VPS. The site uses these URLs without Next image optimization.

## Information sections

Each section has an anchor (the `#id` on `/information/`), a title, an optional short nav label and blocks. A block can combine:

- **Text**: paragraphs, separated by a blank line.
- **Wertepaare**: term → value rows (dimension → size, service → price).
- **Liste**: one entry per line.
- **Links**: label → destination rows.
- **Bild**: one image at column width (the floor plan).
- **Galerie**: a name plus images; opens in the lightbox. The first gallery is also the homepage "Take a tour".
- **Hinweis**: the muted note under the block.

The homepage intro finds its numbers by pattern in the `daten`, `grundriss`, `oeffnungszeiten`, `preise` and `anfahrt` sections (e.g. "Shooting-Fläche" with "L 7 m · B 7 m · H 5.7 m"). Rewording those rows can drop a label from the intro.

## What stays in code

Decorative imagery (the chrome intro and its hover photos, the page-transition reel, the `/sketch/` sections) and the copy that frames each page.

## Changing the model

1. Edit the collection or global in `src/payload/`.
2. `pnpm generate:types`, then `pnpm migrate:create <name>`. Commit the generated migration and index. Development keeps Payload's automatic schema push; production runs `pnpm migrate` before `pnpm build` on the server.
3. Update the mapper in `src/lib/content/payload.ts` and its test, and `types.ts` if components need the new field.
4. Add it to `scripts/seed-data.ts` if a fresh database should have it.
