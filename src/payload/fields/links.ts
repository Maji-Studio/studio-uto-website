import type { Field } from "payload";

export const navFields: Field[] = [
  { name: "label", label: "Text", type: "text", required: true },
  { name: "href", label: "Link", type: "text", required: true },
  {
    name: "external",
    label: "Öffnet in neuem Tab",
    type: "checkbox",
    defaultValue: false,
  },
];

export const urlField = (name: string): Field => ({
  name,
  type: "text",
  required: true,
  validate: (value: string | null | undefined) => {
    try {
      const url = new URL(value ?? "");
      return (
        ["https:", "http:"].includes(url.protocol) ||
        "Bitte eine HTTP(S)-URL eingeben."
      );
    } catch {
      return "Bitte eine gültige URL eingeben.";
    }
  },
});
