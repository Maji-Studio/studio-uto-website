import type {
  Impressionen,
  Information,
  Media,
  SiteSetting,
} from "@/payload-types";
import type {
  ContentImage,
  Impression,
  NavItem,
  SiteSettings,
  StudioBlock,
  StudioSection,
} from "./types";

const clean = (value?: string | null): string => value?.trim() ?? "";
const present = <T>(value: T | undefined): value is T => value !== undefined;

export function toContentImage(
  media: Media | number | null | undefined,
  extra: Pick<ContentImage, "objectPosition"> = {},
): ContentImage | undefined {
  if (!media || typeof media === "number") return undefined;
  const file = media.url
    ? media
    : Object.values(media.variants ?? {})
        .filter((variant) => variant?.url && variant.width && variant.height)
        .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  if (!file?.url || !file.width || !file.height) return undefined;
  const candidates = new Map<number, string>();
  for (const [name, variant] of Object.entries(media.variants ?? {})) {
    if (name !== "thumbnail" && variant?.url && variant.width) {
      candidates.set(variant.width, variant.url.replace(/\/+$/, ""));
    }
  }
  // Prefer the main file when a small upload produces variants of equal width.
  candidates.set(file.width, file.url.replace(/\/+$/, ""));
  const srcSet = [...candidates]
    .sort(([a], [b]) => a - b)
    .map(([width, url]) => `${url} ${width}w`)
    .join(", ");
  const objectPosition = clean(extra.objectPosition);
  return {
    // Local file URLs inherit Next's trailingSlash and otherwise redirect.
    src: file.url.replace(/\/+$/, ""),
    ...(candidates.size > 1 ? { srcSet } : {}),
    width: file.width,
    height: file.height,
    alt: media.alt,
    ...(objectPosition ? { objectPosition } : {}),
  };
}

function toNav(items: SiteSetting["primaryNav"]): NavItem[] {
  return (items ?? []).map(({ label, href, external }) => ({
    label,
    href,
    ...(external ? { external: true } : {}),
  }));
}

export function toSiteSettings(global: SiteSetting): SiteSettings {
  return {
    name: global.name,
    description: global.description,
    contact: {
      email: global.contact.email,
      instagram: global.contact.instagram,
      instagramHandle: global.contact.instagramHandle,
    },
    address: {
      name: global.address.name,
      street: global.address.street,
      city: global.address.city,
    },
    primaryNav: toNav(global.primaryNav),
    socials: toNav(global.socials),
    beteiligte: (global.beteiligte ?? []).map(({ name, url }) => ({
      name,
      url,
    })),
  };
}

type Block = NonNullable<
  NonNullable<Information["sections"]>[number]["blocks"]
>[number];

function toBlock(block: Block): StudioBlock | undefined {
  const mapped: StudioBlock = {};
  const label = clean(block.label);
  const note = clean(block.note);
  const text = clean(block.text)
    .split(/\r?\n[\t ]*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lines = clean(block.lines)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pairs = (block.pairs ?? [])
    .map(({ term, detail }) => ({ term: clean(term), detail: clean(detail) }))
    .filter(({ term, detail }) => term && detail);
  const links = (block.links ?? [])
    .map(({ label, detail, href, external }) => ({
      label: clean(label),
      detail: clean(detail),
      href: clean(href),
      ...(external ? { external: true } : {}),
    }))
    .filter(({ label, href }) => label && href);
  const figure = toContentImage(block.figure);
  const galleryName = clean(block.galleryName);
  const galleryImages = (block.galleryImages ?? [])
    .map((media) => toContentImage(media))
    .filter(present);

  if (text.length) mapped.text = text;
  if (pairs.length) mapped.pairs = pairs;
  if (lines.length) mapped.lines = lines;
  if (links.length) mapped.links = links;
  if (figure) mapped.figure = figure;
  if (galleryName && galleryImages.length)
    mapped.gallery = { name: galleryName, images: galleryImages };
  if (note) mapped.note = note;
  if (!Object.keys(mapped).length) return undefined;
  if (label) mapped.label = label;
  return mapped;
}

export function toStudioSections(global: Information): StudioSection[] {
  return (global.sections ?? []).map(({ anchor, title, navLabel, blocks }) => ({
    id: anchor,
    title,
    ...(clean(navLabel) ? { navLabel: clean(navLabel) } : {}),
    blocks: (blocks ?? []).map(toBlock).filter(present),
  }));
}

export function toImpressions(docs: readonly Impressionen[]): Impression[] {
  return docs.map(({ name, client, images }) => ({
    name,
    ...(clean(client) ? { client: clean(client) } : {}),
    images: (images ?? [])
      .map(({ image, objectPosition }) =>
        toContentImage(image, { objectPosition: objectPosition ?? undefined }),
      )
      .filter(present),
  }));
}
