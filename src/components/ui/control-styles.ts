/** Shared control chrome — Phase 5.2 tokens + Phase 5.7 forms. */
export const controlClassName = [
  "flex w-full min-w-0 rounded-md border border-input bg-surface px-3 text-body-sm text-foreground",
  "transition-colors placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "read-only:bg-surface-muted",
  "aria-invalid:border-danger",
].join(" ");
