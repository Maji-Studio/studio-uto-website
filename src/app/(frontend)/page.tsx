import GalleryFrame from "@/components/home/GalleryFrame";
import Logo from "@/components/home/Logo";
import SiteHeader from "@/components/home/SiteHeader";
import Intro from "@/components/home/studio/Intro";
import Lightbox from "@/components/impressionen/Lightbox";
import SiteFooter from "@/components/site/SiteFooter";
import {
  getInformationSections,
  getSiteSettings,
  getStudioPhotos,
} from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

import "./home.css";

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
      <main id="content" className="home">
        <Logo />
        <SiteHeader settings={settings} path="/" />
        <GalleryFrame photos={photos} />

        {/*
          Past the fold: the chrome intro (U → T → O), whose labels link into the
          full fact sheet on /information/. The prices and the photo reel that
          followed it are parked on /sketch/ until they fit.
        */}
        <Intro sections={sections} address={settings.address} />

        <SiteFooter name={settings.name} />
      </main>

      {/* Viewer for the hero's "Take a tour". */}
      <Lightbox />
    </>
  );
}
