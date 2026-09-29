export const site = {
  name: "Studio Uto",
  description:
    "Studio Uto — Fotostudio zur Miete an der Flüelastrasse 16, 8048 Zürich.",
};

/** Single source of truth for contact details (header social + page copy). */
export const contact = {
  email: "info@atelier-uto.ch",
  instagram: "https://www.instagram.com/studio.uto/",
  instagramHandle: "@studio.uto",
};

/** Studio postal address — used on the Kontakt page and in meta. */
export const address = {
  name: "Atelier Uto",
  street: "Flüelastrasse 16",
  city: "8048 Zürich",
} as const;

export interface Person {
  name: string;
  /** Personal website / portfolio, opened in a new tab. */
  url: string;
}

/**
 * The people behind Studio Uto ("Beteiligte"), shown on the Kontakt page, each
 * linked to their own site. Source: studio-uto.ch/kontakt. Order is preserved.
 */
export const beteiligte: Person[] = [
  { name: "Cyrill Matter", url: "https://cyrillmatter.com/" },
  { name: "Lynn Grütter", url: "https://www.lynngruetter.com/" },
  { name: "Oliver Schmocker", url: "https://oliverschmocker.com/" },
  { name: "Matthias Kappeler", url: "https://matthiaskappeler.ch/" },
  { name: "Nadine Kägi", url: "https://nadinekgi.pixieset.com/" },
  { name: "Nicolas Burri", url: "https://www.nicolasburristudio.com/" },
  { name: "Nino Valpiani", url: "https://ninovalpiani.com/" },
  { name: "Sam Heuberger", url: "https://www.samheuberger.com/" },
  { name: "Sven Probst", url: "https://svenprobst.ch/" },
  { name: "Timon Flükiger", url: "https://timonfluekiger.com/" },
  { name: "Tom Gibbons", url: "https://tom-gibbons.com/" },
  { name: "Yonca Ergen", url: "https://yoncaergen.com/" },
];

export interface NavItem {
  label: string;
  href: string;
  /** Off-site link — opens in a new tab. */
  external?: boolean;
}

/** Primary navigation (header centre). Equipment is still a placeholder ("#"). */
export const primaryNav: NavItem[] = [
  { label: "Studio", href: "/" },
  { label: "Impressionen", href: "/impressionen/" },
  { label: "Information", href: "/information/" },
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

/** Header right: Instagram, and the booking call to action (→ Kontakt form). */
export const socials: NavItem[] = [
  { label: "Instagram", href: contact.instagram, external: true },
  { label: "Jetzt anfragen", href: "/kontakt/" },
];
