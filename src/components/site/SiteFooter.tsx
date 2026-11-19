import Intro from "@/components/home/studio/Intro";
import { getSiteSettings } from "@/lib/content";
import type { NavItem, SiteSettings } from "@/lib/content/types";

import "./SiteFooter.css";

/** The chrome footer's labels: pages, socials, e-mail and the street. */
function footerLinks(settings: SiteSettings): NavItem[] {
  const { contact, address } = settings;
  return [
    // "#" marks a page that does not exist yet (Equipment).
    ...settings.primaryNav.filter((n) => n.href !== "#"),
    ...settings.socials,
    { label: contact.email, href: `mailto:${contact.email}` },
    { label: address.street, href: "/information/#anfahrt" },
  ];
}

// The footer on every page: the chrome U on a shorter stage, its labels the
// site's pages and contact, then the two small lines.
//
// The "last updated" stamp is the content/build time, not the viewer's clock,
// so unlike the header date it is intentionally NOT refreshed client-side.
// Same wording order as the header's date chip: weekday, day, month, year.
export default async function SiteFooter({ name }: { name: string }) {
  const settings = await getSiteSettings();
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("de-CH", { weekday: "long" }).format(
    now,
  );
  const month = new Intl.DateTimeFormat("de-CH", { month: "long" }).format(now);
  const updated = `${weekday} ${now.getDate()}. ${month} ${now.getFullYear()}`;
  const year = now.getFullYear();

  return (
    <footer className="site-footer">
      <Intro
        sections={[]}
        address={settings.address}
        links={footerLinks(settings)}
        className="intro--footer"
      />
      <div className="site-footer__lines">
        <p className="site-footer__updated">
          Zuletzt aktualisiert am {updated}
        </p>
        <p className="site-footer__copy">
          © {year} {name.toUpperCase()}. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
}
