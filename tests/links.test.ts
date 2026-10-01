import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { informationSections } from "@/lib/information";
import { primaryNav, socials } from "@/lib/site";
import { studioSections } from "@/lib/studio";

const pagesDir = fileURLToPath(new URL("../src/pages/", import.meta.url));

// Anchor ids rendered on each page, by pathname. The full fact sheet lives on
// /information/; the Tarife prices sit on the unlinked /sketch/ page.
const anchors: Record<string, string[]> = {
  "/": [],
  "/information/": informationSections.map((s) => s.id),
  "/sketch/": ["preise"],
};

function pageExists(pathname: string) {
  const slug = pathname.replace(/^\/|\/$/g, "") || "index";
  return existsSync(`${pagesDir}${slug}.astro`);
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
