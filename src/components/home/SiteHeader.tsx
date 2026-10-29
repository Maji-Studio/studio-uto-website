import { isRouteActive } from "@/lib/routes";
import type { SiteSettings } from "@/lib/content/types";

import OClock from "./OClock";
import ClockScript from "./SiteHeader.client";
import "./SiteHeader.css";

interface Props {
  settings: SiteSettings;
  /** Pathname of the page being rendered, for the active nav chip. */
  path: string;
}

// A nav item is active when its real route matches the current path. Items still
// pointing at placeholder targets ("#") never match.
function isNavActive(path: string, href: string) {
  return href.startsWith("/") && isRouteActive(path, href);
}

// Build-time German date and time; refreshed client-side to stay current.
function formatGermanDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat("de-CH", { weekday: "long" }).format(
    date,
  );
  const month = new Intl.DateTimeFormat("de-CH", { month: "long" }).format(
    date,
  );
  const time = new Intl.DateTimeFormat("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${weekday} ${date.getDate()}. ${month} ${date.getFullYear()} ${time} Uhr`;
}

export default function SiteHeader({ settings, path }: Props) {
  const now = new Date();
  const today = formatGermanDate(now);

  return (
    <>
      <header className="site-header">
        <div className="site-header__group site-header__meta">
          {/* Plain anchor on purpose: navigation stays a full document load for
              the cross-document view transitions. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            className="chip"
            href="/"
            data-label="STUDIO UTO"
            aria-label={`${settings.name} — Startseite`}
          >
            STUDIO UTO
          </a>
          <time
            className="chip"
            id="today"
            dateTime={now.toISOString()}
            suppressHydrationWarning
          >
            {today}
          </time>
        </div>

        <nav
          className="site-header__group site-header__nav"
          aria-label="Hauptnavigation"
        >
          {settings.primaryNav.map((item) => {
            const active = isNavActive(path, item.href);
            return (
              <a
                key={item.label}
                className={active ? "chip chip--active" : "chip"}
                href={item.href}
                data-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="site-header__group site-header__socials">
          {settings.socials.map((item) => (
            <a
              key={item.label}
              className="chip"
              href={item.href}
              data-label={item.label}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      {/* Clicking the date (or the O) opens the O clock. */}
      <OClock />
      <ClockScript />
    </>
  );
}
