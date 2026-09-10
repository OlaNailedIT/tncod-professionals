import type { Metadata } from "next";
import type { ReactNode } from "react";
import { inter } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "TNCOD Professionals",
  description:
    "TNCOD Professionals — identify, understand, connect and activate professional capacity in the TNCOD community.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-body text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
