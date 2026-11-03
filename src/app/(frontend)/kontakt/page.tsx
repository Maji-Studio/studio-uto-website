import Logo from "@/components/home/Logo";
import SiteHeader from "@/components/home/SiteHeader";
import ContactForm from "@/components/contact/ContactForm";
import { getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

import "./page.css";

export const generateMetadata = () =>
  pageMetadata({
    title: "Kontakt",
    description:
      "Kontakt & Buchung — Studio Uto, Fotostudio zur Miete an der Flüelastrasse 16, 8048 Zürich.",
  });

/*
 * The Kontakt page rides the identity's mid-grey ground (not the paper-white of
 * the gallery pages), set on <body> from kontakt/page.css so overscroll and the
 * logo's open counters show the same grey, not a sliver of white.
 */
export default async function KontaktPage() {
  const settings = await getSiteSettings();

  return (
    <main id="content" className="kontakt">
      {/* Full wordmark — identical treatment to the homepage. */}
      <Logo />

      <SiteHeader settings={settings} path="/kontakt/" />

      <div className="kontakt__body">
        {/* Left column sinks to the baseline of the screen, like the reference. */}
        <section className="people" aria-labelledby="people-heading">
          <h2 id="people-heading" className="people__heading">
            Studio Uto Beteiligte
          </h2>
          <ul className="people__list" role="list">
            {settings.beteiligte.map((person) => (
              <li className="people__name" key={person.name}>
                <a href={person.url} target="_blank" rel="noopener noreferrer">
                  {person.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Right column: the booking form, then the studio address. */}
        <div className="kontakt__contact">
          <h2 className="visually-hidden">Anfrage senden</h2>
          <ContactForm email={settings.contact.email} />

          <address className="kontakt__address">
            <span>{settings.address.name}</span>
            <span>{settings.address.street}</span>
            <span>{settings.address.city}</span>
          </address>
        </div>
      </div>
    </main>
  );
}
