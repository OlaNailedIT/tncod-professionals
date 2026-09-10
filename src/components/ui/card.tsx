import * as React from "react";
import { cn } from "@/lib/utils";
import { Surface } from "./surface";

/**
 * Semantic content boundary on Surface (Phase 5.5).
 * Not a product card (no ProfileCard / DirectoryCard / etc.).
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Surface
      tone="default"
      bordered
      elevation="subtle"
      className={cn("flex flex-col gap-4 p-5", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-h4 text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 text-body-sm text-foreground", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-auto flex flex-wrap items-center gap-3 pt-1", className)} {...props} />
  );
}
