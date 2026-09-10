export type RegistrationAnalyticsEvent =
  | "registration_started"
  | "registration_step_viewed"
  | "registration_submitted"
  | "registration_validation_failed"
  | "registration_duplicate_detected"
  | "registration_auth_started"
  | "registration_completed"
  | "registration_failed";

export type RegistrationAnalyticsProps = {
  step?: string;
  result?: string;
  error_category?: string;
  device_class?: string;
  duration_ms?: number;
};
