import type { Metadata } from "next";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { JoinRegistrationForm } from "@/features/registration/join-form";

export const metadata: Metadata = {
  title: "Join — TNCOD Professionals",
  description: "Quick registration for TNCOD Professionals. No password required.",
  robots: { index: true, follow: true },
};

export default function JoinPage() {
  return (
    <ProductPublicShell pathname="/join">
      <JoinRegistrationForm />
    </ProductPublicShell>
  );
}
