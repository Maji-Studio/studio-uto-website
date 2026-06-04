# Atelier Uto

Static editorial studio website built with Astro, React, MDX, Tailwind CSS, and TypeScript.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

## Structure

- `src/pages` defines the manual route tree.
- `src/content/pages` stores editable page MDX.
- `src/content/examples` stores example detail entries with dynamic slugs.
- `src/components/sections/SectionRenderer.tsx` maps section data to React components.
- `CONTENT_MODEL.md` explains the editor-facing content format.

## Content Strategy

Use frontmatter `sections` for layout and component choices. Use the MDX body for longer editorial prose.

This keeps non-technical editing readable while still validating content at build time.

## Images

Put images beside the MDX file that uses them. The content schema validates local image fields. For image-heavy sections that need art-directed responsive output, add an Astro wrapper section later so it can use Astro's `<Image />` or `<Picture />` directly.
