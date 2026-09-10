"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  /** Ordinary | consequential | destructive — affects default confirm styling guidance. */
  tone?: "default" | "destructive";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  className?: string;
};

/**
 * Native dialog confirmation (Phase 5.8).
 * Focus, Escape, and backdrop close use browser dialog behaviour.
 * No product actions — showcase / future composition only.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  tone = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  className,
}: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open) {
      if (!node.open) node.showModal();
    } else if (node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "m-auto w-[min(100%-2rem,28rem)] rounded-md border border-border bg-surface p-0 text-foreground shadow-raised",
        "backdrop:bg-foreground/40",
        "open:flex open:flex-col",
        className,
      )}
      onClose={() => onOpenChange(false)}
    >
      <div className="flex flex-col gap-3 p-5">
        <h2 id={titleId} className="text-h4 text-foreground">
          {title}
        </h2>
        <div className="text-body-sm text-muted-foreground">{children}</div>
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
