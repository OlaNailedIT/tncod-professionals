"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container, Section, Stack } from "@/components/layout";
import { Alert, Button, Field, FormActions, FormSection, Input } from "@/components/ui";
import {
  requestSignInOtpAction,
  verifySignInOtpAction,
} from "@/features/auth/actions";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .max(254),
});

const codeSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6,8}$/, "Enter the code from your email."),
});

type EmailValues = z.infer<typeof emailSchema>;
type CodeValues = z.infer<typeof codeSchema>;

export function SignInForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [email, setEmail] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  /** Prevents pre-hydration clicks (no-op) and native GET ?email= submits. */
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { token: "" },
  });

  const controlsReady = hydrated && !busy;

  async function onRequestCode(values: EmailValues) {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    setInfoMessage(null);
    try {
      const result = await requestSignInOtpAction({ email: values.email, next: nextPath });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setEmail(values.email.trim().toLowerCase());
      setInfoMessage(
        "If that email can receive a sign-in code, you will get one shortly. Check your inbox and spam folder.",
      );
      setStep("code");
      codeForm.reset({ token: "" });
    } catch {
      setFormError("We could not complete that request. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(values: CodeValues) {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      const result = await verifySignInOtpAction({
        email,
        token: values.token,
        next: nextPath,
      });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.replace(result.next);
      router.refresh();
    } catch {
      setFormError("We could not complete that request. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (busy || !email) return;
    setBusy(true);
    setFormError(null);
    try {
      const result = await requestSignInOtpAction({ email, next: nextPath });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setInfoMessage("If needed, another code was sent. Wait a moment before requesting again.");
    } catch {
      setFormError("We could not complete that request. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container width="narrow" className="py-14">
      <Section density="member">
        <Stack gap="comfortable">
          <div>
            <h1 className="text-h1 text-foreground">Access your TNCOD Professionals profile</h1>
            <p className="mt-3 layout-prose text-body text-muted-foreground">
              Enter the email you used when you joined. We will send a secure sign-in code (and
              usually a link as well) — no password to create or remember.
            </p>
          </div>

          {formError ? (
            <Alert intent="danger" title="Sign-in issue">
              {formError}
            </Alert>
          ) : null}
          {infoMessage ? (
            <Alert intent="info" title="Check your email">
              {infoMessage}
            </Alert>
          ) : null}

          {step === "email" ? (
            <form
              method="post"
              onSubmit={(e) => {
                // Always stop native submit (GET ?email=… remounts the page and drops React state).
                e.preventDefault();
                void emailForm.handleSubmit(onRequestCode)(e);
              }}
              noValidate
            >
              <FormSection title="Sign in" description="We will email you a one-time code.">
                <Field label="Email" required error={emailForm.formState.errors.email?.message}>
                  <Input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    {...emailForm.register("email")}
                  />
                </Field>
                <FormActions>
                  <Button
                    type="button"
                    disabled={!controlsReady}
                    onClick={() => void emailForm.handleSubmit(onRequestCode)()}
                  >
                    {busy ? "Sending…" : "Email me a sign-in code"}
                  </Button>
                </FormActions>
              </FormSection>
            </form>
          ) : (
            <form
              method="post"
              onSubmit={(e) => {
                e.preventDefault();
                void codeForm.handleSubmit(onVerifyCode)(e);
              }}
              noValidate
            >
              <FormSection
                title="Enter your code"
                description={`We sent a code to ${email}. Enter it below to continue.`}
              >
                <Field label="Sign-in code" required error={codeForm.formState.errors.token?.message}>
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    {...codeForm.register("token")}
                  />
                </Field>
                <FormActions>
                  <Button
                    type="button"
                    disabled={!controlsReady}
                    onClick={() => void codeForm.handleSubmit(onVerifyCode)()}
                  >
                    {busy ? "Verifying…" : "Continue"}
                  </Button>
                  <Button type="button" variant="outline" disabled={!controlsReady} onClick={onResend}>
                    Resend code
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!controlsReady}
                    onClick={() => {
                      setStep("email");
                      setFormError(null);
                      setInfoMessage(null);
                    }}
                  >
                    Use a different email
                  </Button>
                </FormActions>
              </FormSection>
            </form>
          )}

          <p className="text-body-sm text-muted-foreground">
            New here?{" "}
            <a className="text-sky underline-offset-2 hover:underline" href="/join">
              Join TNCOD Professionals
            </a>
            .
          </p>
        </Stack>
      </Section>
    </Container>
  );
}
