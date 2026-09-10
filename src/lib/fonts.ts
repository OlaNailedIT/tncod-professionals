import { Inter } from "next/font/google";

/**
 * Phase 5.3 — primary UI typeface.
 * Weights limited to 400 / 500 / 600 / 700.
 * Loaded via Next.js font pipeline (self-hosted at build time).
 */
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
