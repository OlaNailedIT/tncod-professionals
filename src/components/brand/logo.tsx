import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** Accessible label for the image */
  alt?: string;
  priority?: boolean;
};

/**
 * Official TNCOD logo — do not recolour, redraw, or substitute.
 * Asset: public/brand/tncod-logo.jpg
 */
export function BrandLogo({
  className,
  alt = "Triumphant Nation City of David",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/brand/tncod-logo.jpg"
      alt={alt}
      width={640}
      height={240}
      priority={priority}
      className={cn("h-auto w-full max-w-xs object-contain", className)}
    />
  );
}
