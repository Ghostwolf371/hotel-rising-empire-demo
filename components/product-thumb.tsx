"use client";

import Image from "next/image";

/** Max decoded file size before base64 (keeps localStorage usable). */
export const MAX_PRODUCT_IMAGE_FILE_BYTES = 1024 * 1024;

export function isProductDataImageUrl(src: string): boolean {
  return /^data:image\//i.test(src);
}

type ProductThumbProps = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
};

/**
 * Renders catalog product art: remote URLs via next/image, uploaded data URLs via native img.
 */
export function ProductThumb({
  src,
  alt,
  fill,
  className = "",
  sizes,
  width = 400,
  height = 300,
}: ProductThumbProps) {
  if (!src) return null;

  if (isProductDataImageUrl(src)) {
    // next/image cannot route base64 data URLs through the image optimizer
    // (the URL is the payload), so we render uploaded thumbnails with a
    // plain <img>. Disabling the rule once locally is the documented escape.
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
          draggable={false}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        draggable={false}
      />
    );
  }

  if (fill) {
    return <Image src={src} alt={alt} fill className={className} sizes={sizes} />;
  }
  return <Image src={src} alt={alt} width={width} height={height} className={className} />;
}
