import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { lstatSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assertLocalDatabase, resetLocalLogins } from "./db-pull-local-login";

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  update: vi.fn(),
  destroy: vi.fn(),
  getPayload: vi.fn(),
}));
vi.mock("node:fs", () => ({ lstatSync: vi.fn() }));
vi.mock("payload", () => ({ getPayload: mocks.getPayload }));
vi.mock("../src/payload.config", () => ({ default: {} }));
const root = fileURLToPath(new URL("../", import.meta.url));

beforeEach(() => {
  vi.mocked(lstatSync).mockReset();
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.getPayload.mockResolvedValue(mocks);
  mocks.find.mockResolvedValue({
    docs: [
      { id: 1, email: "user-1@example.invalid" },
      { id: 7, email: "user-7@example.invalid" },
    ],
  });
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DATABASE_URI", "file:./data/payload.db");
  vi.stubEnv("DB_PULL_PASSWORD", "");
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("local login database guard", () => {
  it("allows only the default local file, resolved relative to cwd", () => {
    for (const uri of [
      undefined,
      "file:./data/payload.db",
      pathToFileURL(path.join(root, "data/payload.db")).href,
    ]) {
      expect(() => assertLocalDatabase(uri, "test", root)).not.toThrow();
    }
    expect(() =>
      assertLocalDatabase(
        "file:../data/payload.db",
        undefined,
        path.join(root, "scripts"),
      ),
    ).not.toThrow();
  });

  it("rejects production and database aliases before Payload is initialised", async () => {
    for (const uri of [
      "libsql://production.example",
      "https://production.example",
      ":memory:",
      "file:./other.db",
      "file:/srv/studio-uto/shared/data/payload.db",
      "file:./data/payload.db?mode=memory",
      "file:./data/payload.db#other",
      "file://remote-host/data/payload.db",
    ]) {
      expect(() => assertLocalDatabase(uri, "test", root)).toThrow(/refused/);
    }
    expect(() =>
      assertLocalDatabase(undefined, "test", path.join(root, "scripts")),
    ).toThrow(/refused/);
    vi.stubEnv("NODE_ENV", "production");
    await expect(resetLocalLogins()).rejects.toThrow(/refused/);
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("rejects symlinks for the allowed database or its data directory", () => {
    vi.mocked(lstatSync).mockReturnValue({
      isSymbolicLink: () => true,
    } as ReturnType<typeof lstatSync>);
    expect(() => assertLocalDatabase(undefined, "test", root)).toThrow(
      /Symlinks/,
    );
  });

  it.each(["", "custom-local-password"])(
    "resets all users through the trusted Local API (password %j)",
    async (password) => {
      vi.stubEnv("DB_PULL_PASSWORD", password);
      await resetLocalLogins();
      expect(mocks.find).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: "users",
          pagination: false,
          limit: 0,
          overrideAccess: true,
        }),
      );
      expect(mocks.update.mock.calls.map(([args]) => args)).toEqual(
        [1, 7].map((id) => ({
          collection: "users",
          id,
          data: { password: password || "uto-local" },
          overrideAccess: true,
          context: { disableRevalidate: true },
        })),
      );
      expect(console.log).toHaveBeenCalledWith(
        "Local login emails: user-1@example.invalid, user-7@example.invalid",
      );
      expect(mocks.destroy).toHaveBeenCalledOnce();
    },
  );

  it("closes Payload if a password update fails", async () => {
    mocks.update.mockRejectedValue(new Error("update failed"));
    await expect(resetLocalLogins()).rejects.toThrow("update failed");
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
});
