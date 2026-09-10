"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { updateOwnProfileAction } from "@/features/profile/actions";
import {
  PROFESSIONAL_SITUATIONS,
  type ProfessionalSituation,
} from "@/features/registration/schema";
import {
  preferenceToFormValue,
  profileEditSchema,
  type ProfileEditValues,
} from "@/features/profile/profile-edit-schema";
import type { OpportunityPreferences } from "@/features/profile/completion";

type FormValues = ProfileEditValues;

function PreferenceSelect({
  label,
  error,
  name,
  control,
}: {
  label: string;
  error?: string;
  name: "collaboration" | "mentorship" | "referrals" | "training";
  control: ReturnType<typeof useForm<FormValues>>["control"];
}) {
  return (
    <Field label={label} description="Yes or No both count as answered." error={error}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            name={field.name}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            ref={field.ref}
            onChange={(event) => field.onChange(event.target.value)}
          >
            <option value="">Not set</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
        )}
      />
    </Field>
  );
}

export function ProfileEditForm({
  defaults,
  industries,
}: {
  defaults: {
    displayName: string;
    phone: string;
    location: string;
    bio: string;
    professionalSituation: string;
    profession: string;
    organisation: string;
    industryId: string;
    yearsExperience: string;
    skills: string;
    services: string;
    linkedinUrl: string;
    serviceArea: string;
    lookingFor: string;
    offering: string;
    opportunityPreferences: OpportunityPreferences;
    businessApplicable: boolean;
    businessSummary: string | null;
  };
  industries: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const situationDefault = PROFESSIONAL_SITUATIONS.includes(
    defaults.professionalSituation as ProfessionalSituation,
  )
    ? (defaults.professionalSituation as ProfessionalSituation)
    : undefined;

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayName: defaults.displayName,
      phone: defaults.phone,
      location: defaults.location || undefined,
      bio: defaults.bio || undefined,
      professionalSituation: situationDefault,
      profession: defaults.profession,
      organisation: defaults.organisation || undefined,
      industryId: defaults.industryId || "none",
      yearsExperience: defaults.yearsExperience || "",
      skills: defaults.skills || undefined,
      services: defaults.services || undefined,
      linkedinUrl: defaults.linkedinUrl || "",
      serviceArea: defaults.serviceArea || undefined,
      lookingFor: defaults.lookingFor,
      offering: defaults.offering,
      collaboration: preferenceToFormValue(defaults.opportunityPreferences.collaboration),
      mentorship: preferenceToFormValue(defaults.opportunityPreferences.mentorship),
      referrals: preferenceToFormValue(defaults.opportunityPreferences.referrals),
      training: preferenceToFormValue(defaults.opportunityPreferences.training),
    },
  });

  async function onSubmit(values: FormValues) {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      const result = await updateOwnProfileAction(values);
      if (!result.ok) {
        setFormError(result.message);
        if (result.fieldErrors) {
          for (const [key, message] of Object.entries(result.fieldErrors)) {
            setError(key as keyof FormValues, { message });
          }
        }
        return;
      }
      router.push("/profile");
      router.refresh();
    } catch {
      setFormError("We could not save your changes. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {formError ? (
        <Alert intent="danger" title="Could not save">
          {formError}
        </Alert>
      ) : null}

      <FormSection
        title="About you"
        description="Help others recognise you. Preferred name can match your full name."
      >
        <Field label="Preferred name" required error={errors.displayName?.message}>
          <Input {...register("displayName")} autoComplete="nickname" />
        </Field>
        <Field label="Phone / WhatsApp" required error={errors.phone?.message}>
          <Input type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
        <Field
          label="Location"
          description="City or region is enough — no residential address needed."
          error={errors.location?.message}
        >
          <Input {...register("location")} autoComplete="address-level2" />
        </Field>
        <Field
          label="Bio"
          description="A short professional or community introduction (up to 800 characters)."
          error={errors.bio?.message}
        >
          <Textarea rows={4} {...register("bio")} />
        </Field>
        <p className="text-caption text-muted-foreground">
          Headshot upload is not available in this step. Private storage exists, but signed upload/view helpers are not
          implemented yet — headshot is not counted in your completion percentage.
        </p>
      </FormSection>

      <FormSection title="Professional" description="What you do and how people can understand your work.">
        <Field label="Professional status" required error={errors.professionalSituation?.message}>
          <Select {...register("professionalSituation")}>
            <option value="">Select…</option>
            {PROFESSIONAL_SITUATIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Profession" required error={errors.profession?.message}>
          <Input {...register("profession")} />
        </Field>
        <Field
          label="Industry"
          description="Your field of work — distinct from your employer or organisation name."
          error={errors.industryId?.message}
        >
          <Controller
            name="industryId"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                value={field.value && field.value !== "__none__" ? field.value : "none"}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(event) => field.onChange(event.target.value)}
              >
                <option value="none">No industry selected</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>
        <Field
          label="Organisation / workplace"
          description="Optional. Not used as a substitute for Industry."
          error={errors.organisation?.message}
        >
          <Input {...register("organisation")} />
        </Field>
        <Field label="Years of experience" error={errors.yearsExperience?.message}>
          <Input type="number" min={0} max={70} inputMode="numeric" {...register("yearsExperience")} />
        </Field>
        <Field
          label="Skills"
          description="Comma-separated list (for example: Leadership, Design, Teaching)."
          error={errors.skills?.message}
        >
          <Input {...register("skills")} />
        </Field>
        <Field
          label="Services"
          description="Comma-separated list of services you provide."
          error={errors.services?.message}
        >
          <Input {...register("services")} />
        </Field>
        <Field
          label="LinkedIn"
          description="A valid LinkedIn URL is accepted as a link, not as verification."
          error={errors.linkedinUrl?.message}
        >
          <Input type="url" placeholder="https://www.linkedin.com/in/…" {...register("linkedinUrl")} />
        </Field>
      </FormSection>

      <FormSection
        title="Community"
        description="Optional TNCOD community context. Leave blank if it does not apply."
      >
        <Field
          label="Areas of service"
          description="Phase 2 stores one community field (service area). A separate service/department column is not in the schema."
          error={errors.serviceArea?.message}
        >
          <Input {...register("serviceArea")} />
        </Field>
      </FormSection>

      <FormSection title="Opportunities" description="Your intentions — not a marketplace posting.">
        <Field label="Seeking" required error={errors.lookingFor?.message}>
          <Textarea rows={3} {...register("lookingFor")} />
        </Field>
        <Field label="Offering" required error={errors.offering?.message}>
          <Textarea rows={3} {...register("offering")} />
        </Field>
        <PreferenceSelect label="Collaboration" error={errors.collaboration?.message} name="collaboration" control={control} />
        <PreferenceSelect label="Mentorship" error={errors.mentorship?.message} name="mentorship" control={control} />
        <PreferenceSelect label="Referrals" error={errors.referrals?.message} name="referrals" control={control} />
        <PreferenceSelect label="Training" error={errors.training?.message} name="training" control={control} />
      </FormSection>

      {defaults.businessApplicable ? (
        <FormSection
          title="Business"
          description="Shown because your situation or linked businesses indicate a business relationship."
        >
          <p className="text-body-sm text-foreground">
            {defaults.businessSummary ??
              "No linked business yet. Linking or managing businesses is outside this profile completion step."}
          </p>
        </FormSection>
      ) : null}

      <FormActions>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => router.push("/profile")}>
          Cancel
        </Button>
      </FormActions>
    </form>
  );
}
