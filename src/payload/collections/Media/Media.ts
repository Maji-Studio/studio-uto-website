import type { CollectionConfig, ImageSize } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { anyone } from "../../access/anyone";
import { authenticated } from "../../access/authenticated";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../../utilities/revalidate";
import { resizeOversizedOriginal } from "./resizeOversizedOriginal";

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
    {
      name: "alt",
      label: "Alternativtext",
      type: "text",
      required: true,
      admin: {
        description: "Beschreibt das Bild für Screenreader und Suchmaschinen.",
      },
    },
    { name: "caption", label: "Bildlegende", type: "text" },
  ],
  upload: {
    staticDir: path.resolve(dirname, "../../../../media"),
    mimeTypes: ["image/*"],
    adminThumbnail: "thumbnail",
  },
};
