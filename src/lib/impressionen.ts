import type { ImageMetadata } from "astro";

export interface ImpressionImage {
  /** Imported image asset — optimized at build time by astro:assets. */
  src: ImageMetadata;
  /** Alt text. When omitted, EntityRow derives one from the entity name/client. */
  alt?: string;
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
 * The current files are generated mock photography — stand-ins in the spirit of
 * each collaborator's work, used until the real shoot images land (see roadmap
 * Phase 4). Replace them by dropping real files into the same folders.
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
    client: "AKRIS",
    images: imagesFrom("nicolas-burri"),
  },
  {
    name: "Matthias Kappeler",
    client: "THE NORTH FACE",
    images: imagesFrom("matthias-kappeler"),
  },
];
