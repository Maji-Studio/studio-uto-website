import type { CSSProperties } from "react";

import type { StaticImage } from "@/lib/static-images";

interface Props {
  image: StaticImage;
  sizes?: string;
  className?: string;
  loading?: "eager" | "lazy";
  alt?: string;
  style?: CSSProperties;
}

/**
 * A bundled decorative image: a plain `<img>` over the WebP derivatives that
 * scripts/optimize-static-images.ts wrote to public/img.
 */
export default function StaticImg({
  image,
  sizes,
  className,
  loading,
  alt = "",
  style,
}: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- optimized ahead of time
    <img
      className={className}
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={loading}
      decoding="async"
      style={style}
    />
  );
}
