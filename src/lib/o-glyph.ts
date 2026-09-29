/**
 * Geometry of the UTO wordmark's "O" (UTOVariableVF), so the O clock can set the
 * glyph at any size and place its face exactly inside the counter.
 *
 * The O is a rectangle with a rectangular counter, and its proportions follow the
 * variable axes almost linearly, so they are modelled here rather than measured
 * at runtime. Values are in em, taken by rasterising the glyph across the axes;
 * the model is within ~0.25% of the rendered glyph:
 *
 *   ink height    0.6 em; in a line-height 0.8 box the ink starts at the box top
 *   left bearing  0.02 em
 *   ink width     0.6075 em (wdth 0) … 1.8 em (wdth 100)
 *   side stroke   0.30 … 0.34 em (wdth 0 … 100) at wght 100; 0.015 em at wght 1
 *   top / bottom  0.25 em at CONT 0; 0.13 … 0.14 em at CONT 100 (wdth 0 … 100),
 *                 at wght 100; 0.013 em (CONT 0) … 0.003 em (CONT 100) at wght 1
 *
 * Weight has no effect above 100.
 */

export interface Axes {
  /** Weight, 1–100. */
  wght: number;
  /** Contrast, 0–100: thins the top and bottom strokes. */
  cont: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OFit {
  /** Font size, px. */
  fs: number;
  /** Width axis, 0–100. */
  wdth: number;
  /** Horizontal scale on top of the width axis, 1 when the axis suffices. */
  sx: number;
  /** Side stroke, px. */
  side: number;
  /** Top/bottom stroke, px. */
  cap: number;
  /** The counter (the hole), in the same space as the fitted rect. */
  counter: Rect;
}

export const INK_HEIGHT = 0.6;
export const BEARING = 0.02;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Ink width in em for a width axis value in 0–1. */
export const inkWidth = (wd: number) => 0.6075 + 1.1925 * wd;

/**
 * Fit the O's ink box exactly onto `rect`. Height sets the font size; the width
 * axis covers as much of the width as it can and a horizontal scale makes up
 * the rest — the same fit the wordmark uses.
 */
export function fitO(rect: Rect, axes: Axes): OFit {
  const fs = rect.h / INK_HEIGHT;
  const wd = clamp((rect.w / fs - 0.6075) / 1.1925, 0, 1);
  const sx = rect.w / (inkWidth(wd) * fs);
  const k = clamp((axes.wght - 1) / 99, 0, 1);
  const c = clamp(axes.cont / 100, 0, 1);

  const sideMin = 0.015;
  const sideMax = 0.3 + 0.04 * wd;
  const capMin = 0.013 - 0.01 * c;
  const capMax = 0.25 - c * (0.12 - 0.01 * wd);
  const side = (sideMin + (sideMax - sideMin) * k) * fs * sx;
  const cap = (capMin + (capMax - capMin) * k) * fs;

  return {
    fs,
    wdth: wd * 100,
    sx,
    side,
    cap,
    counter: {
      x: rect.x + side,
      y: rect.y + cap,
      w: Math.max(0, rect.w - 2 * side),
      h: Math.max(0, rect.h - 2 * cap),
    },
  };
}
