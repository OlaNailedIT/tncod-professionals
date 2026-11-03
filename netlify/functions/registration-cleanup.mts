import { runScheduledRegistrationCleanup } from "../../src/lib/maintenance/netlify-registration-cleanup";
import type { NetlifyMaintenanceContext } from "../../src/lib/maintenance/netlify-registration-cleanup";

export default async function registrationCleanup(_request: Request, context: NetlifyMaintenanceContext): Promise<void> {
  await runScheduledRegistrationCleanup(context, process.env.CRON_SECRET);
}
