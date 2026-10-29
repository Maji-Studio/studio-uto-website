import { describe, expect, it } from "vitest";
import { assertSeedDatabase, matchesSeedOriginal } from "./seed-utils";

describe("seed database boundary", () => {
  it.each([
    "file:./data/payload.db",
    "file:data/payload.db",
    "file:/srv/studio-uto/shared/payload.db",
    "file:///srv/studio-uto/shared/payload.db",
  ])("accepts local SQLite files: %s", (uri) => {
    expect(() => assertSeedDatabase(uri)).not.toThrow();
  });

  it.each([
    undefined,
    "",
    "file:",
    "file:   ",
    "libsql://remote.test/studio-uto",
    "http://localhost/studio-uto",
    "mongodb://127.0.0.1:27018/studio-uto",
    "mongodb://localhost/studio-uto",
    "mongodb://user:password@localhost:27018/studio-uto",
    "mongodb://localhost:27018,127.0.0.1:27019/studio-uto?replicaSet=local",
    "mongodb://remote.test/studio-uto",
    "mongodb+srv://cluster.test/studio-uto",
    "mongodb://localhost.evil.test/studio-uto",
    "mongodb://localhost,remote.test/studio-uto",
    "mongodb://localhost@remote.test/studio-uto",
    "https://localhost/studio-uto",
  ])("rejects missing, remote and misleading URIs: %s", (uri) => {
    expect(() => assertSeedDatabase(uri)).toThrow();
  });

  it("requires an explicit remote override and still requires a URI", () => {
    expect(() =>
      assertSeedDatabase("mongodb+srv://remote.test/studio-uto", "true"),
    ).not.toThrow();
    expect(() =>
      assertSeedDatabase("mongodb://remote.test/studio-uto", "1"),
    ).toThrow();
    expect(() => assertSeedDatabase(undefined, "true")).toThrow();
    expect(() => assertSeedDatabase("", "true")).toThrow();
    expect(() =>
      assertSeedDatabase("libsql://remote.test/studio-uto", "true"),
    ).not.toThrow();
  });
});

describe("seed original filename matching", () => {
  it.each([
    "nb-01-original.jpg",
    "nb-01-original-1.jpg",
    "nb-01-original-12.jpg",
  ])("recognises a source copy despite local file collisions: %s", (stored) => {
    expect(matchesSeedOriginal("nb-01-original.jpg", stored)).toBe(true);
  });

  it.each([
    undefined,
    null,
    "nb-02-original.jpg",
    "nb-01-original-other.jpg",
    "nb-01-original-1.webp",
    "prefix-nb-01-original.jpg",
    "nb-01-original-1.jpg.bak",
  ])("does not reuse a different source: %s", (stored) => {
    expect(matchesSeedOriginal("nb-01-original.jpg", stored)).toBe(false);
  });
});
