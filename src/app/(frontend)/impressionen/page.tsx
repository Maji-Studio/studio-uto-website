import Logo from "@/components/home/Logo";
import SiteHeader from "@/components/home/SiteHeader";
import EntityRow from "@/components/impressionen/EntityRow";
import Lightbox from "@/components/impressionen/Lightbox";
import SiteFooter from "@/components/site/SiteFooter";
import { getImpressionen, getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

import "./page.css";

export const generateMetadata = () =>
  pageMetadata({
    title: "Impressionen",
    description:
      "Impressionen — eine Auswahl von Arbeiten und Kollaborationen aus dem kreativen Netzwerk von Studio Uto.",
  });

export default async function ImpressionenPage() {
  const [settings, impressionen] = await Promise.all([
    getSiteSettings(),
    getImpressionen(),
  ]);

  return (
    <>
      <main id="content" className="impressionen">
        {/* Full wordmark at the top — identical treatment to the homepage. */}
        <Logo />

        <SiteHeader settings={settings} path="/impressionen/" />

        <section className="impressionen__entities" aria-label="Impressionen">
          {impressionen.map((entity) => (
            <EntityRow key={entity.name} entity={entity} />
          ))}
        </section>

        <section className="collab">
          <p className="collab__text">
            STUDIO UTO collaborates with a network of creative professionals
            including producers, DOPs, editors, graphic designers,
            typedesigners, strategists, signage specialist, moderators and more.
          </p>
          <p className="collab__email">
            <a href={`mailto:${settings.contact.email}`}>
              {settings.contact.email}
            </a>
          </p>
        </section>

        <SiteFooter name={settings.name} />
      </main>

      <Lightbox />
    </>
  );
}
