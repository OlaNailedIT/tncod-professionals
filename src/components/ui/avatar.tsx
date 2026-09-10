"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Basic avatar primitive (Phase 5.5).
 * No upload, storage, or identity workflows.
 */
const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-foreground",
  {
    variants: {
      size: {
        sm: "size-8 text-caption",
        md: "size-10 text-label",
        lg: "size-12 text-body",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type AvatarProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof avatarVariants> & {
    src?: string | null;
    alt?: string;
    fallback: string;
  };

export function Avatar({ className, size, src, alt = "", fallback, ...props }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(src) && !failed;
  const initials = fallback.trim().slice(0, 2).toUpperCase() || "?";
  const label = alt.trim() || fallback.trim() || "Avatar";

  return (
    <span
      className={cn(avatarVariants({ size }), className)}
      role="img"
      aria-label={label}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- primitive; no product CDN/upload yet
        <img src={src!} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true" className="font-medium">
          {initials}
        </span>
      )}
    </span>
  );
}

export { avatarVariants };
