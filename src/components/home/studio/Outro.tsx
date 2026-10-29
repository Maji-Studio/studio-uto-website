import StaticImg from "@/components/site/StaticImg";
import { staticImages, type StaticImage } from "@/lib/static-images";

import OutroScript from "./Outro.client";
import "./Outro.css";

// Studio fact sheet, part 4 of 4: the page-transition reel, used once at the
// end: right after the prices a black panel scrolls in carrying the canvas
// photo reel (12 fps, motion trail, hard cuts) and pins, then a paper "page"
// rises over it revealing a gapless photo grid (/impressionen/ grammar).
// Photos here appear nowhere else on the homepage.

const {
  mk01,
  mk02,
  mk03,
  mk05,
  mk06,
  mk07,
  mk09,
  nb01,
  nb02,
  nb04,
  nb06,
  yvy01,
  yvy03,
  yvy04,
  yvy05,
  yvy07,
  yvy08,
  yvy09,
} = staticImages;

// Reel: six landscape frames by Matthias Kappeler.
const reelPhotos = [mk01, mk02, mk03, mk05, mk06, yvy08];
// Grid: twelve more, none shared with the reel, Body (studio photos) or Tarife
// (nb-03, nb-05, yvy-02, yvy-06).
const gridPhotos: [StaticImage, string][] = [
  [nb01, "Nicolas Burri"],
  [nb02, "Nicolas Burri"],
  [yvy01, "Matthias Kappeler"],
  [mk07, "Matthias Kappeler"],
  [nb04, "Nicolas Burri"],
  [yvy03, "Matthias Kappeler"],
  [yvy04, "Matthias Kappeler"],
  [mk09, "Matthias Kappeler"],
  [nb06, "Nicolas Burri"],
  [yvy05, "Matthias Kappeler"],
  [yvy07, "Matthias Kappeler"],
  [yvy09, "Matthias Kappeler"],
];

export default function Outro() {
  // The reel's frames (960 px wide), for the canvas to draw.
  const reelSrcs = reelPhotos.map((img) => img.src);

  return (
    <div className="outro" data-outro data-reel={JSON.stringify(reelSrcs)}>
      <div className="outro-track" data-outro-track>
        <div className="outro-stage">
          <div className="outro-band" data-outro-band aria-hidden="true">
            <canvas className="outro-canvas"></canvas>
          </div>
          <div className="outro-page" data-outro-page>
            <a
              className="chip outro-link"
              href="/impressionen/"
              data-label="Impressionen"
            >
              Impressionen
            </a>
            <ul className="outro-grid" role="list">
              {gridPhotos.map(([src, who], i) => (
                <li key={i}>
                  <StaticImg
                    image={src}
                    alt={`Arbeit von ${who}.`}
                    sizes="(max-width: 720px) 50vw, 25vw"
                    loading="lazy"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <OutroScript />
    </div>
  );
}
