import type { CollectionBeforeOperationHook } from "payload";
import sharp from "sharp";

export const resizeOversizedOriginal: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== "create" && operation !== "update") return args;
  const file = req.file;
  if (!file?.data?.length || !file.mimetype.startsWith("image/")) return args;
  if (file.mimetype === "image/svg+xml") return args;

  try {
    const meta = await sharp(file.data, { failOn: "none" }).metadata();
    const width = meta.autoOrient?.width ?? meta.width;
    if (!width || width <= 2560) return args;

    let pipeline = sharp(file.data, { failOn: "none" })
      .rotate()
      .resize({ width: 2560, withoutEnlargement: true });
    if (file.mimetype === "image/jpeg") {
      pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
    } else if (file.mimetype === "image/png") {
      pipeline = pipeline.png({ compressionLevel: 9 });
    } else if (file.mimetype === "image/webp") {
      pipeline = pipeline.webp({ quality: 80 });
    } else if (file.mimetype === "image/avif") {
      pipeline = pipeline.avif({ quality: 80 });
    }
    const buffer = await pipeline.toBuffer();
    file.data = buffer;
    file.size = buffer.length;
  } catch (err) {
    req.payload.logger.warn(
      { err, filename: file.name },
      "Failed to resize oversized original; uploading as-is",
    );
  }
  return args;
};
