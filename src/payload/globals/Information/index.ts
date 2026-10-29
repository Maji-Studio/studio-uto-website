import type { GlobalConfig } from "payload";
import { anyone } from "../../access/anyone";
import { authenticated } from "../../access/authenticated";
import { navFields } from "../../fields/links";
import { revalidateGlobal } from "../../utilities/revalidate";

export const Information: GlobalConfig = {
  slug: "information",
  label: "Information",
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: "sections",
      type: "array",
      fields: [
        {
          name: "anchor",
          type: "text",
          required: true,
          validate: (value: string | null | undefined) =>
            /^[a-z0-9-]+$/.test(value ?? "") ||
            "Nur a–z, 0–9 und Bindestriche verwenden.",
        },
        { name: "title", type: "text", required: true },
        { name: "navLabel", type: "text" },
        {
          name: "blocks",
          type: "array",
          fields: [
            { name: "label", type: "text" },
            {
              name: "text",
              type: "textarea",
              admin: { description: "Absätze durch eine Leerzeile trennen." },
            },
            {
              name: "pairs",
              type: "array",
              fields: [
                { name: "term", type: "text", required: true },
                { name: "detail", type: "text", required: true },
              ],
            },
            {
              name: "lines",
              type: "textarea",
              admin: { description: "Ein Eintrag pro Zeile." },
            },
            {
              name: "links",
              type: "array",
              fields: [
                ...navFields,
                { name: "detail", type: "text", required: true },
              ],
            },
            { name: "figure", type: "upload", relationTo: "media" },
            { name: "galleryName", type: "text" },
            {
              name: "galleryImages",
              type: "upload",
              relationTo: "media",
              hasMany: true,
            },
            { name: "note", type: "text" },
          ],
        },
      ],
    },
  ],
};
