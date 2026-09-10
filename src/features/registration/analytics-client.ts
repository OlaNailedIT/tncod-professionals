import type {
  RegistrationAnalyticsEvent,
  RegistrationAnalyticsProps,
} from "./analytics-types";

export function trackRegistrationEvent(
  event: RegistrationAnalyticsEvent,
  props: RegistrationAnalyticsProps = {},
): void {
  try {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.info("[analytics]", event, props);
    }
  } catch {
    // ignore
  }
}
