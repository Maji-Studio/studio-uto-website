import type { StaticImageData } from "next/image";

import boden from "@/assets/studio/boden.jpg";
import grundriss from "@/assets/studio/grundriss.png";
import kaffeemaschine from "@/assets/studio/kaffeemaschine.jpg";
import mittagslicht from "@/assets/studio/mittagslicht.jpg";
import panorama from "@/assets/studio/panorama.jpg";
import shootingFlaeche from "@/assets/studio/shooting-flaeche.jpg";
import sichtVonDerKueche from "@/assets/studio/sicht-von-der-kueche.jpg";
import nb01 from "@/assets/impressionen/nicolas-burri/nb-01.jpg";
import nb02 from "@/assets/impressionen/nicolas-burri/nb-02.jpg";
import nb03 from "@/assets/impressionen/nicolas-burri/nb-03.jpg";
import nb04 from "@/assets/impressionen/nicolas-burri/nb-04.jpg";
import nb05 from "@/assets/impressionen/nicolas-burri/nb-05.jpg";
import nb06 from "@/assets/impressionen/nicolas-burri/nb-06.jpg";
import yvy01 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-01.jpg";
import yvy02 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-02.jpg";
import yvy03 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-03.jpg";
import yvy04 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-04.jpg";
import yvy05 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-05.jpg";
import yvy06 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-06.jpg";
import yvy07 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-07.jpg";
import yvy08 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-08.jpg";
import yvy09 from "@/assets/impressionen/matthias-kappeler-yvy/yvy-09.jpg";

import type {
  ContentImage,
  Impression,
  SiteSettings,
  StudioSection,
} from "./types";

/**
 * Today's site content, built from bundled files into the shapes in
 * `./types.ts`. `./index.ts` is the only module that reads this one; when the
 * content moves into Payload, only `index.ts` changes.
 */

/** A bundled image import as the contract's ContentImage. */
const image = (
  img: StaticImageData,
  alt: string,
  objectPosition?: string,
): ContentImage => ({
  src: img.src,
  width: img.width,
  height: img.height,
  alt,
  ...(objectPosition ? { objectPosition } : {}),
});

const name = "Studio Uto";

const contact = {
  email: "info@atelier-uto.ch",
  instagram: "https://www.instagram.com/studio.uto/",
  instagramHandle: "@studio.uto",
};

/** Studio postal address, used on the Kontakt page and in meta. */
const address = {
  name: "Atelier Uto",
  street: "Flüelastrasse 16",
  city: "8048 Zürich",
};

export const siteSettings: SiteSettings = {
  name,
  description:
    "Studio Uto — Fotostudio zur Miete an der Flüelastrasse 16, 8048 Zürich.",
  contact,
  address,
  // Primary navigation (header centre). Equipment is still a placeholder ("#").
  primaryNav: [
    { label: "Studio", href: "/" },
    { label: "Impressionen", href: "/impressionen/" },
    { label: "Information", href: "/information/" },
    { label: "Equipment", href: "#" },
    { label: "Kontakt", href: "/kontakt/" },
  ],
  // Header right: Instagram, and the booking call to action (→ Kontakt form).
  socials: [
    { label: "Instagram", href: contact.instagram, external: true },
    { label: "Jetzt anfragen", href: "/kontakt/" },
  ],
  // The people behind Studio Uto ("Beteiligte"), shown on the Kontakt page,
  // each linked to their own site. Source: studio-uto.ch/kontakt.
  beteiligte: [
    { name: "Cyrill Matter", url: "https://cyrillmatter.com/" },
    { name: "Lynn Grütter", url: "https://www.lynngruetter.com/" },
    { name: "Oliver Schmocker", url: "https://oliverschmocker.com/" },
    { name: "Matthias Kappeler", url: "https://matthiaskappeler.ch/" },
    { name: "Nadine Kägi", url: "https://nadinekgi.pixieset.com/" },
    { name: "Nicolas Burri", url: "https://www.nicolasburristudio.com/" },
    { name: "Nino Valpiani", url: "https://ninovalpiani.com/" },
    { name: "Sam Heuberger", url: "https://www.samheuberger.com/" },
    { name: "Sven Probst", url: "https://svenprobst.ch/" },
    { name: "Timon Flükiger", url: "https://timonfluekiger.com/" },
    { name: "Tom Gibbons", url: "https://tom-gibbons.com/" },
    { name: "Yonca Ergen", url: "https://yoncaergen.com/" },
  ],
};

/**
 * Studio photography (studio-uto.ch, 2025 shoot). The first photo is the
 * homepage hero; the whole list is the "Take a tour" sequence and the
 * Grundriss gallery, in this order.
 */
export const studioPhotos: ContentImage[] = [
  image(
    sichtVonDerKueche,
    "Shooting-Fläche, Sicht von der Küche aus — weisse Wand, raumhohe Fenster und Moltonvorhänge.",
  ),
  image(
    shootingFlaeche,
    "Shooting-Fläche mit Blick Richtung Küche und Besprechungstisch.",
  ),
  image(
    panorama,
    "Panorama des Studios mit Lichttraversen, Fensterfront und Betonboden.",
  ),
  image(mittagslicht, "Shooting-Fläche mit natürlichem Licht am Mittag."),
  image(boden, "Detail des abgeschliffenen Betonbodens in Terrazzo-Optik."),
  image(kaffeemaschine, "Kaffeemaschine und Pflanzen am Fenster."),
];

export const studioSections: StudioSection[] = [
  {
    id: "daten",
    title: "Daten",
    blocks: [
      {
        label: "Dimensionen",
        pairs: [
          {
            term: "Ganzes Studio mit Küche",
            detail: "L 14 m · B 7 m · H 2.7 m",
          },
          { term: "Shooting-Fläche", detail: "L 7 m · B 7 m · H 5.7 m" },
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
        figure: image(
          grundriss,
          "Grundriss des 3. Stocks: Studio Uto, WC, Treppenhaus und Warenlift. Der Vorraum gehört nicht zum Studio.",
        ),
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
          { term: "Ganzer Tag (10 h)", detail: "CHF 850" },
          { term: "Halber Tag (4 h)", detail: "CHF 550" },
          { term: "Zusätzliche Stunden", detail: "CHF 150" },
          { term: "Separater Styling- / H&M-Raum", detail: "CHF 100" },
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
];

const mapsQuery = encodeURIComponent(`${address.street}, ${address.city}`);

/**
 * The Information page ("/information/"): who the studio is, the studio fact
 * sheet (src/lib/studio.ts, spliced in after the intro), where it sits, how to
 * get there and how to book. Rendered by src/components/home/studio/Facts.tsx.
 *
 * Sources: studio-uto.ch (description, Anfahrt), the Atelier Uto listing on
 * raumboerse-zh.ch (cooperative, public transport).
 */
export const informationSections: StudioSection[] = [
  {
    id: "studio",
    title: "Studio Uto",
    navLabel: "Studio",
    blocks: [
      {
        text: [
          "Studio Uto ist ein Mietstudio für Foto- und Videoproduktionen in Zürich-Altstetten — auch für Workshops, Ausstellungen und andere Veranstaltungen geeignet.",
          "Die Shooting-Fläche misst 7 × 7 m bei 5.7 m Raumhöhe, mit raumhohen Fenstern, Betonboden in Terrazzo-Optik und Verdunklung über Rollladen und Moltonvorhänge.",
        ],
      },
      {
        links: [
          { label: "Arbeiten", detail: "Impressionen", href: "/impressionen/" },
        ],
      },
    ],
  },
  ...studioSections,
  {
    id: "atelier",
    title: "Atelier Uto",
    blocks: [
      {
        text: [
          "Das Studio liegt im 3. Stock des Atelier Uto an der Flüelastrasse 16 — einer lebendigen Genossenschaft aus Designer:innen, Filmemacher:innen, Musiker:innen, Programmierer:innen, Goldschmied:innen, Künstler:innen und vielen mehr. Hier entstehen Ideen, Projekte und Freundschaften.",
        ],
      },
    ],
  },
  {
    id: "anfahrt",
    title: "Anfahrt",
    blocks: [
      {
        label: "Adresse",
        lines: [address.name, address.street, address.city],
      },
      {
        label: "Öffentlicher Verkehr",
        lines: ["Tram, Bus und Bahnhof sind ganz in der Nähe."],
      },
      {
        label: "Auto & Anlieferung",
        lines: [
          "Einfahrt von der Flüelastrasse, 3. Stock «Atelier Uto»",
          "Ein Parkplatz auf der Hinterseite des Gebäudes (ab März), beschildert mit «Atelier Uto»",
          "Weitere Besucherparkplätze auf dem Areal",
          "Warenlift ebenerdig in den 3. Stock",
        ],
      },
      {
        links: [
          {
            label: "Karte",
            detail: "Route planen",
            href: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
            external: true,
          },
        ],
      },
    ],
  },
  {
    id: "buchung",
    title: "Buchung & Kontakt",
    navLabel: "Buchung",
    blocks: [
      {
        links: [
          { label: "Anfrage", detail: "Jetzt anfragen", href: "/kontakt/" },
          {
            label: "Email",
            detail: contact.email,
            href: `mailto:${contact.email}`,
          },
          {
            label: "Instagram",
            detail: contact.instagramHandle,
            href: contact.instagram,
            external: true,
          },
        ],
      },
    ],
  },
];

/*
 * The Impressionen gallery. Each entry is one collaborator/shoot.
 *
 * Nicolas's gallery uses photographs from his published Manor series.
 * Matthias's YVY gallery uses stills from his published film, UNI by YVY.
 * Source, credits and frame selection: docs/content/impressionen-sources.md.
 */
const manor = [nb01, nb02, nb03, nb04, nb05, nb06];
const manorAlt = [
  "Nicolas Burri für Manor — zwei Models in grauem und grünem Anzug mit Smartphone.",
  "Nicolas Burri für Manor — Model mit buntem Streifenschal und weissem Rollkragenpullover.",
  "Nicolas Burri für Manor — springendes Model in pinkem Top und schwarzem Sportoutfit.",
  "Nicolas Burri für Manor — Model in beiger Jacke und blauem Outfit vor hellem Hintergrund.",
  "Nicolas Burri für Manor — Porträt mit grüner Kappe, grünem Pullover und Schal.",
  "Nicolas Burri für Manor — Model in blauer Steppweste und blauem Pullover in Bewegung.",
];
const yvy = [yvy01, yvy02, yvy03, yvy04, yvy05, yvy06, yvy07, yvy08, yvy09];
const yvyAlt = [
  "UNI by YVY — Gruppenaufnahme in Schwarz-Weiss vor hellem Studiohintergrund.",
  "UNI by YVY — Studioporträt im weissen Anzug mit schmalem Lederaccessoire.",
  "UNI by YVY — Porträt mit erhobenem Arm, Netztop und Lederharness.",
  "UNI by YVY — Zweiteilige Studioaufnahme mit Lederharness und schwarzem Outfit.",
  "UNI by YVY — Porträt in schwarzer Kleidung neben einer Detailaufnahme der Lederaccessoires.",
  "UNI by YVY — Ganzkörperaufnahme und Nahaufnahme eines schwarzen Netz- und Lederlooks.",
  "UNI by YVY — Zwei Studioporträts mit schwarzer Kappe und Lederaccessoires.",
  "UNI by YVY — Detailaufnahme eines schwarzen Netztops vor hellem Hintergrund.",
  "UNI by YVY — Nahporträt neben einer Detailaufnahme von Gürtel und Ledertasche.",
];

export const impressionen: Impression[] = [
  {
    name: "Nicolas Burri",
    client: "Manor",
    images: manor.map((img, index) =>
      image(img, manorAlt[index], index === 0 ? "50% 50%" : "50% 15%"),
    ),
  },
  {
    name: "Matthias Kappeler",
    client: "YVY",
    images: yvy.map((img, index) => image(img, yvyAlt[index])),
  },
];
