import Image from "next/image";
import type { CSSProperties } from "react";

import type { ContentImage } from "@/lib/content/types";

interface Props {
  image: ContentImage;
  /** Responsive `sizes` hint; Next derives the width candidates from it. */
  sizes?: string;
  className?: string;
  loading?: "eager" | "lazy";
  /** Overrides the image's own alt text ("" for decorative uses). */
  alt?: string;
  style?: CSSProperties;
}

/**
 * A content image through `next/image`: works for bundled files and for remote
 * CMS URLs alike, since the intrinsic size always travels with the image.
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
    <Image
      className={className}
      src={image.src}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      sizes={sizes}
      loading={loading}
      style={focal || style ? { ...focal, ...style } : undefined}
    />
  );
}
