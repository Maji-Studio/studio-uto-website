import ContentImg from "@/components/site/ContentImg";
import { lightboxSource } from "@/components/site/lightbox-source";
import type { Impression } from "@/lib/content/types";

import "./EntityRow.css";

export default function EntityRow({ entity }: { entity: Impression }) {
  // Used when an image carries no alt text.
  const fallbackAlt = `Arbeit von ${entity.name}${
    entity.client ? ` für ${entity.client}` : ""
  }.`;

  return (
    <article
      className="entity"
      data-lightbox-gallery
      data-name={entity.name}
      data-client={entity.client}
    >
      <header className="entity__meta">
        {/* The rule stays on the page; only the title lifts into the lightbox
            header, so the rule is kept out of the morphing element. */}
        <span className="entity__rule" aria-hidden="true"></span>
        <div className="entity__title" data-lightbox-title>
          <h2 className="entity__name">{entity.name}</h2>
          {entity.client && (
            <p className="entity__client">for {entity.client}</p>
          )}
        </div>
      </header>

      <ul className="entity__grid" role="list">
        {entity.images.map((image, i) => {
          // Large renditions for the full-screen viewer (Lightbox), handed over
          // through data attributes on each thumbnail button.
          const full = lightboxSource(image);
          const alt = image.alt || fallbackAlt;
          return (
            <li className="entity__cell" key={`${image.src}-${i}`}>
              <button
                className="entity__open"
                type="button"
                data-lightbox-open
                data-src={full.src}
                data-srcset={full.srcSet}
                data-width={image.width}
                data-height={image.height}
                data-alt={alt}
                aria-label={`Bild ${i + 1} von ${entity.images.length} öffnen`}
              >
                <ContentImg
                  className="entity__image"
                  image={image}
                  alt={alt}
                  sizes="(max-width: 720px) 30vw, 18vw"
                  loading="lazy"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
