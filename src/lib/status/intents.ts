/**
 * Semantic presentation intents for status (Phase 5.6).
 * Maps to existing design tokens — not raw colour choices.
 */
export type StatusIntent = "neutral" | "info" | "success" | "warning" | "danger";

export type StatusPresentation = {
  intent: StatusIntent;
  /** User-facing label — meaning must not rely on colour alone. */
  label: string;
};
