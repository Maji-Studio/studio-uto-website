import type { CSSProperties } from "react";

import type { ContentImage } from "@/lib/content/types";

interface Props {
  image: ContentImage;
  /** Responsive `sizes` hint; the browser picks from the image's `srcSet`. */
  sizes?: string;
  className?: string;
  loading?: "eager" | "lazy";
  /** Overrides the image's own alt text ("" for decorative uses). */
  alt?: string;
  style?: CSSProperties;
}

/**
 * A content image as a plain `<img>`: the files were resized and converted
 * once, on upload, and `srcSet` lists them (absent: just `src`). The intrinsic
 * size always travels with the image so the layout never jumps.
 */
export default function ContentImg({
  image,
  sizes,
  className,
  loading,
  alt,
  style,
}: Props) {
  const focal = image.objectPosition
    ? { objectPosition: image.objectPosition }
    : undefined;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- optimized ahead of time
    <img
      className={className}
      src={image.src}
      srcSet={image.srcSet || undefined}
      sizes={image.srcSet ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      loading={loading}
      decoding="async"
      style={focal || style ? { ...focal, ...style } : undefined}
    />
  );
}
