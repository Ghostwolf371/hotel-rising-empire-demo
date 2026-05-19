"use client";

import { useState } from "react";

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
  /**
   * Accepted for API parity with the previous `next/image`-based component.
   * The browser uses the natural URL dimensions instead, so this is ignored.
   */
  sizes?: string;
  width?: number;
  height?: number;
};

/**
 * Renders catalog product art with a plain `<img>` instead of `next/image`.
 *
 * Why no next/image?
 * - Uploaded product images are base64 data URLs — next/image can't optimize
 *   those (the URL *is* the payload), so it falls back to a plain img anyway.
 * - Seed catalog images are Unsplash URLs that already include `?w=400&h=300`
 *   sizing params, so the Vercel optimizer adds no benefit.
 * - The optimizer adds an `/_next/image?url=…` indirection that the PWA
 *   service worker caches; if the optimizer ever fails / returns an empty
 *   response, the tablet PWA can get stuck rendering nothing. Using the
 *   direct external URL means a broken cache entry just retries against
 *   Unsplash on the next request.
 *
 * On image load failure we show an inline SVG placeholder so cards never
 * render as an empty box.
 */
export function ProductThumb({
  src,
  alt,
  fill,
  className = "",
  width = 400,
  height = 300,
}: ProductThumbProps) {
  const [failed, setFailed] = useState(false);

  if (!src) return <ProductImageFallback fill={fill} className={className} />;
  if (failed) return <ProductImageFallback fill={fill} className={className} />;

  const isData = isProductDataImageUrl(src);
  // External (https/http) URL → use directly. Internal path → use directly too.
  // No next/image; see the doc comment above.

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        draggable={false}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
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
      loading={isData ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function ProductImageFallback({
  fill,
  className,
}: {
  fill?: boolean;
  className: string;
}) {
  const positioning = fill
    ? `absolute inset-0 h-full w-full ${className}`
    : `h-full w-full ${className}`;
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center bg-[var(--surface)] text-[var(--muted)] ${positioning}`}
    >
      <svg
        className="h-1/3 w-1/3 max-h-12 max-w-12 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}
