// Snapshot of the current German site content; no Astro runtime imports.
export const siteSettings = {
  name: "Studio Uto",
  description:
    "Studio Uto — Fotostudio zur Miete an der Flüelastrasse 16, 8048 Zürich.",
  contact: {
    email: "info@atelier-uto.ch",
    instagram: "https://www.instagram.com/studio.uto/",
    instagramHandle: "@studio.uto",
  },
  address: {
    name: "Atelier Uto",
    street: "Flüelastrasse 16",
    city: "8048 Zürich",
  },
  primaryNav: [
    {
      label: "Studio",
      href: "/",
    },
    {
      label: "Impressionen",
      href: "/impressionen/",
    },
    {
      label: "Information",
      href: "/information/",
    },
    {
      label: "Equipment",
      href: "#",
    },
    {
      label: "Kontakt",
      href: "/kontakt/",
    },
  ],
  socials: [
    {
      label: "Instagram",
      href: "https://www.instagram.com/studio.uto/",
      external: true,
    },
    {
      label: "Jetzt anfragen",
      href: "/kontakt/",
    },
  ],
  beteiligte: [
    {
      name: "Cyrill Matter",
      url: "https://cyrillmatter.com/",
    },
    {
      name: "Lynn Grütter",
      url: "https://www.lynngruetter.com/",
    },
    {
      name: "Oliver Schmocker",
      url: "https://oliverschmocker.com/",
    },
    {
      name: "Matthias Kappeler",
      url: "https://matthiaskappeler.ch/",
    },
    {
      name: "Nadine Kägi",
      url: "https://nadinekgi.pixieset.com/",
    },
    {
      name: "Nicolas Burri",
      url: "https://www.nicolasburristudio.com/",
    },
    {
      name: "Nino Valpiani",
      url: "https://ninovalpiani.com/",
    },
    {
      name: "Sam Heuberger",
      url: "https://www.samheuberger.com/",
    },
    {
      name: "Sven Probst",
      url: "https://svenprobst.ch/",
    },
    {
      name: "Timon Flükiger",
      url: "https://timonfluekiger.com/",
    },
    {
      name: "Tom Gibbons",
      url: "https://tom-gibbons.com/",
    },
    {
      name: "Yonca Ergen",
      url: "https://yoncaergen.com/",
    },
  ],
};
export { sections } from "./seed-information-data";
export const impressions = [
  {
    name: "Nicolas Burri",
    client: "Manor",
    images: [
      {
        path: "src/assets/impressionen/nicolas-burri/nb-01.jpg",
        alt: "Nicolas Burri für Manor — zwei Models in grauem und grünem Anzug mit Smartphone.",
        objectPosition: "50% 50%",
      },
      {
        path: "src/assets/impressionen/nicolas-burri/nb-02.jpg",
        alt: "Nicolas Burri für Manor — Model mit buntem Streifenschal und weissem Rollkragenpullover.",
        objectPosition: "50% 15%",
      },
      {
        path: "src/assets/impressionen/nicolas-burri/nb-03.jpg",
        alt: "Nicolas Burri für Manor — springendes Model in pinkem Top und schwarzem Sportoutfit.",
        objectPosition: "50% 15%",
      },
      {
        path: "src/assets/impressionen/nicolas-burri/nb-04.jpg",
        alt: "Nicolas Burri für Manor — Model in beiger Jacke und blauem Outfit vor hellem Hintergrund.",
        objectPosition: "50% 15%",
      },
      {
        path: "src/assets/impressionen/nicolas-burri/nb-05.jpg",
        alt: "Nicolas Burri für Manor — Porträt mit grüner Kappe, grünem Pullover und Schal.",
        objectPosition: "50% 15%",
      },
      {
        path: "src/assets/impressionen/nicolas-burri/nb-06.jpg",
        alt: "Nicolas Burri für Manor — Model in blauer Steppweste und blauem Pullover in Bewegung.",
        objectPosition: "50% 15%",
      },
    ],
  },
  {
    name: "Matthias Kappeler",
    client: "YVY",
    images: [
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-01.jpg",
        alt: "UNI by YVY — Gruppenaufnahme in Schwarz-Weiss vor hellem Studiohintergrund.",
      },
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-02.jpg",
        alt: "UNI by YVY — Studioporträt im weissen Anzug mit schmalem Lederaccessoire.",
      },
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-03.jpg",
        alt: "UNI by YVY — Porträt mit erhobenem Arm, Netztop und Lederharness.",
      },
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-04.jpg",
        alt: "UNI by YVY — Zweiteilige Studioaufnahme mit Lederharness und schwarzem Outfit.",
      },
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-05.jpg",
        alt: "UNI by YVY — Porträt in schwarzer Kleidung neben einer Detailaufnahme der Lederaccessoires.",
      },
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-06.jpg",
        alt: "UNI by YVY — Ganzkörperaufnahme und Nahaufnahme eines schwarzen Netz- und Lederlooks.",
      },
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-07.jpg",
        alt: "UNI by YVY — Zwei Studioporträts mit schwarzer Kappe und Lederaccessoires.",
      },
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-08.jpg",
        alt: "UNI by YVY — Detailaufnahme eines schwarzen Netztops vor hellem Hintergrund.",
      },
      {
        path: "src/assets/impressionen/matthias-kappeler-yvy/yvy-09.jpg",
        alt: "UNI by YVY — Nahporträt neben einer Detailaufnahme von Gürtel und Ledertasche.",
      },
    ],
  },
];
