import type { GlobalConfig } from "payload";
import { anyone } from "../../access/anyone";
import { authenticated } from "../../access/authenticated";
import { navFields, urlField } from "../../fields/links";
import { revalidateGlobal } from "../../utilities/revalidate";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Website",
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "description",
      label: "Beschreibung (Suchmaschinen)",
      type: "textarea",
      required: true,
    },
    {
      name: "contact",
      label: "Kontakt",
      type: "group",
      fields: [
        { name: "email", label: "E-Mail", type: "email", required: true },
        urlField("instagram"),
        {
          name: "instagramHandle",
          label: "Instagram-Name",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "address",
      label: "Adresse",
      type: "group",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "street", label: "Strasse", type: "text", required: true },
        { name: "city", label: "PLZ und Ort", type: "text", required: true },
      ],
    },
    {
      name: "primaryNav",
      label: "Hauptnavigation",
      type: "array",
      fields: navFields,
    },
    {
      name: "socials",
      label: "Header rechts",
      type: "array",
      fields: navFields,
    },
    {
      name: "beteiligte",
      label: "Beteiligte",
      type: "array",
      fields: [{ name: "name", type: "text", required: true }, urlField("url")],
    },
  ],
};
