import { Fragment } from "react";

import OClockScript from "./OClock.client";
import "./OClock.css";

/*
 * The O clock. Clicking the header date (#today) or the wordmark's O lifts the O
 * out of the logo and grows it to fill the viewport; its counter becomes the
 * clock face (src/lib/o-glyph.ts models where the counter sits).
 *
 * The face is a level: a black fill rises through the counter over the minute —
 * the chip hover fill, stretched to 60 s — inverting the time and the seconds
 * scale where it passes. At :00 the counter is full, the O is a solid block, and
 * the level drops.
 *
 * Choreography (runtime in OClock.script.ts):
 *   open   the O grows out of the logo (glyph re-set at its real size every
 *          frame, axes blending from the logo's to the clock's), then the level
 *          rises to the current second while the scale slides in bottom to top,
 *          then the time rolls up into place left to right
 *   tick   the level steps up each second; digits that change roll through
 *   close  the time drops out right to left, the scale slides out and the level
 *          drains, then the O shrinks back into the logo
 * Close: the button, a click anywhere, or Esc.
 */

// Seconds scale, 0 (bottom) → 60 (top). Every 10 s carries a chip label.
const scale = Array.from({ length: 61 }, (_, i) => ({
  i,
  top: 100 - (i / 60) * 100,
  len: i % 10 === 0 ? 44 : i % 5 === 0 ? 24 : 12,
  major: i % 10 === 0,
  label: i % 10 === 0 && i > 0 && i < 60,
}));
const layers = ["paper", "ink"] as const;

export default function OClock() {
  return (
    <>
      <div
        className="o-clock"
        role="dialog"
        aria-modal="true"
        aria-label="Uhr"
        data-state="closed"
        hidden
      >
        <div className="o-clock__window"></div>
        <span className="o-clock__o" aria-hidden="true">
          O
        </span>

        <div className="o-clock__face" aria-hidden="true" hidden>
          {layers.map((layer) => (
            <div
              key={layer}
              className={`o-clock__layer o-clock__layer--${layer}`}
            >
              <div className="o-clock__time" />
              <div className="o-clock__scale">
                {scale.map((tick) => (
                  <Fragment key={tick.i}>
                    <i
                      className={tick.major ? "major" : undefined}
                      style={{ top: `${tick.top}%`, width: `${tick.len}px` }}
                      data-i={tick.i}
                    />
                    {tick.label && (
                      <b
                        className="chip"
                        style={{ top: `${tick.top}%` }}
                        data-i={tick.i}
                      >
                        {tick.i}
                      </b>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="o-clock__close">
          Schliessen ✕
        </button>
      </div>
      <OClockScript />
    </>
  );
}
