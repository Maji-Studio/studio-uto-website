/**
 * The content contract between the pages and wherever their content lives.
 * Components only ever see these shapes, never Payload documents or bundled
 * image imports, so the source behind `src/lib/content/index.ts` can change
 * without touching a component.
 */

/** An image ready to render: a URL `next/image` can load, plus its intrinsic size. */
export interface ContentImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Focal point when a layout crops the image (CSS object-position). */
  objectPosition?: string;
}

export interface ContentLink {
  label: string;
  /** Right-hand text: the destination as the visitor will recognise it. */
  detail: string;
  href: string;
  /** Off-site link: opens in a new tab and carries a ↗. */
  external?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface Person {
  name: string;
  /** Personal website or portfolio, opened in a new tab. */
  url: string;
}

export interface SiteSettings {
  name: string;
  description: string;
  contact: {
    email: string;
    instagram: string;
    instagramHandle: string;
  };
  address: {
    name: string;
    street: string;
    city: string;
  };
  primaryNav: NavItem[];
  socials: NavItem[];
  /** The people behind Studio Uto ("Beteiligte"), in display order. */
  beteiligte: Person[];
}

/**
 * One block of a fact-sheet section. A block may combine several shapes,
 * rendered in this order: text, pairs, lines, links, figure, gallery, note.
 */
export interface StudioBlock {
  label?: string;
  text?: string[];
  pairs?: { term: string; detail: string }[];
  lines?: string[];
  links?: ContentLink[];
  figure?: ContentImage;
  gallery?: { name: string; images: ContentImage[] };
  note?: string;
}

export interface StudioSection {
  /** Anchor id on the Information page. */
  id: string;
  title: string;
  /** Short label for the sticky section nav, when it differs from `title`. */
  navLabel?: string;
  blocks: StudioBlock[];
}

export interface Impression {
  /** Person or artist shown on the left of the row. */
  name: string;
  /** Optional "for <client>" line. */
  client?: string;
  images: ContentImage[];
}
