import { address, contact } from "@/lib/site";
import type { StudioSection } from "@/lib/studio";

const mapsQuery = encodeURIComponent(`${address.street}, ${address.city}`);

/**
 * The Information page ("/information/"): who the studio is, where it sits, how
 * to get there and how to book. Same section/block shapes as the homepage fact
 * sheet (see src/lib/studio.ts), rendered by StudioInfo.
 *
 * Sources: studio-uto.ch (description, Anfahrt), the Atelier Uto listing on
 * raumboerse-zh.ch (cooperative, public transport).
 */
export const informationSections: readonly StudioSection[] = [
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
          { label: "Daten & Ausstattung", detail: "Studio", href: "/#daten" },
          { label: "Preise", detail: "ab CHF 550", href: "/#preise" },
          { label: "Arbeiten", detail: "Impressionen", href: "/impressionen/" },
        ],
      },
    ],
  },
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
        pairs: [
          ["Mo – Fr", "9:00 – 18:00 Uhr"],
          ["Wochenende & Randzeiten", "auf Anfrage"],
        ],
      },
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
