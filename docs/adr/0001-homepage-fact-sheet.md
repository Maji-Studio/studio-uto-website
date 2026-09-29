# 1. Homepage fact sheet built from the wordmark's own parts

Date: 2026-09-29

## Context

The studio facts below the homepage hero (Daten, Grundriss und Ausstattung, Öffnungszeiten, Preise) were a plain two-column hairline list. We prototyped about 20 alternatives in three rounds on `/?variant=`.

- **Round 1** was brutalist, with slabs, numerals, a run-on paragraph and 1996 HTML. Rejected as too heavy.
- **Round 2** borrowed editorial references: grids, mono data sheets, a chrome shader, serif captions. Most felt "off and not in brand".
- **Round 3** used only the site's own parts: the UTO Variable glyphs and their axes, the O clock's rising level, the chips, the header layout, the gallery frame, and the page-transition reel. That round landed.

## Decision

The fact sheet is four parts, in `src/components/home/studio/`:

1. **`Intro`**: a liquid-chrome object that re-forms into the wordmark's letters, U → T → O, one every 10 s, with the key facts as black labels around it.
2. **`Facts`**: each section opens with the wordmark's O set solid at page width. Its slot opens on scroll (the CONT axis) into a window onto a studio photo. The facts sit between the slabs as manifesto-size lines with numbers in chips.
3. **`Tarife`**: huge uppercase tariff lines, each with a small photo and a detail line.
4. **`Outro`**: the page-transition reel, used once. A black band rises and a page of further photos rises over it, linking to /impressionen/.

No photo is used twice on the page.

## Consequences

- **WebGL:** the homepage runs a WebGL raymarch shader, which pauses offscreen, caps DPR at 2 and falls back to `assets/studio/chrome-o.png`. It also runs two scroll-driven scripts (the slot opening and the reel).
- **Generated fallback:** `chrome-o.png` was generated (Codex image tool). The prototype prompts live in the gitignored `output/imagegen/2026-09-29-brutalist-info/`.
- **Data:** all copy still comes from `src/lib/studio.ts` and `src/lib/site.ts`.

## Update (2026-09-29): facts moved to /information/

The O slabs (`Facts`) are off the homepage. Their content — Daten, Grundriss und Ausstattung, Öffnungszeiten, Preise — now renders on `/information/`, spliced into `informationSections` after the intro. The chrome intro's labels link to those sections and show a small studio photo on hover. `Facts.astro` is no longer mounted on the homepage.

`/information/` now renders all of its sections through `Facts` (props: the page's sections), so it matches the homepage: every section opens with an O slab onto its own photo, and Preise shows the `Tarife` lines under its slab. The old `StudioInfo`, `SectionNav` and `sectionNav` are removed. The Ausstattung photo gallery is dropped from that page, because the photos now sit in the slabs.

## Update (2026-09-29): O slabs replaced by numbered headings

The O slabs read as heavy black dividers between sections, so they are gone from `/information/`, along with their photos and scroll script. Each section now opens with a grey section number and its title at display size; Preise lists its prices as ordinary fact lines instead of the homepage's `Tarife`. The number sits in the label column and the title in the text column, both aligned on their cap height, and the space above them separates the sections. The grey number is the same device the Impressionen rows use (`01  Nicolas Burri`), which also dropped their hairline rules. The page has no studio photos now; the homepage hero's tour carries them.
