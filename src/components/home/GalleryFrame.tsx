import LightboxThumb from "@/components/impressionen/LightboxThumb";
import type { ContentImage } from "@/lib/content/types";

import GalleryTourScript from "./GalleryFrame.client";
import "./GalleryFrame.css";

/*
 * Homepage hero. The frame is also a Lightbox gallery: the visible image is the
 * first slide and the rest of the studio photos ride along hidden, so "Take a
 * tour" (or a click on the image) opens the full walk-through from the hero.
 * Without JS the tour link falls back to the Grundriss section and its photos.
 */
export default function GalleryFrame({ photos }: { photos: ContentImage[] }) {
  const [hero, ...rest] = photos;
  const total = photos.length;

  return (
    <figure className="gallery" data-lightbox-gallery data-name="Studio Uto">
      <LightboxThumb
        image={hero}
        label={`Studio-Rundgang öffnen (${total} Bilder)`}
        sizes="(max-width: 900px) 92vw, 65vw"
        loading="eager"
      />
      {rest.map((image, i) => (
        <LightboxThumb
          key={image.src}
          image={image}
          label={`Bild ${i + 2} von ${total} öffnen`}
          hidden
        />
      ))}

      <figcaption className="gallery__caption">
        <a
          className="gallery__tour chip"
          href="/information/#grundriss"
          data-label="Take a tour"
          data-tour
        >
          Take a tour
        </a>
      </figcaption>

      <span className="gallery__reframe" aria-hidden="true">
        <svg
          viewBox="0 0 44 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 2 L2 12 M2 2 L12 2"></path>
          <path d="M42 2 L42 12 M42 2 L32 2"></path>
        </svg>
      </span>
      <GalleryTourScript />
    </figure>
  );
}
