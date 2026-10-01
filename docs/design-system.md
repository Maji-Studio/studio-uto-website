# Studio Uto design system

The reference for the Studio Uto design system. It covers tokens, type, components, slide templates and brand rules. The system lives in the Figma Slides file and is derived from this website. **Keep this file current.** Any change to the Figma library, or to the website tokens it mirrors, updates this file in the same session. Add a line to the [Changelog](#changelog) too.

- **Figma file:** https://www.figma.com/slides/799CnBtLPVDjUiuLNBH7ek (fileKey `799CnBtLPVDjUiuLNBH7ek`)
- **Source of truth for style:** `src/styles/global.css`, `src/components/home/SiteHeader.astro`, `src/components/home/Logo.astro`, `src/components/home/studio/Facts.astro`, `src/components/impressionen/EntityRow.astro`, `src/pages/kontakt.astro`
- **Source of truth for facts:** `src/lib/studio.ts`, `src/lib/information.ts`, `src/lib/site.ts`. Never invent numbers.
- **Decisions:** [ADR 0002](adr/0002-figma-design-system-website-style.md)

## Principles

1. **Website style, not grids.** Use the cropped UTO wordmark, black chips, and big regular Helvetica set flush left that sinks to the bottom. The ground is mid-grey `#A9A9A6` or white. Don't use hairline ledgers, numbered rails or column rules.
2. **Renting is the point.** Every deck ends on the rates and "Jetzt anfragen" (info@atelier-uto.ch).
3. **Build only from instances.** Change components only in the hidden row `00 Bibliothek`, never on a slide.
4. **Bind, don't hardcode.** Every fill uses a `UTO / Color` token and every text uses a text style.

## Where things live in the file

Slide rows, in order:

| Row | Content |
|---|---|
| `00 System` (hidden) | Wordmark, Chip, Liste 8, Statement (old MODULE slide, which blocks variants). 18 rental icons. |
| `00 Bibliothek` (hidden) | **The library.** So gehts (usage) · Basis · Fakten · Bild und Marke · Listen · Farbfeld |
| `01 Brand-Kit`, `02 Studio`, `03 Kollektion` | The old decks, still in the grid style. They are to be rebuilt from the templates. |
| `04 Vorlagen · Website` | 21 templates, V01–V21. Start every new slide here. |
| `Explorations (verworfen)` (hidden) | Rejected samplers. Leave them alone. |

## Slide geometry

- **Slide:** 1920 × 1080.
- **Page edge:** content starts at x 11 (`page-pad`); full width is 1898.
- **Label column:** 492 wide (`label-col`), so content starts at x 503. This is the website's 1fr : 3fr split from `Facts.astro`.
- **Header:** y 11, or y 122 under the cropped wordmark.
- **Cropped wordmark:** 1898 × 209 at y −112. At y 11 it sits uncropped.
- **Bottom-anchored text:** list and statement blocks end at y 1069.
- **Footnote:** Body/L, x 1198, w 700, bottom at y 1069.

## Tokens

### `UTO / Color`

| Token | Value | CSS | Use |
|---|---|---|---|
| `ink` | #0A0A0A | `var(--color-ink)` | text, rules, dark slides |
| `paper` | #FFFFFF | `var(--color-paper)` | white slides |
| `ground` | #A9A9A6 | (hardcoded on /kontakt) | grey slides |
| `ink-soft` | #2C2C2A | (hardcoded on /kontakt) | list items, form labels |
| `muted` | #6B6B68 | `var(--color-muted)` | section numbers, subtitles |
| `chip` | #111111 | `var(--color-chip)` | chip and number fields |
| `chip-label` | #FFFFFF | `var(--color-chip-label)` | text on chips |
| `chip-active` | #8C8C89 | `var(--color-chip-active)` | active chip |
| `paper-alt` | #EEEEEE | `var(--color-chip-fill)` | light chips |
| `line` | #E4E4E0 | `var(--color-line)` | rare light rules |
| `caption` | #4E5052 at 72 % | (none) | image caption pill |
| `field` | #2B4C8C | (none) | Uto Kobalt, used only for covers and breaks in decks |
| `field-ink` | #0A0A0A | (none) | text on field |

### `UTO / Space`

| Token | Value | Source |
|---|---|---|
| `page-pad` | 11 | `--page-pad` (upper clamp) |
| `chip-gap` | 4 | chip rows, `SiteHeader` / `Facts` `--gap` |
| `fact-gap` | 14 | text to number chip in a fact line |
| `line-gap` | 8 | between fact lines |
| `block-gap` | 44 | between fact blocks |
| `label-col` | 492 | 1fr column of the 1fr : 3fr fact grid |

### `UTO / Type`

`font/family` is set to "Arimo", which stands in for Helvetica Neue because the plugin API can't load Helvetica Neue. **Switch it to "Helvetica Neue" in Figma desktop** and every style follows. `font/weight/regular` and `font/weight/bold` hold the weights. The `size/*` variables feed the styles.

## Text styles

| Style | Size | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `Statement` | 192 | Regular | 100 % | −3 % | single-statement slides, Kapitel titles |
| `List/6 Zeilen` | 136 | Regular | 104 % | −2 % | lists of up to 6 rows |
| `List/8 Zeilen` | 104 | Regular | 104 % | −1.5 % | lists of up to 8 rows, table of contents, cover title |
| `Heading/1 Regular` | 96 | Regular | 94 % | −2.5 % | section head (Abschnitt Kopf) |
| `Heading/2 Regular` | 56 | Regular | 100 % | −1.5 % | fact lines, form labels, names list |
| `Body/L` | 28 | Regular | 130 % | −0.5 % | footnotes, image-row titles, glyph labels |
| `Body/M` | 20 | Regular | 135 % | 0 | captions, glyph details |
| `Label/M` | 16 | Bold, uppercase | 120 % | 4 % | chips, buttons |
| `Label/S` | 13 | Regular, uppercase | 120 % | 6 % | small notes |

If a text needs an off-ramp size (e.g. the 620 px "Aa" on V18), apply the nearest style, set the size, and then re-bind `fontFamily` and `fontStyle` to the variables. Do this rarely.

The Slides theme defaults (Title, Header 1–3, Body 1–3, Note) are unused. Don't use them.

## Components

All components are in `00 Bibliothek`, apart from the first five rows, which sit on `00 System`. Component names and copy are German.

| Component | Variants / properties | Use |
|---|---|---|
| **Wordmark** `4:7` | none | UTO outlined from UTO Variable (wght 100, wdth 100, CONT 50), ratio 9.07 : 1. Scale freely; recolour only to ink, paper or Kobalt. |
| **Chip** `4:21` | Tone = Dark / Light / Field · `Label` | a black field with a white uppercase label (website `.chip`) |
| **Liste 8 / Website** `17:539` | `Heading`, `Items` (one per line) | big list, 8 rows, bottom-anchored. Place at x 11, y 60. |
| **Liste 6 / Website** `20:547` | `Heading`, `Items` | big list, 6 rows |
| **Statement / Website** `17:542` | `Statement` | one sentence at 192, bottom-anchored |
| **Kopfzeile** `31:765` | Ton = Dunkel / Hell · exposed chips Marke, Deck, Aktion, Seite | header chip row on every slide. Use Dunkel on grey or white, Hell on black. |
| **Zahl** `31:766` | `Wert` | number in a chip at line size (website `.facts-num`) |
| **Faktenzeile** `32:795` | Aufbau = Text zuerst / Zahl zuerst · `Text` · `Zahl 1–3 zeigen` · `Text zeigen` · `Nachsatz` + `Nachsatz zeigen` | one fact line; wraps when long. "Zahl zuerst" handles lines like "Mo – Fr jeweils 9:00 – 18:00 Uhr". |
| **Faktenblock** `32:796` | label chip · **slot** `Zeilen` | a label chip in the label column with fact lines beside it. Add or delete lines inside the slot. Stack blocks with `block-gap`. |
| **Abschnitt** `32:829` | Grösse = Kopf (96) / Liste (104) / Kapitel (192) · `Nummer`, `Titel` | grey number in the label column, title from x 503 (website `.facts-head`) |
| **Bildlegende** `31:768` | `Text` | translucent caption pill on an image |
| **Bildreihe** `33:769` | `Titel`, `Untertitel` · images Bild 1–3 | a row as on /impressionen: rule, name and subtitle on the left, three 3:2 images on the right. Replace images by fill. |
| **Glyphe** `33:790` | `Icon` (swap among the 18 rental icons) · `Label` · `Detail` + `Detail zeigen` | rental glyph with a label |
| **Farbfeld** `33:810` | Chips = Hell / Dunkel | colour band, 384 × 1080. Set the fill to a token. |
| **Formularfeld** `31:778` | Höhe = Einzeilig / Mehrzeilig · `Label` | big label with a line under it, as on /kontakt |
| **Absenden** `31:770` | `Label` | wide black submit button |
| **Icon / Miete · Raum · Zugang / …** `7:799`–`7:899` | none | 18 rental icons, 160 × 100. Scale with `rescale()`, not `resize()`. |

Retired, kept only for the old decks: `Alt / Meta Bar`, `Alt / Rail`, `Alt / Row / Index`, `Alt / Row / Fact`, and the text styles `Alt/Display/*`, `Alt/Heading/1–3`, `Alt/Numeral`. Don't use them. Delete them once decks 01–03 are rebuilt.

## Templates (`04 Vorlagen · Website`)

| # | Name | Slide | Built from |
|---|---|---|---|
| V01 | Titel | `22:534` | Wordmark, Kopfzeile + nav chips, hero image, Bildlegende |
| V02 | Inhalt | `22:561` | Abschnitt Liste × 8 |
| V03 | Kapitel | `22:586` | Abschnitt Kapitel |
| V04 | Statement unten, grau | `22:598` | Wordmark cropped, Statement / Website |
| V05 | Statement oben, weiss | `22:614` | Statement text |
| V06 | Statement, schwarz | `22:625` | Kopfzeile Hell |
| V07 | Liste 8 | `23:576` | Liste 8 / Website |
| V08 | Liste 6 | `23:589` | Liste 6 / Website |
| V09 | Fakten | `23:602` | Abschnitt Kopf, Faktenblock × 4 |
| V10 | Preise | `23:651` | Abschnitt Kopf, Faktenblock, booking chips |
| V11 | Bild gross | `23:694` | full-bleed image, chip caption |
| V12 | Bildreihen | `23:706` | Bildreihe × 3 |
| V13 | Bild und Text | `24:614` | half image, text, Faktenzeile |
| V14 | Grundriss | `24:632` | vector floor plan with chip labels |
| V15 | Glyphen | `24:666` | Glyphe × 18 |
| V16 | Wortmarke | `24:770` | Wordmark, Faktenblock |
| V17 | Farbe | `24:807` | Farbfeld × 5 |
| V18 | Schrift | `24:841` | "Aa" specimen, Faktenzeile × 5 |
| V19 | Anfahrt | `25:716` | Glyphe with detail × 5, address |
| V20 | Kontakt | `25:761` | names list, Formularfeld × 5, Absenden |
| V21 | Lookbook | `25:790` | 2 × 3 image grid (loose, one-off) |

**Making a slide:** duplicate a template into the deck's row. Change Deck and Seite in the Kopfzeile, then edit the instance properties. Don't detach.

## Brand rules

- **Wordmark:** runs edge to edge, 11 px from the page edge, with the chip row 10 px below (`SiteHeader` `margin-top`). It is at least 32 px high on screen, the smallest size on the website (`Logo.astro`: font-size clamp minimum 40 px × line-height 0.8). Don't stretch, rotate or recolour it by hand. Only the UTO Variable width axis changes its shape.
- **Colour:** monochrome. Uto Kobalt (`field`) appears only on deck covers and breaks, never on the website.
- **Type:** Helvetica Neue Regular for almost everything. Bold appears only in uppercase labels.
- **Glyphs:** the set is fixed at 18 rental glyphs (Miete, Raum, Zugang). Equipment is named in text, not drawn.
- **Images:** credit real client work to its photographer. Label generated imagery once per deck: "Bilder: generierte Konzeptstudien". Never present generated garments as products.
- **Copy:** German, Swiss spelling ("ss", never "ß"). Keep it short and concrete. No em dashes, no puffery, no "nicht nur … sondern auch". Sentence case; uppercase comes only through the Label styles.
- **Facts:** Shooting-Fläche L 7 m · B 7 m · H 5.7 m; Ganzes Studio L 14 m · B 7 m · H 2.7 m. Rates excl. MWST: Ganzer Tag (10 h) CHF 850 · Halber Tag (4 h) CHF 550 · Zusätzliche Stunde CHF 150 · Styling-Raum CHF 100. Mo – Fr 9:00 – 18:00 Uhr.

## Working on the file with agents

- Load the skills `figma:figma-use` and `figma:figma-use-slides` before any `use_figma` call. Add `figma:figma-generate-library` when you change components.
- `get_metadata` and `get_libraries` don't work on Slides files. Inspect with read-only `use_figma` scripts and `node.screenshot()`.
- Append a node to its parent **before** setting x and y. Otherwise it lands 240 px off.
- Older slides are wrapped in `MODULE` nodes. `combineAsVariants` fails there but works on the `00 Bibliothek` slides. `figma.getSlideGrid()` is stale; walk `SLIDE_GRID → SLIDE_ROW → (MODULE →) SLIDE` instead.
- A comma inside a variant value breaks the component set.
- Set `clipsContent = false` on text-bearing component frames. At line-height 100 % the descenders otherwise get clipped.
- When removing nodes in a loop, check `!node.removed` before reading positions.
- A failing `use_figma` script rolls back as a whole, so fix it and rerun.
- Upload images with `upload_assets` (nodeIds), then `curl -F file=@…` to each `submitUrl`. Reuse placed images by `imageHash`.

## Open items

- Rebuild decks 01–03 from the templates. Then delete the `Alt` components and styles, and archive the old rows.
- `src/assets/studio/grundriss.png` is labelled 12.5 × 6.5 m, which contradicts `studio.ts` (7 × 7 m / 14 × 7 m). Fix the image.
- Switch `font/family` to Helvetica Neue in Figma desktop.
- V21 Lookbook is still loose. Make it a component if a second lookbook slide is needed.

## Changelog

- **2026-10-01:**
  - Three decks were built in the grid style, then templates V01–V21 in the website style.
  - Library row `00 Bibliothek` with 12 components; templates rebuilt from instances.
  - Tokens added: `chip-active`, `caption`, and the website space tokens. Grid space tokens deleted.
  - Grid components and styles retired to `Alt`.
  - Wordmark rules now come from `Logo.astro` and `SiteHeader.astro`.
