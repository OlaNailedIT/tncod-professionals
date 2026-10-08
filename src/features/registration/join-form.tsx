"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Container, Section, Stack } from "@/components/layout";
import {
  Alert,
  Button,
  Field,
  FormActions,
  FormSection,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { submitRegistrationAction } from "@/features/registration/actions";
import {
  PROFESSIONAL_SITUATIONS,
  registrationSchema,
  type RegistrationInput,
} from "@/features/registration/schema";
import { trackRegistrationEvent } from "@/features/registration/analytics-client";
import { TurnstileWidget } from "@/features/registration/turnstile-widget";

type FormValues = RegistrationInput;

export function JoinRegistrationForm() {
  const router = useRouter();
  const openedAt = React.useRef(Date.now());
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [captchaResetKey, setCaptchaResetKey] = React.useState(0);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      professionalSituation: undefined,
      profession: "",
      organisation: "",
      lookingFor: "",
      offering: "",
      website: "",
      captchaToken: "",
    },
  });

  React.useEffect(() => {
    trackRegistrationEvent("registration_step_viewed", { step: "join" });
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await submitRegistrationAction({
        ...values,
        clientDurationMs: Date.now() - openedAt.current,
      });

      if (!result.ok) {
        setValue("captchaToken", "", { shouldValidate: false });
        setCaptchaResetKey((key) => key + 1);
        if (result.fieldErrors) {
          for (const [key, message] of Object.entries(result.fieldErrors)) {
            setError(key as keyof FormValues, { message });
          }
        }
        setFormError(result.message);
        return;
      }

      if (result.userId === "spam") {
        // Honeypot path — quiet exit
        router.push("/join/success");
        return;
      }

      router.push("/join/success");
    } catch {
      setValue("captchaToken", "", { shouldValidate: false });
      setCaptchaResetKey((key) => key + 1);
      setFormError("We could not complete registration right now. Please try again shortly.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Container width="narrow" className="py-10 sm:py-12">
      <Section density="member">
        <Stack gap="comfortable">
          <div>
            <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
              About a minute · welcome
            </p>
            <h1 className="mt-1 text-h1 text-foreground">Join the Professionals community</h1>
            <p className="mt-2 layout-prose text-body-sm text-muted-foreground">
              Tell us a little about yourself so we can welcome you. No password. Joining does not
              verify you or list you in the public directory.
            </p>
          </div>

          {formError ? (
            <Alert intent="danger" title="Could not finish registration">
              {formError}
            </Alert>
          ) : null}

          <form onSubmit={onSubmit} noValidate className="min-w-0">
            {/* Honeypot — non-autofill name; excluded from a11y tree and tab order */}
            <div className="hidden" hidden aria-hidden="true">
              <label htmlFor="tncod_hp_website">Company website</label>
              <input
                id="tncod_hp_website"
                type="text"
                tabIndex={-1}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                {...register("website")}
              />
            </div>

            <FormSection title="Tell us about yourself" description="Only what we need to welcome you.">
              <Field label="Full name" required error={errors.fullName?.message}>
                <Input autoComplete="name" {...register("fullName")} />
              </Field>
              <Field
                label="Phone / WhatsApp"
                required
                description="We use this to reach you in the community — not for public listing."
                error={errors.phone?.message}
              >
                <Input type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} />
              </Field>
              <Field label="Email" required error={errors.email?.message}>
                <Input type="email" autoComplete="email" {...register("email")} />
              </Field>
              <Field label="Professional status" required error={errors.professionalSituation?.message}>
                <Select {...register("professionalSituation")} defaultValue="">
                  <option value="" disabled>
                    Select one
                  </option>
                  {PROFESSIONAL_SITUATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="What do you do professionally?"
                required
                description="Your profession or primary expertise."
                error={errors.profession?.message}
              >
                <Input autoComplete="organization-title" {...register("profession")} />
              </Field>
              <Field
                label="Company, organisation or business"
                optional
                description="Leave blank if this does not apply."
                error={errors.organisation?.message}
              >
                <Input autoComplete="organization" {...register("organisation")} />
              </Field>
              <Field
                label="What are you looking for?"
                required
                description="Connections, opportunities, clients, mentorship — keep it short."
                error={errors.lookingFor?.message}
              >
                <Textarea rows={3} {...register("lookingFor")} />
              </Field>
              <Field
                label="What can you offer?"
                required
                description="How you can contribute — skills, services, referrals, collaboration."
                error={errors.offering?.message}
              >
                <Textarea rows={3} {...register("offering")} />
              </Field>
              <input type="hidden" {...register("captchaToken")} />
              <TurnstileWidget
                key={captchaResetKey}
                onToken={(token) => {
                  setValue("captchaToken", token, { shouldValidate: true });
                  if (!token) {
                    setError("captchaToken", { message: "Complete the security check." });
                  }
                }}
              />
              {errors.captchaToken?.message ? (
                <p className="text-body-sm text-danger" role="alert">
                  {errors.captchaToken.message}
                </p>
              ) : null}
              <FormActions>
                <Button type="submit" loading={submitting} className="min-h-11 w-full sm:w-auto">
                  Join the community
                </Button>
              </FormActions>
            </FormSection>
          </form>
        </Stack>
      </Section>
    </Container>
  );
}
