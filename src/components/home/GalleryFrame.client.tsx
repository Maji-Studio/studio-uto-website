"use client";

import { useEffect } from "react";

import { initGalleryTour } from "./GalleryFrame.script";

/** Runs the GalleryFrame behaviour against the server-rendered markup. */
export default function GalleryTourScript() {
  useEffect(() => initGalleryTour(), []);
  return null;
}
