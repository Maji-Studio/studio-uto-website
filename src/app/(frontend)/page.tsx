import Logo from "@/components/home/Logo";
import SiteHeader from "@/components/home/SiteHeader";
import StudioGallery from "@/components/home/StudioGallery";
import Intro from "@/components/home/studio/Intro";
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
        <StudioGallery photos={photos} />

        {/*
          After the studio photos: the chrome intro (U → T → O), whose labels
          link into the full fact sheet on /information/. The prices and the
          photo reel that followed it are parked on /sketch/ until they fit.
        */}
        <Intro sections={sections} address={settings.address} />

        <SiteFooter name={settings.name} />
      </main>

      {/* Viewer for the studio photos. */}
      <Lightbox />
    </>
  );
}
