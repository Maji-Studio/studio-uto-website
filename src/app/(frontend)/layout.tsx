import type { ReactNode } from "react";

import PageTransition from "@/components/site/PageTransition";
import TransitionReel from "@/components/site/TransitionReel";
import "@/styles/global.css";

/*
 * Cross-document (MPA) View Transitions. Each navigation stays a real page
 * load — so the logo's fit/contrast script runs fresh every time — while the
 * browser animates between the outgoing and incoming snapshots. Chromium-only
 * today; other browsers fall back to an instant navigation with no breakage.
 *
 * The opt-in must be inline and first: when the new page was revealed before
 * an external stylesheet applied, Chrome aborted the transition ("ViewTransition
 * opt-in disabled") on roughly half of all navigations. The choreography itself
 * stays in global.css.
 */
const viewTransitionOptIn = `
      @view-transition {
        navigation: auto;
      }
    `;

/*
 * View-transition logo restore. A cross-document transition snapshots the
 * incoming logo at its first rendering opportunity — which is BEFORE the
 * logo script fits it — so the wordmark would morph from the previous page's
 * fitted state to this page's unfitted default and then snap. The `pagereveal`
 * event fires after the new DOM is parsed but before that snapshot, so we
 * re-apply the last fitted appearance there. The listener must be registered
 * from a classic, parser-blocking head script to be in place before
 * `pagereveal` fires. Logo.script.ts persists the values; here we only paint
 * them in time.
 */
const logoRestore = `
      window.addEventListener("pagereveal", () => {
        try {
          var saved = JSON.parse(
            sessionStorage.getItem("uto-logo-fit") || "null",
          );
          if (!saved) return;
          var logo = document.querySelector(".logo");
          if (!logo) return;
          var glyphs = logo.querySelectorAll(":scope > span");
          if (!saved.glyphs || saved.glyphs.length !== glyphs.length) return;
          logo.style.columnGap = saved.gap;
          saved.glyphs.forEach(function (s, i) {
            glyphs[i].style.fontVariationSettings = s.fvs;
            glyphs[i].style.transform = s.transform;
            glyphs[i].style.marginRight = s.margin;
          });
          logo.dataset.fit = "1";
        } catch (e) {}
      });
    `;

export default function FrontendLayout({ children }: { children: ReactNode }) {
  // The pagereveal handlers in <head> add classes and custom properties to
  // <html> (vt-page, vt-reel-on, --vt-*) before React hydrates it.
  return (
    <html lang="de-CH" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/UTOVariableVF.ttf"
          as="font"
          type="font/ttf"
          crossOrigin=""
        />
        <style dangerouslySetInnerHTML={{ __html: viewTransitionOptIn }} />
        <script dangerouslySetInnerHTML={{ __html: logoRestore }} />
        <PageTransition />
      </head>
      <body>
        <a className="skip-link" href="#content">
          Zum Inhalt springen
        </a>
        {children}
        <TransitionReel />
      </body>
    </html>
  );
}
