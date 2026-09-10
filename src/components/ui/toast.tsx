"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { StatusIntent } from "@/lib/status";
import { Button } from "./button";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  intent?: StatusIntent;
};

type ToastContextValue = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/**
 * Lightweight toast region (Phase 5.8).
 * For brief non-blocking feedback only — not critical errors or confirmations.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast-${crypto.randomUUID()}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-md border border-border bg-surface p-3 shadow-default",
              toast.intent === "success" && "border-transparent bg-success-muted text-success",
              toast.intent === "danger" && "border-transparent bg-danger-muted text-danger",
              toast.intent === "warning" && "border-transparent bg-warning-muted text-warning",
              toast.intent === "info" && "border-transparent bg-info-muted text-info",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-label text-inherit">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-caption text-inherit opacity-90">{toast.description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => dismiss(toast.id)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
