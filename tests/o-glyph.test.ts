import { describe, expect, it } from "vitest";

import { fitO, inkWidth } from "@/lib/o-glyph";

// Reference strokes rasterised from UTOVariableVF at 400px (ink 240px tall).
const FS = 400;
const measured = [
  { wght: 14, cont: 100, wdth: 56.5, side: 22, cap: 8 },
  { wght: 24, cont: 0, wdth: 56.5, side: 35, cap: 27 },
  { wght: 60, cont: 0, wdth: 30, side: 77, cap: 62 },
  { wght: 38, cont: 97, wdth: 30, side: 50, cap: 21 },
  { wght: 100, cont: 50, wdth: 100, side: 136, cap: 78 },
  { wght: 5, cont: 50, wdth: 20, side: 11, cap: 6 },
];

describe("fitO", () => {
  it.each(measured)(
    "matches the glyph's strokes at wght $wght, CONT $cont, wdth $wdth",
    ({ wght, cont, wdth, side, cap }) => {
      const rect = { x: 0, y: 0, w: inkWidth(wdth / 100) * FS, h: 0.6 * FS };
      const fit = fitO(rect, { wght, cont });

      expect(fit.fs).toBeCloseTo(FS);
      expect(fit.wdth).toBeCloseTo(wdth);
      expect(fit.sx).toBeCloseTo(1);
      expect(Math.abs(fit.side - side)).toBeLessThan(1.5);
      expect(Math.abs(fit.cap - cap)).toBeLessThan(1.5);
    },
  );

  it("scales past the width axis when the box is wider or narrower", () => {
    const axes = { wght: 14, cont: 100 };
    const wide = fitO({ x: 0, y: 0, w: 2000, h: 300 }, axes);
    expect(wide.wdth).toBe(100);
    expect(wide.sx).toBeGreaterThan(1);

    const narrow = fitO({ x: 0, y: 0, w: 390, h: 844 }, axes);
    expect(narrow.wdth).toBe(0);
    expect(narrow.sx).toBeLessThan(1);
  });

  it("places the counter inside the strokes", () => {
    const fit = fitO(
      { x: 10, y: 20, w: 1440, h: 900 },
      { wght: 14, cont: 100 },
    );
    expect(fit.counter).toEqual({
      x: 10 + fit.side,
      y: 20 + fit.cap,
      w: 1440 - 2 * fit.side,
      h: 900 - 2 * fit.cap,
    });
  });
});
