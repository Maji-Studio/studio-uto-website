import { existsSync } from "node:fs";
import { expect, it } from "vitest";
import { impressions, sections, siteSettings } from "./seed-data";
import type { SeedImage } from "./seed-types";

it("ships the complete content snapshot with existing, uniquely named image files and alts", () => {
  const images: SeedImage[] = impressions.flatMap(
    (impression) => impression.images,
  );
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.figure) images.push(block.figure);
      images.push(...(block.galleryImages ?? []));
    }
  }
  expect(sections.map(({ anchor }) => anchor)).toEqual([
    "studio",
    "daten",
    "grundriss",
    "oeffnungszeiten",
    "preise",
    "atelier",
    "anfahrt",
    "buchung",
  ]);
  expect(impressions.map(({ name }) => name)).toEqual([
    "Nicolas Burri",
    "Matthias Kappeler",
  ]);
  expect(siteSettings.beteiligte).toHaveLength(12);
  expect(images).toHaveLength(22);
  const filenames = images.map(({ path }) => path.split("/").at(-1));
  expect(new Set(filenames).size).toBe(images.length);
  for (const image of images) {
    expect(image.path.startsWith("src/assets/")).toBe(true);
    expect(existsSync(image.path)).toBe(true);
    expect(image.alt.trim().length).toBeGreaterThan(0);
  }
});
