import type { ImageMetadata } from "astro";

export interface ImpressionImage {
  /** Imported image asset — optimized at build time by astro:assets. */
  src: ImageMetadata;
  /** Alt text. When omitted, EntityRow derives one from the entity name/client. */
  alt?: string;
  /** Focal point when the gallery crops the image into a landscape thumbnail. */
  objectPosition?: string;
}

export interface Impression {
  /** Person / artist shown on the left of the row. */
  name: string;
  /** Optional "for <client>" line — the brand, production, or collaborator. */
  client?: string;
  /** Images shown as a grid on the right. Any count; they flow into 3 columns. */
  images: ImpressionImage[];
}

/*
 * Each collaborator's images live in their own folder under
 * src/assets/impressionen/, shown in filename order.
 *
 * Nicolas's gallery uses photographs from his published Manor series.
 * Matthias's YVY gallery uses stills from his published film, UNI by YVY.
 * Source, credits and frame selection: docs/content/impressionen-sources.md.
 */
const folders = import.meta.glob<ImageMetadata>(
  "/src/assets/impressionen/*/*.{jpg,jpeg,png,webp}",
  { eager: true, import: "default" },
);

/** All images in src/assets/impressionen/<slug>/, sorted by filename. */
function imagesFrom(slug: string): ImpressionImage[] {
  return Object.keys(folders)
    .filter((path) => path.split("/").at(-2) === slug)
    .sort()
    .map((path) => ({ src: folders[path] }));
}

/*
 * The Impressionen gallery. Each entry is one collaborator/shoot.
 *
 * To add a person: create src/assets/impressionen/<slug>/ with their images,
 * then append an entry below with `name`, an optional `client`, and
 * `imagesFrom("<slug>")`. Filenames set the order (01-, 02-, …).
 */
export const impressionen: Impression[] = [
  {
    name: "Nicolas Burri",
    client: "Manor",
    images: imagesFrom("nicolas-burri").map((image, index) => ({
      ...image,
      objectPosition: index === 0 ? "50% 50%" : "50% 15%",
      alt: [
        "Nicolas Burri für Manor — zwei Models in grauem und grünem Anzug mit Smartphone.",
        "Nicolas Burri für Manor — Model mit buntem Streifenschal und weissem Rollkragenpullover.",
        "Nicolas Burri für Manor — springendes Model in pinkem Top und schwarzem Sportoutfit.",
        "Nicolas Burri für Manor — Model in beiger Jacke und blauem Outfit vor hellem Hintergrund.",
        "Nicolas Burri für Manor — Porträt mit grüner Kappe, grünem Pullover und Schal.",
        "Nicolas Burri für Manor — Model in blauer Steppweste und blauem Pullover in Bewegung.",
      ][index],
    })),
  },
  {
    name: "Matthias Kappeler",
    client: "YVY",
    images: imagesFrom("matthias-kappeler-yvy").map((image, index) => ({
      ...image,
      alt: [
        "UNI by YVY — Gruppenaufnahme in Schwarz-Weiss vor hellem Studiohintergrund.",
        "UNI by YVY — Studioporträt im weissen Anzug mit schmalem Lederaccessoire.",
        "UNI by YVY — Porträt mit erhobenem Arm, Netztop und Lederharness.",
        "UNI by YVY — Zweiteilige Studioaufnahme mit Lederharness und schwarzem Outfit.",
        "UNI by YVY — Porträt in schwarzer Kleidung neben einer Detailaufnahme der Lederaccessoires.",
        "UNI by YVY — Ganzkörperaufnahme und Nahaufnahme eines schwarzen Netz- und Lederlooks.",
        "UNI by YVY — Zwei Studioporträts mit schwarzer Kappe und Lederaccessoires.",
        "UNI by YVY — Detailaufnahme eines schwarzen Netztops vor hellem Hintergrund.",
        "UNI by YVY — Nahporträt neben einer Detailaufnahme von Gürtel und Ledertasche.",
      ][index],
    })),
  },
];
