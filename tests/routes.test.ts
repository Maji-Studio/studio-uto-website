import { describe, expect, it } from "vitest";

import { exampleHref, isRouteActive, normalizeSlug } from "@/lib/routes";

describe("routes", () => {
  it("normalizes slugs for collection URLs", () => {
    expect(normalizeSlug(" /examples/quiet-forms/ ")).toBe(
      "examples/quiet-forms",
    );
    expect(exampleHref("quiet-forms")).toBe("/examples/quiet-forms/");
  });

  it("marks exact and nested routes active", () => {
    expect(isRouteActive("/", "/")).toBe(true);
    expect(isRouteActive("/examples/", "/examples/")).toBe(true);
    expect(isRouteActive("/examples/quiet-forms/", "/examples/")).toBe(true);
    expect(isRouteActive("/contact/", "/examples/")).toBe(false);
  });
});
