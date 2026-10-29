import { describe, expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import type { User } from "../../../payload-types";
import { admins, adminFieldAccess } from "../../access/admins";
import { authenticated } from "../../access/authenticated";
import { adminsAndUser } from "./access/adminsAndUser";
import { ensureFirstUserIsAdmin } from "./hooks/ensureFirstUserIsAdmin";

const user = (role: "admin" | "editor"): User => ({
  id: role,
  email: `${role}@example.test`,
  roles: [role],
  collection: "users",
  createdAt: "",
  updatedAt: "",
});
const req = (current: User | null) => ({ user: current }) as PayloadRequest;
const roleArgs = (current: User | null) =>
  ({
    req: req(current),
    collection: { slug: "users" },
    data: {},
    siblingData: {},
  }) as Parameters<typeof adminFieldAccess>[0];

describe("user access", () => {
  it("reserves user administration and role edits for admins", () => {
    for (const access of [
      (current: User | null) => admins({ req: req(current), slug: "users" }),
      (current: User | null) => adminFieldAccess(roleArgs(current)),
    ]) {
      expect(access(user("admin"))).toBe(true);
      expect(access(user("editor"))).toBe(false);
      expect(access(null)).toBe(false);
    }
  });

  it("limits editor account reads and updates to their own ID", () => {
    expect(adminsAndUser({ req: req(user("admin")), slug: "users" })).toBe(
      true,
    );
    expect(adminsAndUser({ req: req(user("editor")), slug: "users" })).toEqual({
      id: { equals: "editor" },
    });
    expect(adminsAndUser({ req: req(null), slug: "users" })).toBe(false);
    expect(authenticated({ req: req(user("editor")), slug: "media" })).toBe(
      true,
    );
    expect(authenticated({ req: req(null), slug: "media" })).toBe(false);
  });

  it("grants the first account admin using a trusted count, without promoting later editors", async () => {
    const count = vi
      .fn()
      .mockResolvedValueOnce({ totalDocs: 0 })
      .mockResolvedValueOnce({ totalDocs: 1 });
    const request = { payload: { count } } as unknown as PayloadRequest;
    const args = {
      operation: "create",
      req: request,
      value: ["editor"],
    } as Parameters<typeof ensureFirstUserIsAdmin>[0];
    expect(await ensureFirstUserIsAdmin(args)).toEqual(["admin"]);
    expect(count).toHaveBeenCalledWith({
      collection: "users",
      overrideAccess: true,
      req: request,
    });
    expect(await ensureFirstUserIsAdmin(args)).toEqual(["editor"]);
  });
});
