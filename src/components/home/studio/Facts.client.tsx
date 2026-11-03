"use client";

import { useEffect } from "react";

import { initFactsNav } from "./Facts.script";

/** Runs the Facts behaviour against the server-rendered markup. */
export default function FactsNavScript() {
  useEffect(() => initFactsNav(), []);
  return null;
}
