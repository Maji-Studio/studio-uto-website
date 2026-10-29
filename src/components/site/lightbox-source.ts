import { getImageProps } from "next/image";

import type { ContentImage } from "@/lib/content/types";

// The full-size renditions the viewer chooses from. Next only optimises to the
// widths in its configured size list, so these stand in for Astro's
// 1280 / 1920 / 2560.
const WIDTHS = [1200, 1920, 3840];
const FALLBACK_WIDTH = 1920;

/**
 * The large rendition(s) of an image for the Lightbox, handed to the viewer as
 * `data-src` / `data-srcset` on each thumbnail button.
 */
export function lightboxSource(image: ContentImage): {
  src: string;
  srcSet: string;
} {
  const { props } = getImageProps({
    src: image.src,
    width: image.width,
    height: image.height,
    alt: image.alt,
    sizes: "100vw",
  });
  const entries = (props.srcSet ?? "").split(", ");
  const keep = entries.filter((entry) =>
    WIDTHS.some((w) => entry.endsWith(` ${w}w`)),
  );
  const fallback =
    keep.find((entry) => entry.endsWith(` ${FALLBACK_WIDTH}w`)) ??
    keep[keep.length - 1] ??
    props.src;
  return {
    src: fallback.replace(/ \d+w$/, ""),
    srcSet: keep.join(", "),
  };
}
