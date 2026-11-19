import LightboxThumb from "@/components/impressionen/LightboxThumb";
import type { ContentImage } from "@/lib/content/types";

import "./StudioGallery.css";

/** The CMS alt text up to its " — ", without the closing full stop. */
const caption = (alt: string) => alt.split(" — ")[0].replace(/\.$/, "");

/*
 * Homepage gallery. The first studio photo runs edge to edge and fills the
 * rest of the first screen; the others step down the page below it at
 * different sizes and crops, each with its caption chip. Photos in the same
 * row touch; the rows breathe.
 *
 * Every photo is a Lightbox thumb in one gallery, so a click anywhere opens
 * the full walk-through at that photo. The step layout is written for five
 * photos (the Grundriss gallery holds six); a sixth or later one falls in at
 * full width at the end.
 */
export default function StudioGallery({ photos }: { photos: ContentImage[] }) {
  const [hero, ...rest] = photos;
  if (!hero) return null;
  const total = photos.length;

  return (
    <section
      className="studio-gallery"
      aria-label="Bilder vom Studio"
      data-lightbox-gallery
      data-name="Studio Uto"
    >
      <div className="studio-gallery__hero">
        <LightboxThumb
          image={hero}
          label={`Bild 1 von ${total} öffnen`}
          sizes="(max-width: 720px) 190vw, 100vw"
          loading="eager"
        />
      </div>

      {rest.length > 0 && (
        <div className="studio-gallery__steps">
          {rest.map((image, i) => (
            <figure key={image.src} className="studio-gallery__step">
              <LightboxThumb
                image={image}
                label={`Bild ${i + 2} von ${total} öffnen`}
                sizes="(max-width: 720px) 100vw, 70vw"
              />
              <figcaption className="studio-gallery__caption">
                <span className="chip">{caption(image.alt)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
