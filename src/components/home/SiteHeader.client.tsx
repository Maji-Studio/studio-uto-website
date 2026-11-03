"use client";

import { useEffect } from "react";

import { initClock } from "./SiteHeader.script";

/** Runs the SiteHeader behaviour against the server-rendered markup. */
export default function ClockScript() {
  useEffect(() => initClock(), []);
  return null;
}
