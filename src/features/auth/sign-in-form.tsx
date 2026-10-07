"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container, Section, Stack } from "@/components/layout";
import { Alert, Button, Field, FormActions, FormSection, Input, Spinner } from "@/components/ui";
import {
  requestSignInOtpAction,
  verifySignInOtpAction,
} from "@/features/auth/actions";
import { maskEmail } from "@/lib/auth/classify-auth-error";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const RESEND_COOLDOWN_MS = 60_000;

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
type Step = "email" | "sending" | "code";

export function SignInForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [resendAvailableAt, setResendAvailableAt] = React.useState(0);
  const [resendSeconds, setResendSeconds] = React.useState(0);
  const codeInputRef = React.useRef<HTMLInputElement | null>(null);
  const autoVerifyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (step !== "code") return;
    const id = window.setTimeout(() => codeInputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [step]);

  React.useEffect(() => {
    if (!resendAvailableAt) {
      setResendSeconds(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
      setResendSeconds(left);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [resendAvailableAt]);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { token: "" },
  });

  const controlsReady = hydrated && !busy;
  const resendReady = controlsReady && resendSeconds === 0;

  function startResendCooldown() {
    setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS);
  }

  async function sendPasswordlessEmail(normalizedEmail: string, emailRedirectTo: string) {
    const supabase = createBrowserSupabaseClient();
    // Browser client writes the PKCE code verifier into this browsing context.
    // Provider errors stay neutral — same outward success path as the server prep.
    await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo,
      },
    });
  }

  async function onRequestCode(values: EmailValues) {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    setInfoMessage(null);
    setStep("sending");
    const normalized = values.email.trim().toLowerCase();
    try {
      const result = await requestSignInOtpAction({ email: normalized, next: nextPath });
      if (!result.ok) {
        // Rate-limited users may still have a prior email with a code — open code entry.
        if (result.errorClass === "rate_limit") {
          setEmail(normalized);
          setStep("code");
          setFormError(result.message);
          codeForm.reset({ token: "" });
          startResendCooldown();
          return;
        }
        setStep("email");
        setFormError(result.message);
        return;
      }
      if (!result.skipSend) {
        await sendPasswordlessEmail(normalized, result.emailRedirectTo);
      }
      setEmail(normalized);
      setInfoMessage(null);
      setStep("code");
      codeForm.reset({ token: "" });
      autoVerifyRef.current = null;
      startResendCooldown();
    } catch {
      setStep("email");
      setFormError("We could not complete that request. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(values: CodeValues) {
    if (busy || !email) return;
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
        autoVerifyRef.current = null;
        return;
      }
      router.replace(result.next);
      router.refresh();
    } catch {
      setFormError("We could not complete that request. Check your connection and try again.");
      autoVerifyRef.current = null;
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (!resendReady || !email) return;
    setBusy(true);
    setFormError(null);
    setInfoMessage(null);
    try {
      const result = await requestSignInOtpAction({ email, next: nextPath });
      startResendCooldown();
      if (!result.ok) {
        setFormError(
          result.errorClass === "rate_limit"
            ? result.message
            : result.message,
        );
        return;
      }
      if (!result.skipSend) {
        await sendPasswordlessEmail(email, result.emailRedirectTo);
      }
      setInfoMessage("If needed, another code was sent. Check your inbox and spam folder.");
      codeForm.reset({ token: "" });
      autoVerifyRef.current = null;
    } catch {
      setFormError("We could not complete that request. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function onUseDifferentEmail() {
    setStep("email");
    setEmail("");
    setFormError(null);
    setInfoMessage(null);
    autoVerifyRef.current = null;
    codeForm.reset({ token: "" });
  }

  const tokenRegister = codeForm.register("token");

  function onTokenChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, "").slice(0, 8);
    codeForm.setValue("token", raw, { shouldValidate: raw.length >= 6 });
    void tokenRegister.onChange({
      ...event,
      target: { ...event.target, value: raw },
    });

    if (/^\d{6,8}$/.test(raw) && autoVerifyRef.current !== raw && !busy) {
      autoVerifyRef.current = raw;
      void onVerifyCode({ token: raw });
    }
  }

  return (
    <Container width="narrow" className="py-12 sm:py-14">
      <Section density="member">
        <Stack gap="comfortable">
          <div>
            <h1 className="text-h1 text-foreground">Sign in</h1>
            <p className="mt-3 layout-prose text-body text-muted-foreground">
              Enter the email you used when you joined. We will send a one-time code — calm, simple,
              no password to remember.
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

          {step === "sending" ? (
            <div className="flex items-center gap-3 text-body text-muted-foreground" role="status">
              <Spinner />
              Sending your sign-in code…
            </div>
          ) : null}

          {step === "email" ? (
            <form
              method="post"
              onSubmit={(e) => {
                e.preventDefault();
                void emailForm.handleSubmit(onRequestCode)(e);
              }}
              noValidate
            >
              <FormSection title="Your email" description="We will email you a sign-in code.">
                <Field label="Email address" required error={emailForm.formState.errors.email?.message}>
                  <Input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoFocus={hydrated}
                    {...emailForm.register("email")}
                  />
                </Field>
                <FormActions>
                  <Button
                    type="submit"
                    disabled={!controlsReady}
                  >
                    Send sign-in code
                  </Button>
                </FormActions>
              </FormSection>
            </form>
          ) : null}

          {step === "code" ? (
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
                description={`We sent a sign-in code to ${maskEmail(email)}. Enter it below to continue.`}
              >
                <Field
                  label="Sign-in code"
                  required
                  error={codeForm.formState.errors.token?.message}
                >
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={8}
                    spellCheck={false}
                    aria-describedby="sign-in-code-hint"
                    className="tracking-[0.35em] text-center text-lg font-medium"
                    {...tokenRegister}
                    ref={(el) => {
                      tokenRegister.ref(el);
                      codeInputRef.current = el;
                    }}
                    onChange={onTokenChange}
                  />
                </Field>
                <p id="sign-in-code-hint" className="text-body-sm text-muted-foreground">
                  Paste the full code from your email, or type it here.
                </p>
                <FormActions>
                  <Button type="submit" disabled={!controlsReady}>
                    {busy ? "Verifying…" : "Continue"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!resendReady}
                    onClick={() => void onResend()}
                  >
                    {resendSeconds > 0 ? `Resend code (${resendSeconds}s)` : "Resend code"}
                  </Button>
                  <Button type="button" variant="ghost" disabled={!controlsReady} onClick={onUseDifferentEmail}>
                    Use a different email
                  </Button>
                </FormActions>
              </FormSection>
            </form>
          ) : null}

          <p className="text-body-sm text-muted-foreground">
            New here?{" "}
            <a className="text-sky underline-offset-2 hover:underline" href="/join">
              Join the Professionals community
            </a>
            .
          </p>
        </Stack>
      </Section>
    </Container>
  );
}
