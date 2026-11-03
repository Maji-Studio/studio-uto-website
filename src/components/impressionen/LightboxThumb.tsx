import ContentImg from "@/components/site/ContentImg";
import { lightboxSource } from "@/components/site/lightbox-source";
import type { ContentImage } from "@/lib/content/types";

import "./LightboxThumb.css";

/*
 * One thumbnail that opens into the page's Lightbox. Place it inside an element
 * marked `data-lightbox-gallery` (with `data-name`, optionally `data-client`);
 * every thumb in that element becomes one slide, in DOM order. The large
 * renditions ride along as data attributes, exactly like EntityRow's buttons.
 *
 * Sizing is left to the parent: target `.lb-thumb` / `.lb-thumb__image` from
 * the parent's stylesheet.
 */
interface Props {
  image: ContentImage;
  /** Accessible name for the button, e.g. "Bild 2 von 6 öffnen". */
  label: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  /** Keep the slide in the gallery but out of view (e.g. the hero's tour). */
  hidden?: boolean;
}

export default function LightboxThumb({
  image,
  label,
  sizes = "(max-width: 720px) 30vw, 16vw",
  loading = "lazy",
  hidden = false,
}: Props) {
  const full = lightboxSource(image);

  return (
    <button
      className="lb-thumb"
      type="button"
      data-lightbox-open
      data-src={full.src}
      data-srcset={full.srcSet}
      data-width={image.width}
      data-height={image.height}
      data-alt={image.alt}
      aria-label={label}
      hidden={hidden}
    >
      <ContentImg
        className="lb-thumb__image"
        image={image}
        sizes={sizes}
        loading={loading}
      />
    </button>
  );
}
