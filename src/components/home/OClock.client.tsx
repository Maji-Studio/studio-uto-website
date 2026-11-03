"use client";

import { useEffect } from "react";

import { initOClock } from "./OClock.script";

/** Runs the OClock behaviour against the server-rendered markup. */
export default function OClockScript() {
  useEffect(() => initOClock(), []);
  return null;
}
