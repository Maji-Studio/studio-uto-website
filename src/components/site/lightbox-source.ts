import type { ContentImage } from "@/lib/content/types";

/**
 * The large rendition(s) of an image for the Lightbox, handed to the viewer as
 * `data-src` / `data-srcset` on each thumbnail button. The viewer sets
 * `sizes="100vw"` itself. Both come straight from the pre-generated files.
 */
export function lightboxSource(image: ContentImage): {
  src: string;
  srcSet: string;
} {
  return { src: image.src, srcSet: image.srcSet ?? "" };
}
