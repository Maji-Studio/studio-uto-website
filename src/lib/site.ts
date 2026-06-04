export const site = {
  name: "Studio Uto",
  description:
    "Studio Uto — Fotostudio zur Miete an der Flüelastrasse 16, 8048 Zürich.",
};

export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation (header centre). Destinations land in later phases. */
export const primaryNav: NavItem[] = [
  { label: "Studio", href: "#" },
  { label: "Impressionen", href: "#" },
  { label: "Information", href: "#" },
  { label: "Equipment", href: "#" },
  { label: "Buchen", href: "#" },
];

/** Sticky bottom-left section navigation. Anchors get wired in Phase 2. */
export const sectionNav: NavItem[] = [
  { label: "Daten", href: "#" },
  { label: "Grundriss und Ausstattung", href: "#" },
  { label: "Öffnungszeiten", href: "#" },
  { label: "Preise", href: "#" },
];

/** Social / contact links (header right). Real targets land in a later phase. */
export const socials: NavItem[] = [
  { label: "Instagram", href: "#" },
  { label: "Email", href: "#" },
];
