import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** Accessible label for the image */
  alt?: string;
  priority?: boolean;
};

/**
 * Parent church logo — attribution only, not primary product chrome.
 * Preserve the owner-supplied artwork; use ProfessionalsLogo for the product.
 * Asset: public/brand/tncod-logo.jpg
 */
export function ParentBrandLogo({
  className,
  alt = "Triumphant Nation City of David",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/brand/tncod-logo.jpg"
      alt={alt}
      width={194}
      height={148}
      priority={priority}
      className={cn("h-auto w-full max-w-xs object-contain", className)}
    />
  );
}

/** Compatibility for existing design-system specimens; still the parent mark. */
export const BrandLogo = ParentBrandLogo;
