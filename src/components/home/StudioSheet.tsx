import LightboxThumb from "@/components/impressionen/LightboxThumb";
import Facts from "@/components/home/studio/Facts";
import type {
  ContentImage,
  ContentLink,
  StudioBlock,
  StudioSection,
} from "@/lib/content/types";

import "./StudioSheet.css";

/*
 * The homepage: the first studio photo runs edge to edge; below it a few key
 * facts from the /information/ sections, in columns on wider screens
 * (StudioSheet.css), with one link to the full sheet; the other photos close
 * the page in one flush block. Every photo is a Lightbox thumb in one gallery.
 */

/**
 * The short sheet: one or two lines from each /information/ section. A section
 * whose source lines are missing is left out. The one way on to the full sheet
 * is the "Alle Informationen" chip below it.
 */
function shortSections(sections: StudioSection[]): StudioSection[] {
  const blocks = (id: string) =>
    sections.find((x) => x.id === id)?.blocks ?? [];
  const short = (
    id: string,
    block: Omit<StudioBlock, "links"> | undefined,
    links: ContentLink[] = [],
  ): StudioSection[] => {
    const s = sections.find((x) => x.id === id);
    return s && block ? [{ ...s, blocks: [{ ...block, links }] }] : [];
  };

  const pitch = blocks("studio").find((b) => b.text)?.text?.[0];
  const shooting = blocks("daten")
    .flatMap((b) => b.pairs ?? [])
    .filter((p) => /Shooting/i.test(p.term));
  const hours = blocks("oeffnungszeiten").find((b) => b.lines)?.lines;
  const rates = blocks("preise").find((b) => b.pairs);
  const address = blocks("anfahrt").find((b) => b.lines)?.lines;
  const contact = blocks("buchung").find((b) => b.links)?.links;

  return [
    // The first sentence of the pitch.
    ...short("studio", pitch ? { text: [pitch] } : undefined),
    // The shooting area only.
    ...short("daten", shooting.length ? { pairs: shooting } : undefined),
    ...short(
      "oeffnungszeiten",
      hours ? { lines: hours.slice(0, 1) } : undefined,
    ),
    // Day and half-day rates, with the VAT note.
    ...short(
      "preise",
      rates ? { pairs: rates.pairs?.slice(0, 2), note: rates.note } : undefined,
    ),
    // Street and town on one line.
    ...short(
      "anfahrt",
      address ? { lines: [address.slice(-2).join(", ")] } : undefined,
    ),
    // The contact chips.
    ...short("buchung", contact ? {} : undefined, contact),
  ];
}

export default function StudioSheet({
  photos,
  sections,
}: {
  photos: ContentImage[];
  sections: StudioSection[];
}) {
  const [hero, ...rest] = photos;
  const total = photos.length;

  return (
    <div className="studio-sheet" data-lightbox-gallery data-name="Studio Uto">
      {hero && (
        <div className="studio-sheet__hero">
          <LightboxThumb
            image={hero}
            label={`Bild 1 von ${total} öffnen`}
            sizes="(max-width: 720px) 190vw, 100vw"
            loading="eager"
          />
        </div>
      )}

      <Facts sections={shortSections(sections)} />

      <p className="studio-sheet__more">
        <a
          className="chip"
          href="/information/"
          data-label="Alle Informationen"
        >
          Alle Informationen
        </a>
      </p>

      {rest.length > 0 && (
        <div className="studio-sheet__photos">
          {rest.map((image, i) => (
            <LightboxThumb
              key={image.src}
              image={image}
              label={`Bild ${i + 2} von ${total} öffnen`}
              sizes={
                i < 2
                  ? "(max-width: 700px) 100vw, 50vw"
                  : "(max-width: 700px) 50vw, 34vw"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
