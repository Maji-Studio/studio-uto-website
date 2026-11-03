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
    { name: "name", label: "Name", type: "text", required: true },
    { name: "client", label: "Für (Kunde)", type: "text" },
    {
      name: "images",
      label: "Bilder",
      type: "array",
      fields: [
        {
          name: "image",
          label: "Bild",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "objectPosition",
          label: "Bildausschnitt",
          type: "text",
          admin: {
            description:
              "Fokuspunkt beim Zuschneiden als CSS object-position, z. B. 50% 15%.",
          },
        },
      ],
    },
  ],
};
