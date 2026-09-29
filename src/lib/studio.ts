import type { ImageMetadata } from "astro";

import boden from "@/assets/studio/boden.jpg";
import grundriss from "@/assets/studio/grundriss.png";
import kaffeemaschine from "@/assets/studio/kaffeemaschine.jpg";
import mittagslicht from "@/assets/studio/mittagslicht.jpg";
import panorama from "@/assets/studio/panorama.jpg";
import shootingFlaeche from "@/assets/studio/shooting-flaeche.jpg";
import sichtVonDerKueche from "@/assets/studio/sicht-von-der-kueche.jpg";

/**
 * Studio fact-sheet content, sourced from studio-uto.ch. The sections render on
 * the Information page (spliced into `informationSections`); the homepage's
 * chrome intro picks its labels out of them and links to each `id` there.
 *
 * Block shapes (a block may combine several, rendered in this order):
 *  - `text`    — running paragraphs.
 *  - `pairs`   — a term/detail line (dimension → size, service → price), set as a
 *                hairline-ruled list.
 *  - `lines`   — a plain enumerated list (equipment, amenities, opening hours).
 *  - `links`   — like `pairs`, but each row is a link (label → destination).
 *  - `figure`  — a single image at column width (the floor plan).
 *  - `gallery` — a thumbnail grid that opens into the Lightbox.
 * A block may carry a trailing `note` (the muted caveat under a list).
 */
export interface StudioImage {
  src: ImageMetadata;
  alt: string;
}

export interface StudioLink {
  label: string;
  /** Right-hand text — the destination as the visitor will recognise it. */
  detail: string;
  href: string;
  /** Off-site link — opens in a new tab and carries a ↗. */
  external?: boolean;
}

/**
 * Studio photography (studio-uto.ch, 2025 shoot). The first photo is the
 * homepage hero; the whole list is the "Take a tour" sequence and the
 * Grundriss gallery, in this order.
 */
export const studioPhotos: readonly StudioImage[] = [
  {
    src: sichtVonDerKueche,
    alt: "Shooting-Fläche, Sicht von der Küche aus — weisse Wand, raumhohe Fenster und Moltonvorhänge.",
  },
  {
    src: shootingFlaeche,
    alt: "Shooting-Fläche mit Blick Richtung Küche und Besprechungstisch.",
  },
  {
    src: panorama,
    alt: "Panorama des Studios mit Lichttraversen, Fensterfront und Betonboden.",
  },
  {
    src: mittagslicht,
    alt: "Shooting-Fläche mit natürlichem Licht am Mittag.",
  },
  {
    src: boden,
    alt: "Detail des abgeschliffenen Betonbodens in Terrazzo-Optik.",
  },
  {
    src: kaffeemaschine,
    alt: "Kaffeemaschine und Pflanzen am Fenster.",
  },
];

export interface StudioBlock {
  /** Small tracked label above the block (e.g. "Dimensionen"). Optional. */
  label?: string;
  /** Running paragraphs. */
  text?: readonly string[];
  /** Term/detail rows — left term, right detail. */
  pairs?: readonly (readonly [term: string, detail: string])[];
  /** Simple enumerated lines. */
  lines?: readonly string[];
  /** Link rows — label left, destination right. */
  links?: readonly StudioLink[];
  /** One image at column width. */
  figure?: StudioImage;
  /** Thumbnail grid opening into the Lightbox under `name`. */
  gallery?: { name: string; images: readonly StudioImage[] };
  /** Muted caveat shown beneath the block. */
  note?: string;
}

export interface StudioSection {
  /** Anchor id on the page the section renders on. */
  id: string;
  /** Section heading, set large in the left column. */
  title: string;
  /** Short label for the sticky section nav, when it differs from `title`. */
  navLabel?: string;
  blocks: readonly StudioBlock[];
}

export const studioSections: readonly StudioSection[] = [
  {
    id: "daten",
    title: "Daten",
    blocks: [
      {
        label: "Dimensionen",
        pairs: [
          ["Ganzes Studio mit Küche", "L 14 m · B 7 m · H 2.7 m"],
          ["Shooting-Fläche", "L 7 m · B 7 m · H 5.7 m"],
        ],
      },
      {
        label: "Boden",
        lines: ["Betonboden, abgeschliffen, Terrazzo-Optik"],
      },
      {
        label: "Verdunklung",
        lines: [
          "Über Rollladen möglich — zusätzlich lichtdichte, schwarze Moltonvorhänge vorhanden",
        ],
      },
      {
        label: "Equipment inbegriffen",
        lines: [
          "6 Styros mit Ständer (s/w), 2 m × 1 m",
          "Kleingrip-Set",
          "Klammer-Set",
          "4 Verlängerungskabel + 2 Mehrfachstecker",
          "Leiter (raumhoch)",
        ],
        note: "Weiteres Equipment kann dazugemietet werden.",
      },
    ],
  },
  {
    id: "grundriss",
    title: "Grundriss und Ausstattung",
    navLabel: "Ausstattung",
    blocks: [
      {
        label: "Im Studio",
        lines: [
          "W-LAN (1 Gb/s up & down, WiFi 5)",
          "Kaffeemaschine",
          "1 Besprechungstisch mit 4 Stühlen",
          "Arbeitstische, 2 Rollhocker",
        ],
      },
      {
        label: "Auf Anfrage",
        lines: [
          "Spiegel (Make-up)",
          "Kleiderständer mit Kleiderbügeln",
          "Garderobe mit Trennwänden im Raum",
        ],
      },
      {
        label: "Grundriss",
        figure: {
          src: grundriss,
          alt: "Grundriss des 3. Stocks: Studio Uto, WC, Treppenhaus und Warenlift. Der Vorraum gehört nicht zum Studio.",
        },
      },
      {
        label: "Bilder",
        gallery: { name: "Studio Uto", images: studioPhotos },
      },
    ],
  },
  {
    id: "oeffnungszeiten",
    title: "Öffnungszeiten",
    blocks: [
      {
        lines: ["Mo – Fr, jeweils 9:00 – 18:00 Uhr"],
        note: "Wochenende und Randzeiten auf Anfrage.",
      },
    ],
  },
  {
    id: "preise",
    title: "Preise",
    blocks: [
      {
        pairs: [
          ["Ganzer Tag (10 h)", "CHF 850"],
          ["Halber Tag (4 h)", "CHF 550"],
          ["Zusätzliche Stunden", "CHF 150"],
          ["Separater Styling- / H&M-Raum", "CHF 100"],
        ],
        note: "Preise sind exklusive Mehrwertsteuer.",
      },
      {
        links: [
          { label: "Buchung", detail: "Jetzt anfragen", href: "/kontakt/" },
        ],
      },
    ],
  },
] as const;
