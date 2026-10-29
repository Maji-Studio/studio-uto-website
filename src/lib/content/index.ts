import {
  impressionen,
  informationSections,
  siteSettings,
  studioPhotos,
  studioSections,
} from "./static";
import type {
  ContentImage,
  Impression,
  SiteSettings,
  StudioSection,
} from "./types";

/**
 * What the pages read. Every getter is async so the source can move to Payload
 * without touching a page or a component; today they return the bundled data
 * from `./static`.
 */

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings;
}

/** The studio photography: hero first, then the rest of the tour. */
export async function getStudioPhotos(): Promise<ContentImage[]> {
  return studioPhotos;
}

/** The four fact-sheet sections: daten, grundriss, oeffnungszeiten, preise. */
export async function getStudioSections(): Promise<StudioSection[]> {
  return studioSections;
}

/** The full Information page: studio, the fact sheet, atelier, anfahrt, buchung. */
export async function getInformationSections(): Promise<StudioSection[]> {
  return informationSections;
}

export async function getImpressionen(): Promise<Impression[]> {
  return impressionen;
}
