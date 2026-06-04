# Homepage Redesign — Phased Roadmap

- **Created:** 2026-06-03
- **Design reference:** `Uto_Identity_3-06 Large.jpeg` (bold/brutalist single-screen homepage)
- **Status:** Phase 1 in progress

The site is being rebuilt from a generic Astro "editorial studio" starter into the real
Studio Uto site. Real German content for later phases is harvested from the old live site
(`studio-uto.ch`). Dates are tentative (one phase ≈ one working session); adjust to cadence.

---

## Phase 1 — Shell · target wk of 2026-06-03  *(in progress)*

The above-the-fold homepage as a static shell:

- Giant **UTO** wordmark (UTO variable font — logo glyphs only: U/T/O).
- Header row (flex): left = `STUDIO UTO` + **live German date**; center = primary nav chips
  (Studio · Impressionen · Information · Equipment · Buchen); right = socials (Instagram · Email).
- **Contained** (not fullscreen) centered image frame with placeholder photo + "Take a tour"
  pill + corner reframe marks (visual-only).
- **Sticky** bottom-left section nav (Daten · Grundriss und Ausstattung · Öffnungszeiten · Preise).
- Neutral grotesque for UI text; reworked design tokens.
- Remove the generic starter scaffold (examples, contact, content-model/SectionRenderer).

Links are visual placeholders this phase.

## Phase 2 — Scroll content · target wk of 2026-06-10

Build the sections the bottom-left nav points to, using real live-site content:

- **Daten** — Dimensionen (Ganzes Studio mit Küche: L 14m, B 7m, H 2.7m · Shooting Fläche:
  L 7m, B 7m, H 5.7m), Boden (Betonboden, abgeschliffen, Terrazzo-Optik), Verdunklung
  (Rollläden + lichtdichte schwarze Moltonvorhänge), inkl. Equipment (Styros, Kleingrip-Set,
  Klammer-Set, Verlängerungskabel, Leiter).
- **Grundriss und Ausstattung** — Im Studio (W-Lan 1Gb/s, Kaffeemaschine, Besprechungstisch,
  Arbeitstische/Rollhocker) · Auf Anfrage (Spiegel, Kleiderständer, Garderobe) + plan/room images.
- **Öffnungszeiten** — Mo–Fr 9:00–18:00 (Wochenende/Randzeiten auf Anfrage) + Anfahrt, Parking
  & Anlieferung (Flüelastrasse, 3. Stock «Atelier Uto», Parkplatz, Warenlift).
- **Preise (CHF)** — ganzer Tag (10h) 850 · halber Tag (4h) 550 · zusätzliche Stunden 150 ·
  separater Styling/H&M-Raum 100 · exkl. MwSt.

Side-nav becomes a scroll-spy with smooth-scroll anchors.

## Phase 3 — Top-nav destinations · target wk of 2026-06-17

Studio · Impressionen (photo gallery) · Information · Equipment (rentable gear list) ·
Buchen (booking entry) — as routes or in-page sections.

## Phase 4 — "Take a tour" / interactive gallery · target wk of 2026-06-24

Real photography; panning / virtual-tour viewer behind the reframe affordance.

## Phase 5 — Contact / Buchen + Beteiligte + polish · target wk of 2026-07-01

Booking/contact form, address (Atelier Uto, Flüelastrasse 16, 8048 Zürich), team list
(Beteiligte), responsive/mobile pass, SEO/meta, accessibility audit.
