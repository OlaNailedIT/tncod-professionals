import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { MetadataGroup, MetadataItem, StatusBadge, Surface } from "@/components/ui";
import { getDirectoryProfessionalBySlug } from "@/features/directory/list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Professional — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default async function ProfessionalPublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getDirectoryProfessionalBySlug(decodeURIComponent(slug));
  if (!record) {
    notFound();
  }

  return (
    <ProductPublicShell pathname="/professionals">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <p className="text-sm text-muted-foreground">
          <Link href="/professionals" className="underline-offset-2 hover:underline">
            Professionals Directory
          </Link>
        </p>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{record.displayName}</h1>
            {record.headline ? (
              <p className="mt-1 text-sm text-muted-foreground">{record.headline}</p>
            ) : null}
          </div>
          <StatusBadge intent="success" aria-label="Verified professional">
            Verified
          </StatusBadge>
        </div>

        <Surface className="p-4">
          <h2 className="text-lg font-medium">Professional information</h2>
          <div className="mt-3">
            <MetadataGroup>
              <MetadataItem label="Profession">{record.profession ?? "—"}</MetadataItem>
              <MetadataItem label="Professional title">
                {record.professionalTitle ?? "—"}
              </MetadataItem>
              <MetadataItem label="Industry">{record.industryName ?? "—"}</MetadataItem>
              <MetadataItem label="Location">{record.location ?? "—"}</MetadataItem>
            </MetadataGroup>
          </div>
        </Surface>

        <Surface className="p-4">
          <h2 className="text-lg font-medium">Skills</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {record.skillNames.length ? record.skillNames.join(", ") : "—"}
          </p>
        </Surface>

        <Surface className="p-4">
          <h2 className="text-lg font-medium">Services</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {record.serviceNames.length ? record.serviceNames.join(", ") : "—"}
          </p>
        </Surface>

        <p className="text-caption text-muted-foreground">
          This page shows the public directory projection only. Contact details, documents, and
          private profile fields are not available here.
        </p>
      </div>
    </ProductPublicShell>
  );
}
