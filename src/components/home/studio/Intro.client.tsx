"use client";

import { useEffect } from "react";

import { initIntro } from "./Intro.script";

/** Runs the Intro behaviour against the server-rendered markup. */
export default function IntroScript() {
  useEffect(() => initIntro(), []);
  return null;
}
