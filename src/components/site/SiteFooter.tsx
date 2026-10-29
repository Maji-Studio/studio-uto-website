import "./SiteFooter.css";

// Build-time "last updated" stamp (content/build time, not the viewer's clock —
// so unlike the header date it is intentionally NOT refreshed client-side).
export default function SiteFooter({ name }: { name: string }) {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    now,
  );
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(now);
  const updated = `${weekday} ${month} ${now.getDate()} ${now.getFullYear()}`;
  const year = now.getFullYear();

  return (
    <footer className="site-footer">
      <p className="site-footer__updated">Last updated at {updated}</p>
      <p className="site-footer__copy">
        © {year}, {name.toUpperCase()} All Rights Reserved
      </p>
    </footer>
  );
}
