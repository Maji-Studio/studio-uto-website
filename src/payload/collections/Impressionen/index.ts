import type { CollectionConfig } from "payload";
import { anyone } from "../../access/anyone";
import { authenticated } from "../../access/authenticated";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../../utilities/revalidate";

export const Impressionen: CollectionConfig = {
  slug: "impressionen",
  labels: { singular: "Impression", plural: "Impressionen" },
  admin: { useAsTitle: "name" },
  orderable: true,
  versions: false,
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "client", type: "text" },
    {
      name: "images",
      type: "array",
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        {
          name: "objectPosition",
          type: "text",
          admin: { description: "CSS object-position, e.g. 50% 15%" },
        },
      ],
    },
  ],
};
