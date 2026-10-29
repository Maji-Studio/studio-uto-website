import { expect, it, vi } from "vitest";
import type { PayloadRequest } from "payload";
import sharp from "sharp";
import { resizeOversizedOriginal } from "./resizeOversizedOriginal";

async function resize(data: Buffer, mimetype = "image/jpeg") {
  const file = { data, mimetype, name: "photo.jpg", size: data.length };
  const warn = vi.fn();
  await resizeOversizedOriginal({
    args: {},
    operation: "create",
    req: { file, payload: { logger: { warn } } } as unknown as PayloadRequest,
  } as Parameters<typeof resizeOversizedOriginal>[0]);
  return { file, warn };
}

it("caps oversized raster originals at 2560px with the same aspect ratio", async () => {
  const input = await sharp({
    create: { width: 3000, height: 1500, channels: 3, background: "white" },
  })
    .jpeg()
    .toBuffer();
  const { file, warn } = await resize(input);
  const result = await sharp(file.data).metadata();
  expect(result.width).toBe(2560);
  expect(result.height).toBe(1280);
  expect(file.size).toBe(file.data.length);
  expect(warn).not.toHaveBeenCalled();
});

it("preserves small originals and SVG files without enlargement or rasterization", async () => {
  const input = await sharp({
    create: { width: 320, height: 200, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  expect((await resize(input, "image/png")).file.data).toBe(input);
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="1000"/>',
  );
  expect((await resize(svg, "image/svg+xml")).file.data).toBe(svg);
});

it("keeps the original and logs a warning if image decoding fails", async () => {
  const input = Buffer.from("invalid JPEG");
  const { file, warn } = await resize(input);
  expect(file.data).toBe(input);
  expect(warn).toHaveBeenCalledOnce();
});
