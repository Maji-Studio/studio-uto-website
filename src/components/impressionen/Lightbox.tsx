import LightboxScript from "./Lightbox.client";
import "./Lightbox.css";

/*
 * Full-screen viewer for the Impressionen grids. One instance per page; every
 * EntityRow on the page opens into it (see the `data-lightbox-*` hooks there).
 *
 * Layout mirrors an entity row, blown up to the viewport and inverted to black:
 * name + client on the left, count and close on the right, the image as large
 * as fits below at its own ratio. A full-width band at the image's height is
 * split into prev/next halves; over it the pointer turns into a label that
 * reads "Previous (03/08)" on the left and "Next (05/08)" on the right, and
 * morphs between the two as it crosses the middle (see src/lib/step-label.ts).
 *
 * Opening and closing are same-document View Transitions: the clicked
 * thumbnail morphs into the full image while a black panel and then the viewer's
 * contents rise from the bottom edge (the chip hover, at page scale). Closing keeps the
 * same upward direction. Browsers without View Transitions just open/close
 * instantly. Stepping waits for the next large file, then shows it at once
 * while the frame eases from the old format to the new one: a transition on
 * --ar rather than a View Transition, so the pointer label stays live.
 */
export default function Lightbox() {
  return (
    <>
      <dialog
        className="lightbox"
        data-lightbox
        aria-labelledby="lightbox-name"
      >
        <header className="lightbox__bar">
          <div className="lightbox__meta">
            <p
              className="lightbox__name"
              id="lightbox-name"
              data-lightbox-name
            ></p>
            <p className="lightbox__client" data-lightbox-client></p>
          </div>
          <div className="lightbox__actions">
            <p
              className="lightbox__count"
              data-lightbox-count
              aria-live="polite"
            ></p>
            <button
              className="lightbox__close"
              type="button"
              data-lightbox-close
            >
              Close
            </button>
          </div>
        </header>

        <figure className="lightbox__stage" data-lightbox-stage>
          {/* Filled in by Lightbox.script.ts, which sets srcset/sizes itself. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="lightbox__image"
            data-lightbox-image
            alt=""
            decoding="async"
          />

          <nav className="lightbox__nav" aria-label="Bilder" data-lightbox-nav>
            <button
              className="lightbox__step"
              type="button"
              data-lightbox-step="-1"
              aria-label="Vorheriges Bild"
            ></button>
            <button
              className="lightbox__step"
              type="button"
              data-lightbox-step="1"
              aria-label="Nächstes Bild"
            ></button>
          </nav>
        </figure>

        <div className="step-label" data-lightbox-label aria-hidden="true">
          <span className="step-label__chip" data-step-label-chip>
            <span className="step-label__slot" data-step-label-slot>
              <span></span>
            </span>
            <span className="step-label__text"> (</span>
            <span className="step-label__slot" data-step-label-slot>
              <span></span>
            </span>
            <span className="step-label__text" data-step-label-total></span>
          </span>
        </div>
      </dialog>
      <LightboxScript />
    </>
  );
}
