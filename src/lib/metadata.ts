import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/content";

interface PageMeta {
  title: string;
  description: string;
  /** Keep the page out of search results (work-in-progress pages). */
  noindex?: boolean;
}

/** Head metadata for a page: "<title> | Studio Uto", the home page is just the name. */
export async function pageMetadata({
  title,
  description,
  noindex = false,
}: PageMeta): Promise<Metadata> {
  const site = await getSiteSettings();
  return {
    title: {
      absolute: title === site.name ? title : `${title} | ${site.name}`,
    },
    description,
    ...(noindex ? { robots: "noindex" } : {}),
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  };
}
