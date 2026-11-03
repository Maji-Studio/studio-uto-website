import type { SeedSection } from "./seed-types";

export const sections: SeedSection[] = [
  {
    anchor: "studio",
    title: "Studio Uto",
    navLabel: "Studio",
    blocks: [
      {
        text: "Studio Uto ist ein Mietstudio für Foto- und Videoproduktionen in Zürich-Altstetten — auch für Workshops, Ausstellungen und andere Veranstaltungen geeignet.\n\nDie Shooting-Fläche misst 7 × 7 m bei 5.7 m Raumhöhe, mit raumhohen Fenstern, Betonboden in Terrazzo-Optik und Verdunklung über Rollladen und Moltonvorhänge.",
      },
      {
        links: [
          {
            label: "Arbeiten",
            detail: "Impressionen",
            href: "/impressionen/",
          },
        ],
      },
    ],
  },
  {
    anchor: "daten",
    title: "Daten",
    blocks: [
      {
        label: "Dimensionen",
        pairs: [
          {
            term: "Ganzes Studio mit Küche",
            detail: "L 14 m · B 7 m · H 2.7 m",
          },
          {
            term: "Shooting-Fläche",
            detail: "L 7 m · B 7 m · H 5.7 m",
          },
        ],
      },
      {
        label: "Boden",
        lines: "Betonboden, abgeschliffen, Terrazzo-Optik",
      },
      {
        label: "Verdunklung",
        lines:
          "Über Rollladen möglich — zusätzlich lichtdichte, schwarze Moltonvorhänge vorhanden",
      },
      {
        label: "Equipment inbegriffen",
        note: "Weiteres Equipment kann dazugemietet werden.",
        lines:
          "6 Styros mit Ständer (s/w), 2 m × 1 m\nKleingrip-Set\nKlammer-Set\n4 Verlängerungskabel + 2 Mehrfachstecker\nLeiter (raumhoch)",
      },
    ],
  },
  {
    anchor: "grundriss",
    title: "Grundriss und Ausstattung",
    navLabel: "Ausstattung",
    blocks: [
      {
        label: "Im Studio",
        lines:
          "W-LAN (1 Gb/s up & down, WiFi 5)\nKaffeemaschine\n1 Besprechungstisch mit 4 Stühlen\nArbeitstische, 2 Rollhocker",
      },
      {
        label: "Auf Anfrage",
        lines:
          "Spiegel (Make-up)\nKleiderständer mit Kleiderbügeln\nGarderobe mit Trennwänden im Raum",
      },
      {
        label: "Grundriss",
        figure: {
          path: "src/assets/studio/grundriss.png",
          alt: "Grundriss des 3. Stocks: Studio Uto, WC, Treppenhaus und Warenlift. Der Vorraum gehört nicht zum Studio.",
        },
      },
      {
        label: "Bilder",
        galleryName: "Studio Uto",
        galleryImages: [
          {
            path: "src/assets/studio/sicht-von-der-kueche.jpg",
            alt: "Shooting-Fläche, Sicht von der Küche aus — weisse Wand, raumhohe Fenster und Moltonvorhänge.",
          },
          {
            path: "src/assets/studio/shooting-flaeche.jpg",
            alt: "Shooting-Fläche mit Blick Richtung Küche und Besprechungstisch.",
          },
          {
            path: "src/assets/studio/panorama.jpg",
            alt: "Panorama des Studios mit Lichttraversen, Fensterfront und Betonboden.",
          },
          {
            path: "src/assets/studio/mittagslicht.jpg",
            alt: "Shooting-Fläche mit natürlichem Licht am Mittag.",
          },
          {
            path: "src/assets/studio/boden.jpg",
            alt: "Detail des abgeschliffenen Betonbodens in Terrazzo-Optik.",
          },
          {
            path: "src/assets/studio/kaffeemaschine.jpg",
            alt: "Kaffeemaschine und Pflanzen am Fenster.",
          },
        ],
      },
    ],
  },
  {
    anchor: "oeffnungszeiten",
    title: "Öffnungszeiten",
    blocks: [
      {
        note: "Wochenende und Randzeiten auf Anfrage.",
        lines: "Mo – Fr, jeweils 9:00 – 18:00 Uhr",
      },
    ],
  },
  {
    anchor: "preise",
    title: "Preise",
    blocks: [
      {
        note: "Preise sind exklusive Mehrwertsteuer.",
        pairs: [
          {
            term: "Ganzer Tag (10 h)",
            detail: "CHF 850",
          },
          {
            term: "Halber Tag (4 h)",
            detail: "CHF 550",
          },
          {
            term: "Zusätzliche Stunden",
            detail: "CHF 150",
          },
          {
            term: "Separater Styling- / H&M-Raum",
            detail: "CHF 100",
          },
        ],
      },
      {
        links: [
          {
            label: "Buchung",
            detail: "Jetzt anfragen",
            href: "/kontakt/",
          },
        ],
      },
    ],
  },
  {
    anchor: "atelier",
    title: "Atelier Uto",
    blocks: [
      {
        text: "Das Studio liegt im 3. Stock des Atelier Uto an der Flüelastrasse 16 — einer lebendigen Genossenschaft aus Designer:innen, Filmemacher:innen, Musiker:innen, Programmierer:innen, Goldschmied:innen, Künstler:innen und vielen mehr. Hier entstehen Ideen, Projekte und Freundschaften.",
      },
    ],
  },
  {
    anchor: "anfahrt",
    title: "Anfahrt",
    blocks: [
      {
        label: "Adresse",
        lines: "Atelier Uto\nFlüelastrasse 16\n8048 Zürich",
      },
      {
        label: "Öffentlicher Verkehr",
        lines: "Tram, Bus und Bahnhof sind ganz in der Nähe.",
      },
      {
        label: "Auto & Anlieferung",
        lines:
          "Einfahrt von der Flüelastrasse, 3. Stock «Atelier Uto»\nEin Parkplatz auf der Hinterseite des Gebäudes (ab März), beschildert mit «Atelier Uto»\nWeitere Besucherparkplätze auf dem Areal\nWarenlift ebenerdig in den 3. Stock",
      },
      {
        links: [
          {
            label: "Karte",
            detail: "Route planen",
            href: "https://www.google.com/maps/search/?api=1&query=Fl%C3%BCelastrasse%2016%2C%208048%20Z%C3%BCrich",
            external: true,
          },
        ],
      },
    ],
  },
  {
    anchor: "buchung",
    title: "Buchung & Kontakt",
    navLabel: "Buchung",
    blocks: [
      {
        links: [
          {
            label: "Anfrage",
            detail: "Jetzt anfragen",
            href: "/kontakt/",
          },
          {
            label: "Email",
            detail: "info@atelier-uto.ch",
            href: "mailto:info@atelier-uto.ch",
          },
          {
            label: "Instagram",
            detail: "@studio.uto",
            href: "https://www.instagram.com/studio.uto/",
            external: true,
          },
        ],
      },
    ],
  },
];
