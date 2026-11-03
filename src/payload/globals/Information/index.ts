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
      label: "Abschnitte",
      type: "array",
      fields: [
        {
          name: "anchor",
          label: "Anker (URL #…)",
          type: "text",
          required: true,
          validate: (value: string | null | undefined) =>
            /^[a-z0-9-]+$/.test(value ?? "") ||
            "Nur a–z, 0–9 und Bindestriche verwenden.",
        },
        { name: "title", label: "Titel", type: "text", required: true },
        { name: "navLabel", label: "Kurztitel Navigation", type: "text" },
        {
          name: "blocks",
          label: "Blöcke",
          type: "array",
          fields: [
            { name: "label", label: "Überschrift", type: "text" },
            {
              name: "text",
              label: "Text",
              type: "textarea",
              admin: { description: "Absätze durch eine Leerzeile trennen." },
            },
            {
              name: "pairs",
              label: "Wertepaare",
              type: "array",
              fields: [
                {
                  name: "term",
                  label: "Begriff",
                  type: "text",
                  required: true,
                },
                { name: "detail", label: "Wert", type: "text", required: true },
              ],
            },
            {
              name: "lines",
              label: "Liste",
              type: "textarea",
              admin: { description: "Ein Eintrag pro Zeile." },
            },
            {
              name: "links",
              label: "Links",
              type: "array",
              fields: [
                ...navFields,
                {
                  name: "detail",
                  label: "Ziel (rechts)",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "figure",
              label: "Bild",
              type: "upload",
              relationTo: "media",
            },
            { name: "galleryName", label: "Galerie-Name", type: "text" },
            {
              name: "galleryImages",
              label: "Galerie-Bilder",
              type: "upload",
              relationTo: "media",
              hasMany: true,
            },
            { name: "note", label: "Hinweis", type: "text" },
          ],
        },
      ],
    },
  ],
};
