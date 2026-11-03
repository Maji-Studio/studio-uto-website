"use client";

import { useEffect } from "react";

import { initLightbox } from "./Lightbox.script";

/** Runs the Lightbox behaviour against the server-rendered markup. */
export default function LightboxScript() {
  useEffect(() => initLightbox(), []);
  return null;
}
