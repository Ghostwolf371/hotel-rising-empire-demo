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
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
          draggable={false}
        />
      );
    }
    return (
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
