import { redirect } from "next/navigation";

/**
 * Historical IA route. Canonical MVP registration is `/join`.
 * Compatibility redirect — not a second registration implementation.
 */
export default function RegisterRedirectPage() {
  redirect("/join");
}
