import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";
import { getOriginalFilename } from "payload/internal";
import type { Media } from "../src/payload-types";
import type { SeedImage } from "./seed-types";
import { impressions, sections, siteSettings } from "./seed-data";
import { assertSeedDatabase, matchesSeedOriginal } from "./seed-utils";

assertSeedDatabase(process.env.DATABASE_URI, process.env.SEED_ALLOW_REMOTE);

const { default: config } = await import("../src/payload.config");
const payload = await getPayload({ config });
const root = fileURLToPath(new URL("../", import.meta.url));
const trusted = {
  overrideAccess: true,
  context: { disableRevalidate: true },
} as const;
const uploaded = new Map<string, Promise<Media["id"]>>();

function upload(image: SeedImage): Promise<Media["id"]> {
  const filename = path.basename(image.path);
  const cached = uploaded.get(filename);
  if (cached) return cached;
  const promise = upsertMedia(image, filename);
  uploaded.set(filename, promise);
  return promise;
}

async function upsertMedia(
  image: SeedImage,
  filename: string,
): Promise<Media["id"]> {
  // Existing local files can give the source copy a numeric collision suffix.
  const originalFilename = getOriginalFilename({ filename });
  const filenames = [filename, originalFilename];
  const existing = await payload.find({
    collection: "media",
    where: {
      or: [
        { filename: { in: filenames } },
        {
          "original.filename": {
            contains: path.parse(originalFilename).name,
          },
        },
      ],
    },
    limit: 0,
    pagination: false,
    sort: "id",
    depth: 0,
    ...trusted,
  });
  const match = existing.docs.find(
    (media) =>
      filenames.includes(media.filename ?? "") ||
      matchesSeedOriginal(originalFilename, media.original?.filename),
  );
  let media: Media;
  if (match) {
    media = await payload.update({
      collection: "media",
      id: match.id,
      data: { alt: image.alt },
      ...trusted,
    });
  } else {
    media = await payload.create({
      collection: "media",
      data: { alt: image.alt },
      filePath: path.resolve(root, image.path),
      ...trusted,
    });
  }
  return media.id;
}

try {
  await payload.updateGlobal({
    slug: "site-settings",
    data: siteSettings,
    ...trusted,
  });
  const seededSections = [];
  for (const section of sections) {
    const blocks = [];
    for (const block of section.blocks) {
      const { figure, galleryImages, ...data } = block;
      blocks.push({
        ...data,
        ...(figure ? { figure: await upload(figure) } : {}),
        ...(galleryImages
          ? { galleryImages: await Promise.all(galleryImages.map(upload)) }
          : {}),
      });
    }
    seededSections.push({ ...section, blocks });
  }
  await payload.updateGlobal({
    slug: "information",
    data: { sections: seededSections },
    ...trusted,
  });
  for (const impression of impressions) {
    const images = [];
    for (const image of impression.images) {
      images.push({
        image: await upload(image),
        ...("objectPosition" in image
          ? { objectPosition: image.objectPosition }
          : {}),
      });
    }
    const data = { name: impression.name, client: impression.client, images };
    const existing = await payload.find({
      collection: "impressionen",
      where: { name: { equals: impression.name } },
      limit: 1,
      depth: 0,
      ...trusted,
    });
    if (existing.docs[0]) {
      await payload.update({
        collection: "impressionen",
        id: existing.docs[0].id,
        data,
        ...trusted,
      });
    } else {
      await payload.create({ collection: "impressionen", data, ...trusted });
    }
  }
  const mediaCount = await payload.count({ collection: "media", ...trusted });
  payload.logger.info(
    `Seed complete: ${uploaded.size} media files (${mediaCount.totalDocs} stored), ${impressions.length} impressions.`,
  );
} finally {
  await payload.destroy();
}
