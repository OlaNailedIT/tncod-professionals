import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import type { DirectorySelfStatus } from "./self-status";

export function DirectorySelfStatusNote({ status }: { status: DirectorySelfStatus | null }) {
  if (!status) return null;
  return (
    <Alert title={status.title} intent="info" aria-label="Your directory listing">
      <p>{status.body}</p>
      <Link href={status.href} className="mt-2 inline-block underline underline-offset-2">
        {status.linkLabel}
      </Link>
    </Alert>
  );
}
