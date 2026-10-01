# 2. Figma design system follows the website, not a grid

Date: 2026-10-01

## Context

The Studio Uto decks in Figma Slides (`799CnBtLPVDjUiuLNBH7ek`) were first built in three grid-led styles: hairline ledgers, a side rail, a meta bar, and bold display type. The user rejected the grid look. The decks should look like the website instead: a cropped wordmark, black chips, and big regular Helvetica set flush left on grey or white.

## Decision

- **The website is the source of truth.** The Figma system copies its tokens and parts from `global.css` and the components named in `docs/design-system.md`. Facts come only from `src/lib/`.
- **One library in the file.** All components live in the hidden row `00 Bibliothek`. Templates and decks use instances only. A Slides file can't share a library with other files, so the system stays in this file.
- **Grid parts are retired, not deleted, while decks 01–03 still use them.** They are renamed `Alt /`. Grid spacing tokens nobody used were deleted.
- **Brand rules come from code, not invention.** The wordmark minimum (32 px high) and edge rule come from `Logo.astro` and `SiteHeader.astro`. The earlier made-up rules (120 px, 25 mm, one wordmark-height of clear space) are dropped.
- **No new glyphs.** The 18 rental glyphs are the set.
- **`studio.ts` dimensions win over the floor-plan image** (7 × 7 m / 14 × 7 m, not 12.5 × 6.5 m).

## Consequences

- `docs/design-system.md` is the running reference and must be updated with every library change.
- Decks 01–03 must be rebuilt from the templates before the `Alt` parts can be deleted.
- `src/assets/studio/grundriss.png` needs its dimensions corrected.
