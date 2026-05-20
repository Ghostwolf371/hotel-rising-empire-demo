/**
 * Crossed fork & knife — raster from design reference, tinted via `currentColor`.
 */
export function UtensilsCrossedIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 bg-current ${className ?? "h-6 w-6"}`}
      style={{
        WebkitMaskImage: "url(/icons/utensils-crossed.png)",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
        maskImage: "url(/icons/utensils-crossed.png)",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
      aria-hidden
    />
  );
}
