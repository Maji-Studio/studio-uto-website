import Logo from "@/components/home/Logo";
import SiteHeader from "@/components/home/SiteHeader";
import Outro from "@/components/home/studio/Outro";
import Tarife from "@/components/home/studio/Tarife";
import SiteFooter from "@/components/site/SiteFooter";
import { getSiteSettings, getStudioSections } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

import "./page.css";

// Parking spot for homepage sections that don't fit there yet: the Tarife
// prices and the photo reel that followed the chrome intro. Not linked from
// the navigation and kept out of search.
export const generateMetadata = () =>
  pageMetadata({
    title: "Sketch",
    description: "Skizzen für die Startseite von Studio Uto.",
    noindex: true,
  });

export default async function SketchPage() {
  const [settings, sections] = await Promise.all([
    getSiteSettings(),
    getStudioSections(),
  ]);

  return (
    <main id="content" className="sketch">
      <Logo />
      <SiteHeader settings={settings} path="/sketch/" />

      <div className="sketch__body">
        <Tarife sections={sections} settings={settings} />
        <Outro />
      </div>

      <SiteFooter name={settings.name} />
    </main>
  );
}
