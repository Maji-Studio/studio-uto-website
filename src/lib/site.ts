export const site = {
  name: "Studio Uto",
  description:
    "Studio Uto — Fotostudio zur Miete an der Flüelastrasse 16, 8048 Zürich.",
};

/** Single source of truth for contact details (header social + page copy). */
export const contact = {
  email: "info@atelier-uto.ch",
};

/** Studio postal address — used on the Kontakt page and in meta. */
export const address = {
  name: "Atelier Uto",
  street: "Flüelastrasse 16",
  city: "8048 Zürich",
} as const;

/**
 * The people behind Studio Uto ("Beteiligte"), shown on the Kontakt page.
 * Edit this list to add or remove collaborators; order is preserved.
 */
export const beteiligte: string[] = [
  "Cyrill Matter",
  "Nino Valpiani",
  "Lynn Grütter",
  "Oliver Schmocker",
  "Matthias Kappeler",
  "Nadine Kägi",
];

export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation (header centre). Remaining destinations land in later phases. */
export const primaryNav: NavItem[] = [
  { label: "Studio", href: "/" },
  { label: "Impressionen", href: "/impressionen/" },
  { label: "Information", href: "#" },
  { label: "Equipment", href: "#" },
  { label: "Kontakt", href: "/kontakt/" },
];

/**
 * Sticky in-page section navigation for the Studio homepage. Each href is an
 * anchor into a `studioSections` block (see src/lib/studio.ts) — keep the order
 * and ids in sync with that list.
 */
export const sectionNav: NavItem[] = [
  { label: "Daten", href: "#daten" },
  { label: "Grundriss und Ausstattung", href: "#grundriss" },
  { label: "Öffnungszeiten", href: "#oeffnungszeiten" },
  { label: "Preise", href: "#preise" },
];

/** Social / contact links (header right). Real targets land in a later phase. */
export const socials: NavItem[] = [
  { label: "Instagram", href: "#" },
  { label: "Email", href: `mailto:${contact.email}` },
];
