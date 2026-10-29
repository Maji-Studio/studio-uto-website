"use client";

import { useEffect } from "react";

import { initLogo } from "./Logo.script";

/** Runs the Logo behaviour against the server-rendered markup. */
export default function LogoScript() {
  useEffect(() => initLogo(), []);
  return null;
}
