"use client";

import { useEffect } from "react";

import { initOutro } from "./Outro.script";

/** Runs the Outro behaviour against the server-rendered markup. */
export default function OutroScript() {
  useEffect(() => initOutro(), []);
  return null;
}
