import type { ImageMetadata } from "astro";

import studio1 from "@/assets/studio/image-1.jpg";
import studio2 from "@/assets/studio/image-2.jpg";

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
 * The Impressionen gallery. Each entry is one collaborator/shoot.
 *
 * To add a person: import their images at the top, then append an entry below
 * with `name`, an optional `client`, and an `images` array. Drop alt text on an
 * image when it deserves a specific description; otherwise a name/client-derived
 * fallback is used.
 *
 * The two `studio*` images below are placeholders reused across the grids until
 * real shoot photography lands (see roadmap Phase 4).
 */
const placeholders = [studio1, studio2];

/** Build a placeholder grid of `count` images, cycling the studio photos. */
function placeholderGrid(count: number): ImpressionImage[] {
  return Array.from({ length: count }, (_, i) => ({
    src: placeholders[i % placeholders.length],
  }));
}

export const impressionen: Impression[] = [
  { name: "Nicolas Burri", client: "AKRIS", images: placeholderGrid(6) },
  {
    name: "Matthias Kappeler",
    client: "THE NORTH FACE",
    images: placeholderGrid(9),
  },
];
