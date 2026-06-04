/**
 * Studio fact-sheet content shown on the homepage ("/"), sourced from
 * studio-uto.ch. The four sections line up 1:1 with `sectionNav` in site.ts —
 * each `id` is the in-page anchor the sticky section nav scrolls to.
 *
 * Two block shapes cover every row on the page:
 *  - `pairs`  — a term/detail line (dimension → size, service → price), set as a
 *               hairline-ruled list.
 *  - `lines`  — a plain enumerated list (equipment, amenities, opening hours).
 * A block may carry a trailing `note` (the muted caveat under a list).
 */
export interface StudioBlock {
  /** Small tracked label above the block (e.g. "Dimensionen"). Optional. */
  label?: string;
  /** Term/detail rows — left term, right detail. */
  pairs?: readonly (readonly [term: string, detail: string])[];
  /** Simple enumerated lines. */
  lines?: readonly string[];
  /** Muted caveat shown beneath the block. */
  note?: string;
}

export interface StudioSection {
  /** In-page anchor id — must match the matching `sectionNav` href. */
  id: string;
  /** Section heading, set large in the left column. */
  title: string;
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
      {
        label: "Anfahrt, Parking & Anlieferung",
        lines: [
          "Einfahrt von Flüelastrasse, 3. Stock «Atelier Uto»",
          "Ein Parkplatz auf der Hinterseite des Gebäudes (ab März)",
          "Warenlift ebenerdig in den 3. Stock",
        ],
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
    ],
  },
] as const;
