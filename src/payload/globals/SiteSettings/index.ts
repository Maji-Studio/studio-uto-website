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
    { name: "name", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    {
      name: "contact",
      type: "group",
      fields: [
        { name: "email", type: "email", required: true },
        urlField("instagram"),
        { name: "instagramHandle", type: "text", required: true },
      ],
    },
    {
      name: "address",
      type: "group",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "street", type: "text", required: true },
        { name: "city", type: "text", required: true },
      ],
    },
    { name: "primaryNav", type: "array", fields: navFields },
    { name: "socials", type: "array", fields: navFields },
    {
      name: "beteiligte",
      type: "array",
      fields: [{ name: "name", type: "text", required: true }, urlField("url")],
    },
  ],
};
