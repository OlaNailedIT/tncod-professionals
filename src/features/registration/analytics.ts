import "server-only";

import { logger } from "@/lib/logger";
import type {
  RegistrationAnalyticsEvent,
  RegistrationAnalyticsProps,
} from "./analytics-types";

export type { RegistrationAnalyticsEvent, RegistrationAnalyticsProps };

/**
 * Registration analytics — non-PII properties only.
 * Failures must never break registration.
 */
export function trackRegistrationEvent(
  event: RegistrationAnalyticsEvent,
  props: RegistrationAnalyticsProps = {},
): void {
  try {
    logger.info(`analytics:${event}`, {
      event,
      ...props,
    });
  } catch {
    // Swallow — analytics must not break registration.
  }
}
