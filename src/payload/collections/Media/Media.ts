import type { CollectionConfig, ImageSize } from "payload";
import { fileURLToPath } from "node:url";
import { anyone } from "../../access/anyone";
import { authenticated } from "../../access/authenticated";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../../utilities/revalidate";
import { resizeOversizedOriginal } from "./resizeOversizedOriginal";

// V4 authors image sizes on the transformer and stores them as variants.
export const mediaVariants: ImageSize[] = [
  { name: "thumbnail", width: 400, height: 300, withoutEnlargement: true },
  { name: "sm", width: 480, withoutEnlargement: true },
  { name: "md", width: 768, withoutEnlargement: true },
  { name: "lg", width: 1280, withoutEnlargement: true },
  { name: "xl", width: 1920, withoutEnlargement: true },
  { name: "2xl", width: 2560, withoutEnlargement: true },
];

export const Media: CollectionConfig = {
  slug: "media",
  versions: false,
  admin: { useAsTitle: "filename" },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeOperation: [resizeOversizedOriginal],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: "alt", type: "text", required: true },
    { name: "caption", type: "text" },
  ],
  upload: {
    staticDir: fileURLToPath(new URL("../../../../media", import.meta.url)),
    mimeTypes: ["image/*"],
    adminThumbnail: "thumbnail",
  },
};
