import Logo from "@/components/home/Logo";
import SiteHeader from "@/components/home/SiteHeader";
import Facts from "@/components/home/studio/Facts";
import SiteFooter from "@/components/site/SiteFooter";
import { getInformationSections, getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

import "./page.css";

export const generateMetadata = () =>
  pageMetadata({
    title: "Information",
    description:
      "Information — Studio Uto im Atelier Uto, Flüelastrasse 16, 8048 Zürich: Daten, Ausstattung, Öffnungszeiten, Preise, Anfahrt, Buchung und Kontakt.",
  });

export default async function InformationPage() {
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getInformationSections(),
  ]);

  return (
    <main id="content" className="information">
      {/* Full wordmark — identical treatment to the homepage. */}
      <Logo />

      <SiteHeader settings={settings} path="/information/" />

      {/* Numbered sections, the facts in the fact-sheet chip language. */}
      <Facts sections={sections} />

      <SiteFooter name={settings.name} />
    </main>
  );
}
