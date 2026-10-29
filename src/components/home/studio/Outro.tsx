import Image, { getImageProps, type StaticImageData } from "next/image";

import mk01 from "@/assets/impressionen/matthias-kappeler/mk-01.jpg";
import mk02 from "@/assets/impressionen/matthias-kappeler/mk-02.jpg";
import mk03 from "@/assets/impressionen/matthias-kappeler/mk-03.jpg";
import mk05 from "@/assets/impressionen/matthias-kappeler/mk-05.jpg";
import mk06 from "@/assets/impressionen/matthias-kappeler/mk-06.jpg";
import mk07 from "@/assets/impressionen/matthias-kappeler/mk-07.jpg";
import mk09 from "@/assets/impressionen/matthias-kappeler/mk-09.jpg";
import nb01 from "@/assets/impressionen/nicolas-burri/nb-01.jpg";
import nb02 from "@/assets/impressionen/nicolas-burri/nb-02.jpg";
import nb04 from "@/assets/impressionen/nicolas-burri/nb-04.jpg";
import nb06 from "@/assets/impressionen/nicolas-burri/nb-06.jpg";
import yvy01 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-01.jpg";
import yvy03 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-03.jpg";
import yvy04 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-04.jpg";
import yvy05 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-05.jpg";
import yvy07 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-07.jpg";
import yvy08 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-08.jpg";
import yvy09 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-09.jpg";

import OutroScript from "./Outro.client";
import "./Outro.css";

// Studio fact sheet, part 4 of 4: the page-transition reel, used once at the
// end: right after the prices a black panel scrolls in carrying the canvas
// photo reel (12 fps, motion trail, hard cuts) and pins, then a paper "page"
// rises over it revealing a gapless photo grid (/impressionen/ grammar).
// Photos here appear nowhere else on the homepage.

// Reel: six landscape frames by Matthias Kappeler.
const reelPhotos = [mk01, mk02, mk03, mk05, mk06, yvy08];
// Grid: twelve more, none shared with the reel, Body (studio photos) or Tarife
// (nb-03, nb-05, yvy-02, yvy-06).
const gridPhotos: [StaticImageData, string][] = [
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
  // The reel's frames at 960 px wide, for the canvas to draw.
  const reelSrcs = reelPhotos.map((img) => {
    const { props } = getImageProps({ src: img, alt: "", width: 960 });
    return (props.srcSet ?? "").split(", ")[0].replace(/ 1x$/, "") || props.src;
  });

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
                  <Image
                    src={src}
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
