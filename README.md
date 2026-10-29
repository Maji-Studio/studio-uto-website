# Atelier Uto

Studio Uto marketing website, built with Next.js (App Router), React and TypeScript, with a Payload CMS admin under `/admin`. Styling is plain hand-written CSS (design tokens in `src/styles/global.css`, one stylesheet per component) — no CSS framework.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

## Structure

- `src/app/(frontend)` holds the five public routes (`/`, `/impressionen/`, `/information/`, `/kontakt/`, `/sketch/`) and the root layout with the cross-document view-transition head scripts.
- `src/components` holds the page components. Behaviour that used to live in Astro `<script>` tags sits in `*.script.ts` modules, started from small `*.client.tsx` components.
- `src/lib/content` is the content contract: pages read content only through the async getters in `index.ts`, which currently return the bundled data in `static.ts`.
- Navigation uses plain `<a href>` links on purpose: the site relies on cross-document View Transitions between full page loads.
- `CONTENT_MODEL.md` describes the content shapes.

## Images

Content images are rendered with `next/image` from `ContentImage` values (URL, intrinsic size, alt text), so they work for bundled files and for remote CMS URLs alike.
