import Logo from "@/components/home/Logo";
import SiteHeader from "@/components/home/SiteHeader";
import StudioSheet from "@/components/home/StudioSheet";
import Lightbox from "@/components/impressionen/Lightbox";
import SiteFooter from "@/components/site/SiteFooter";
import {
  getInformationSections,
  getSiteSettings,
  getStudioPhotos,
} from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  const site = await getSiteSettings();
  return pageMetadata({ title: site.name, description: site.description });
}

export default async function HomePage() {
  const [settings, photos, sections] = await Promise.all([
    getSiteSettings(),
    getStudioPhotos(),
    getInformationSections(),
  ]);

  return (
    <>
      <main id="content" className="page home">
        <Logo />
        <SiteHeader settings={settings} path="/" />
        <StudioSheet photos={photos} sections={sections} />
        <SiteFooter name={settings.name} />
      </main>

      {/* Viewer for the studio photos. */}
      <Lightbox />
    </>
  );
}
