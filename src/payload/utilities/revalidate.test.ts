import { beforeEach, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import {
  revalidate,
  revalidateAfterChange,
  revalidateAfterDelete,
  revalidateGlobal,
} from "./revalidate";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
beforeEach(() => {
  vi.mocked(revalidatePath).mockReset();
});

it("invalidates the root layout and skips explicitly disabled revalidation", () => {
  revalidate({ disableRevalidate: true });
  expect(revalidatePath).not.toHaveBeenCalled();
  revalidate({});
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
});

it("allows Local API work outside a Next cache context", () => {
  vi.mocked(revalidatePath).mockImplementation(() => {
    throw new Error("No Next request");
  });
  expect(() => revalidate({})).not.toThrow();
});

it("preserves documents returned by collection and global hooks", async () => {
  const doc = { id: "doc" };
  const args = { doc, context: {} };
  expect(
    await revalidateAfterChange(
      args as Parameters<typeof revalidateAfterChange>[0],
    ),
  ).toBe(doc);
  expect(
    await revalidateAfterDelete(
      args as Parameters<typeof revalidateAfterDelete>[0],
    ),
  ).toBe(doc);
  expect(
    await revalidateGlobal(args as Parameters<typeof revalidateGlobal>[0]),
  ).toBe(doc);
  expect(revalidatePath).toHaveBeenCalledTimes(3);
});
