import { describe, expect, it } from "vitest";
import { assertSeedDatabase } from "./seed-utils";

describe("seed database boundary", () => {
  it.each([
    "mongodb://127.0.0.1:27018/studio-uto",
    "mongodb://localhost/studio-uto",
    "mongodb://user:password@localhost:27018/studio-uto",
    "mongodb://localhost:27018,127.0.0.1:27019/studio-uto?replicaSet=local",
  ])("accepts local MongoDB: %s", (uri) => {
    expect(() => assertSeedDatabase(uri)).not.toThrow();
  });

  it.each([
    undefined,
    "",
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
  });
});
