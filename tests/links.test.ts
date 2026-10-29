import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  getInformationSections,
  getSiteSettings,
  getStudioSections,
} from "@/lib/content";

const appDir = fileURLToPath(
  new URL("../src/app/(frontend)/", import.meta.url),
);

const { primaryNav, socials } = await getSiteSettings();
const studioSections = await getStudioSections();
const informationSections = await getInformationSections();

// Anchor ids rendered on each page, by pathname. The full fact sheet lives on
// /information/; the Tarife prices sit on the unlinked /sketch/ page.
const anchors: Record<string, string[]> = {
  "/": [],
  "/information/": informationSections.map((s) => s.id),
  "/sketch/": ["preise"],
};

function pageExists(pathname: string) {
  const slug = pathname.replace(/^\/|\/$/g, "");
  return existsSync(`${appDir}${slug ? `${slug}/` : ""}page.tsx`);
}

const contentLinks = [...studioSections, ...informationSections].flatMap(
  (section) => section.blocks.flatMap((block) => block.links ?? []),
);

const internal = [...primaryNav, ...socials, ...contentLinks]
  .map((link) => link.href)
  .filter((href) => href.startsWith("/"));

describe("site links", () => {
  it.each(internal)("%s points at an existing page and anchor", (href) => {
    const [pathname, hash] = href.split("#");
    expect(pageExists(pathname)).toBe(true);
    if (hash) expect(anchors[pathname]).toContain(hash);
  });

  it("header offers Instagram and the booking request", () => {
    expect(socials.map((s) => s.label)).toEqual([
      "Instagram",
      "Jetzt anfragen",
    ]);
    expect(socials[0].external).toBe(true);
    expect(socials[1].href).toBe("/kontakt/");
  });
});
