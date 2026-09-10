import Link from "next/link";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { Button } from "@/components/ui";

export default function ProfessionalsNotFound() {
  return (
    <ProductPublicShell pathname="/professionals">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Professional unavailable</h1>
        <p className="text-sm text-muted-foreground">
          This profile is not available in the directory. It may be unpublished, not verified, or
          the link may be incorrect.
        </p>
        <div>
          <Button asChild>
            <Link href="/professionals">Back to directory</Link>
          </Button>
        </div>
      </div>
    </ProductPublicShell>
  );
}
