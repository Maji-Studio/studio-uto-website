# PROTOTYPE — page transitions

**Question:** which cross-document View Transition fits the chip hover (bottom-up clip fill)?

Run `pnpm dev`, open any page with `?variant=A|B|C|D` (D is the default; or use the yellow bar / ← →), click a nav chip or "Play ↗".
The choice sticks across navigations via sessionStorage. Dev only: markup and scripts are gated on `import.meta.env.DEV`. The component CSS still lands in the prod bundle but is inert (nothing sets `data-vt`).

- **A — Full blend:** black rises from the bottom over the old page, then the new page rises over the black. ~950ms.
- **B — Slats:** 8 bands, each filling bottom-up like the chip, in 4 hard steps. Black, then the new page in the same slats. ~660ms.
- **C — Invert cut:** old page flashes negative and knocks left, new page lands negative and knocked right, snaps straight, turns positive. 3 × 90ms frames.
- **D — Reel (A + reel):** a panel carrying the studio reel rises from the bottom over the old page → reel holds 160ms → new page rises over it. No page inversion. ~800ms. The wordmark and menu stay anchored on top and invert exactly where the reel passes behind them. On click, the menu's active chip moves to the destination right away (pageswap), so the inversion wipes over one consistent menu.
  - Reel: canvas-rendered, 12 fps presented, shutter-sampled motion blur, greyscale grade, destination chip. Stand-in footage = the two studio stills with a camera drift. The reel clock carries across pages.
  - Knobs at the top of the reel script: `FPS`, `TRAIL` (blur length), `SHOT` (seconds per cut), `MOVES` (camera paths).
  - Real footage later: draw a playing `<video>` instead of the stills in `shootAt()`; the same accumulate-then-present-at-12fps loop gives it the look.

A–C keep the UTO wordmark anchored on top; it's difference-blended so it flips white over black.

**Verdict:** _TBD_

When decided: fold the winner into `src/styles/global.css` (replacing the `animation: none` root rule), then delete this folder and its imports + three `import.meta.env.DEV` lines in `BaseLayout.astro`.
