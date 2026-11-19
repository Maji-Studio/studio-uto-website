import "./SiteFooter.css";

// Build-time "last updated" stamp (content/build time, not the viewer's clock —
// so unlike the header date it is intentionally NOT refreshed client-side).
// Same wording order as the header's date chip: weekday, day, month, year.
export default function SiteFooter({ name }: { name: string }) {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("de-CH", { weekday: "long" }).format(
    now,
  );
  const month = new Intl.DateTimeFormat("de-CH", { month: "long" }).format(now);
  const updated = `${weekday} ${now.getDate()}. ${month} ${now.getFullYear()}`;
  const year = now.getFullYear();

  return (
    <footer className="site-footer">
      <p className="site-footer__updated">Zuletzt aktualisiert am {updated}</p>
      <p className="site-footer__copy">
        © {year} {name.toUpperCase()}. Alle Rechte vorbehalten.
      </p>
    </footer>
  );
}
