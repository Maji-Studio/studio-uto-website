"use client";

import { useEffect } from "react";

import { initContactForm } from "./ContactForm.script";

/** Runs the ContactForm behaviour against the server-rendered markup. */
export default function ContactFormScript() {
  useEffect(() => initContactForm(), []);
  return null;
}
