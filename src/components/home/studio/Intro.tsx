import StaticImg from "@/components/site/StaticImg";
import type { SiteSettings, StudioSection } from "@/lib/content/types";
import { staticImages, type StaticImage } from "@/lib/static-images";

import IntroScript from "./Intro.client";
import "./Intro.css";

// Studio fact sheet, part 1 of 4: the intro. A raymarched liquid-chrome
// object on white paper, lit by a procedural studio, that re-forms into the
// wordmark's letters — U → T → O → U …, one every 10 s. Each letter is a 2D SDF
// in the wordmark's construction (U: slab with a flat-bottomed cup and big round
// outer bottom corners; T: full-width bar, centred stem; O: r6's rounded-rect
// ring), extruded as a fat rounded tube; the morph blends the 2D fields with a
// swell and a ripple so the metal flows rather than crossfades. Black fact
// labels are scattered around and over it; each links to its section on
// /information/ and, on hover, shows a small studio photo. Hovering the metal
// itself hangs a studio photo off the cursor, cutting to the next one as the
// pointer travels.

// The hover peeks and the cursor preview are decorative, so their photos are
// bundled here (optimized once by scripts/optimize-static-images.ts) rather
// than read from the content source.
const {
  boden,
  chromeO: fallback,
  grundriss,
  kaffeemaschine,
  mittagslicht,
  panorama,
  shootingFlaeche,
  sichtVonDerKueche,
} = staticImages;
const cursorPhotos = [
  sichtVonDerKueche,
  shootingFlaeche,
  panorama,
  mittagslicht,
  boden,
  kaffeemaschine,
];

interface Props {
  /** The Information page's sections: the fact labels are read out of them. */
  sections: StudioSection[];
  address: SiteSettings["address"];
}

/** "L 7 m · B 7 m · H 5.7 m" → { L: "7", B: "7", H: "5.7" } */
const dims = (s = "") =>
  Object.fromEntries(
    [...s.matchAll(/([LBH])\s*([\d.,]+)\s*m/g)].map((m) => [m[1], m[2]]),
  ) as Record<string, string | undefined>;

type FactDef = [
  label: string | undefined,
  id: string,
  photo: StaticImage,
  x: number,
  y: number,
  mx: number,
  my: number,
  z: number,
];

export default function Intro({ sections, address }: Props) {
  const byId = (id: string) => sections.find((s) => s?.id === id);
  const allPairs = (id: string) =>
    (byId(id)?.blocks ?? []).flatMap((b) => b?.pairs ?? []);
  const allLines = (id: string) =>
    (byId(id)?.blocks ?? []).flatMap((b) => b?.lines ?? []);

  const shoot = dims(
    allPairs("daten").find((p) => /Shooting/i.test(p.term))?.detail,
  );
  const whole = dims(
    allPairs("daten").find((p) => /Ganzes/i.test(p.term))?.detail,
  );
  const datenLines = allLines("daten");
  const floorWord = datenLines.join(" ").match(/Terrazzo[-\w]*/)?.[0];
  const molton = /Molton/i.test(datenLines.join(" "))
    ? "Molton, lichtdicht"
    : undefined;
  const styros = datenLines.join(" ").match(/(\d+)\s+Styros/)?.[1];
  const wifi = allLines("grundriss")
    .join(" ")
    .match(/\d+\s*Gb\/s/)?.[0];
  const hoursLine = allLines("oeffnungszeiten")[0] ?? "";
  const days = hoursLine.match(/^([A-Za-zÄÖÜäöü]+\s*–\s*[A-Za-zÄÖÜäöü]+)/)?.[1];
  const hours = hoursLine.match(/(\d{1,2}):\d{2}\s*–\s*(\d{1,2}):\d{2}/);
  const lift = allLines("anfahrt").some((l) => /Warenlift/.test(l));
  const prices = allPairs("preise");
  const dayPrice = prices.find((p) => /Ganzer/i.test(p.term))?.detail;
  const halfPrice = prices.find((p) => /Halber/i.test(p.term))?.detail;

  // Deterministic scatter: x/y in % of the stage (desktop), mx/my for phones,
  // z = parallax depth. A few deliberately sit on the object. The id is the
  // /information/ section the label links to; the photo is its hover peek.
  const factDefs: FactDef[] = [
    [
      shoot.L && shoot.B && `${shoot.L} × ${shoot.B} m Shooting-Fläche`,
      "daten",
      shootingFlaeche,
      13,
      18,
      4,
      12,
      0.6,
    ],
    [shoot.H && `H ${shoot.H} m`, "daten", panorama, 71, 13, 70, 9, -0.4],
    [floorWord, "daten", boden, 40, 39, 30, 40, 1],
    [wifi, "grundriss", kaffeemaschine, 79, 52, 72, 30, 0.5],
    [
      days && hours ? `${days} ${hours[1]}–${hours[2]}` : undefined,
      "oeffnungszeiten",
      mittagslicht,
      8,
      58,
      4,
      70,
      -0.7,
    ],
    [
      dayPrice && `${dayPrice} / Tag`,
      "preise",
      shootingFlaeche,
      57,
      71,
      48,
      58,
      1,
    ],
    [
      whole.L && whole.B && `${whole.L} × ${whole.B} m gesamt`,
      "grundriss",
      grundriss,
      23,
      81,
      8,
      86,
      -0.3,
    ],
    [molton, "daten", sichtVonDerKueche, 84, 31, 60, 78, 0.8],
    [styros && `${styros} Styros s/w`, "daten", panorama, 61, 36, 58, 46, -1],
    [
      lift ? "Warenlift, 3. Stock" : undefined,
      "anfahrt",
      grundriss,
      30,
      62,
      12,
      54,
      0.9,
    ],
    [address?.street, "anfahrt", sichtVonDerKueche, 75, 85, 52, 91, -0.6],
    [
      halfPrice && `${halfPrice} / ½ Tag`,
      "preise",
      mittagslicht,
      17,
      40,
      6,
      24,
      0.3,
    ],
  ];
  const facts = factDefs
    .filter((f) => !!f[0])
    .map(([label, id, photo, x, y, mx, my, z], i) => ({
      label: label as string,
      href: `/information/#${id}`,
      photo,
      x,
      y,
      mx,
      my,
      z,
      glitch: i === 2 || i === 8,
      // The peek opens away from the stage edge it would run off.
      flipX: x > 60,
      flipY: y > 65,
    }));

  return (
    <section className="intro" aria-label="Studio Uto in Zahlen">
      <div className="intro__stage" data-intro-stage>
        <div className="intro__object">
          <StaticImg
            className="intro__fallback"
            image={fallback}
            alt=""
            sizes="(max-width: 720px) 80vw, 50vw"
            loading="lazy"
          />
          <canvas
            className="intro__canvas"
            data-intro-canvas
            aria-hidden="true"
          ></canvas>
          <div className="intro__hit" data-intro-hit aria-hidden="true"></div>
        </div>

        {/* Cursor preview over the metal: the tour photos, one shown at a time. */}
        <div className="intro__cursor" data-intro-cursor aria-hidden="true">
          {cursorPhotos.map((photo, i) => (
            <StaticImg
              key={i}
              className={
                i === 0 ? "intro__cursor-img is-on" : "intro__cursor-img"
              }
              image={photo}
              alt=""
              sizes="320px"
              loading="lazy"
            />
          ))}
        </div>

        <ul className="intro__facts" role="list">
          {facts.map((f, i) => (
            <li
              key={i}
              className={[
                "intro__fact",
                f.glitch && "intro__fact--glitch",
                f.flipX && "intro__fact--left",
                f.flipY && "intro__fact--up",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  "--x": `${f.x}%`,
                  "--y": `${f.y}%`,
                  "--mx": `${f.mx}%`,
                  "--my": `${f.my}%`,
                  "--z": f.z,
                } as React.CSSProperties
              }
            >
              <a href={f.href}>
                {f.label}
                <StaticImg
                  className="intro__peek"
                  image={f.photo}
                  alt=""
                  sizes="280px"
                  loading="lazy"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <IntroScript />
    </section>
  );
}
