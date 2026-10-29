import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The content a fresh database starts with (pnpm seed). Edits made later in
// the CMS are the editors' to keep linked.
import { sections, siteSettings } from "../scripts/seed-data";

const appDir = fileURLToPath(
  new URL("../src/app/(frontend)/", import.meta.url),
);

const { primaryNav, socials } = siteSettings;

// Anchor ids rendered on each page, by pathname. The full fact sheet lives on
// /information/; the Tarife prices sit on the unlinked /sketch/ page.
const anchors: Record<string, string[]> = {
  "/": [],
  "/information/": sections.map((s) => s.anchor),
  "/sketch/": ["preise"],
};

function pageExists(pathname: string) {
  const slug = pathname.replace(/^\/|\/$/g, "");
  return existsSync(`${appDir}${slug ? `${slug}/` : ""}page.tsx`);
}

const contentLinks = sections.flatMap((section) =>
  section.blocks.flatMap((block) => block.links ?? []),
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
