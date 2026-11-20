import Logo from "@/components/home/Logo";
import SiteHeader from "@/components/home/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import StudioFilm from "@/components/studio-3d/StudioFilm";
import { getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const generateMetadata = () =>
  pageMetadata({
    title: "Studio Tour",
    description:
      "Das Studio Uto als Modell in vier Stimmungen: Tageslicht, Abendsonne, verdunkelt fürs Shooting und eingerichtet für ein Event.",
  });

export default async function Studio3DPage() {
  const settings = await getSiteSettings();
  return (
    <main className="page" id="content">
      <Logo />
      <SiteHeader settings={settings} path="/studio-3d/" />
      <StudioFilm />
      <SiteFooter name={settings.name} />
    </main>
  );
}
