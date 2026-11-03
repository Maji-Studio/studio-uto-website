/**
 * What the pages read: Payload content mapped into the shapes in ./types.
 * Components only see those shapes, never Payload documents.
 */

import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import {
  toImpressions,
  toSiteSettings,
  toStudioSections,
} from "./payload";
import type { Impression, SiteSettings, StudioSection } from "./types";

/** The fact-sheet sections the homepage intro and /sketch/ draw from. */
const STUDIO_SECTION_IDS = ["daten", "grundriss", "oeffnungszeiten", "preise"];

const payload = cache(() => getPayload({ config }));

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const global = await (await payload()).findGlobal({
    slug: "site-settings",
    depth: 0,
  });
  return toSiteSettings(global);
});

export const getInformationSections = cache(
  async (): Promise<StudioSection[]> => {
    const global = await (await payload()).findGlobal({
      slug: "information",
      depth: 1,
    });
    return toStudioSections(global);
  },
);

export async function getStudioSections(): Promise<StudioSection[]> {
  const sections = await getInformationSections();
  return sections.filter(({ id }) => STUDIO_SECTION_IDS.includes(id));
}

/** The studio walk-through: the Grundriss gallery, hero photo first. */
export async function getStudioPhotos() {
  const sections = await getInformationSections();
  return (
    sections
      .flatMap(({ blocks }) => blocks)
      .find(({ gallery }) => gallery)?.gallery?.images ?? []
  );
}

export const getImpressionen = cache(async (): Promise<Impression[]> => {
  const { docs } = await (await payload()).find({
    collection: "impressionen",
    depth: 1,
    limit: 100,
    pagination: false,
    sort: "_order",
  });
  return toImpressions(docs);
});
