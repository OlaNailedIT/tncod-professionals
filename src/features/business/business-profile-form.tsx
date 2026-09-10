"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusinessProfessionalRelationship } from "@prisma/client";
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
import {
  businessProfileSchema,
  type BusinessProfileValues,
} from "@/features/business/business-schema";
import { createBusinessAction, updateBusinessAction } from "@/features/business/actions";

type FormValues = BusinessProfileValues;

const RELATIONSHIPS = Object.values(BusinessProfessionalRelationship);

export function BusinessProfileForm({
  mode,
  businessId,
  industries,
  defaults,
}: {
  mode: "create" | "edit";
  businessId?: string;
  industries: Array<{ id: string; name: string }>;
  defaults?: {
    name: string;
    industryId: string;
    description: string;
    location: string;
    phone: string;
    email: string;
    websiteUrl: string;
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    servicesOffered: string;
    relationshipType: BusinessProfessionalRelationship;
  };
}) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  /** Prevents native GET submit before client handlers attach. */
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: defaults?.name ?? "",
      industryId: defaults?.industryId || "none",
      description: defaults?.description ?? "",
      location: defaults?.location ?? "",
      phone: defaults?.phone ?? "",
      email: defaults?.email ?? "",
      websiteUrl: defaults?.websiteUrl ?? "",
      socialLinks: {
        linkedin: defaults?.linkedin ?? "",
        twitter: defaults?.twitter ?? "",
        facebook: defaults?.facebook ?? "",
        instagram: defaults?.instagram ?? "",
      },
      servicesOffered: defaults?.servicesOffered ?? "",
      relationshipType: defaults?.relationshipType ?? "OWNER",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setBusy(true);
    setFormError(null);
    try {
      const result =
        mode === "create"
          ? await createBusinessAction(values)
          : await updateBusinessAction(businessId!, values);
      if (!result.ok) {
        setFormError(result.message);
        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            setError(key as keyof FormValues, { message: messages?.[0] });
          }
        }
        return;
      }
      router.push(`/businesses/${result.businessId}`);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {formError ? (
        <Alert intent="danger" title="Could not save">
          {formError}
        </Alert>
      ) : null}

      <FormSection
        title="Business information"
        description="Tell us about the business you own, operate, or represent."
      >
        <Field label="Business name" required error={errors.name?.message}>
          <Input {...register("name")} autoComplete="organization" />
        </Field>
        <Field
          label="Category"
          description="Uses the shared industry catalogue (business category)."
          error={errors.industryId?.message}
        >
          <Controller
            name="industryId"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                value={field.value ?? "none"}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <option value="none">Not set</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>
        <Field label="Description" error={errors.description?.message}>
          <Textarea {...register("description")} rows={4} />
        </Field>
        <Field label="Location" error={errors.location?.message}>
          <Input {...register("location")} autoComplete="address-level2" />
        </Field>
        {mode === "create" ? (
          <Field
            label="Your relationship"
            description="How you are associated with this business. Not a platform privilege."
            error={errors.relationshipType?.message}
          >
            <Controller
              name="relationshipType"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              )}
            />
          </Field>
        ) : null}
      </FormSection>

      <FormSection title="Contact & online presence">
        <Field label="Business phone" error={errors.phone?.message}>
          <Input {...register("phone")} inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="Business email" error={errors.email?.message}>
          <Input {...register("email")} type="email" autoComplete="email" />
        </Field>
        <Field label="Website" error={errors.websiteUrl?.message}>
          <Input {...register("websiteUrl")} inputMode="url" placeholder="https://" />
        </Field>
        <Field label="LinkedIn" error={errors.socialLinks?.linkedin?.message}>
          <Input {...register("socialLinks.linkedin")} inputMode="url" placeholder="https://" />
        </Field>
        <Field label="X / Twitter" error={errors.socialLinks?.twitter?.message}>
          <Input {...register("socialLinks.twitter")} inputMode="url" placeholder="https://" />
        </Field>
        <Field label="Facebook" error={errors.socialLinks?.facebook?.message}>
          <Input {...register("socialLinks.facebook")} inputMode="url" placeholder="https://" />
        </Field>
        <Field label="Instagram" error={errors.socialLinks?.instagram?.message}>
          <Input {...register("socialLinks.instagram")} inputMode="url" placeholder="https://" />
        </Field>
      </FormSection>

      <FormSection
        title="Services"
        description="Business services (separate from your personal professional services)."
      >
        <Field
          label="Services offered"
          description="Comma-separated list."
          error={errors.servicesOffered?.message}
        >
          <Textarea {...register("servicesOffered")} rows={3} placeholder="Consulting, Training" />
        </Field>
      </FormSection>

      <FormActions>
        <Button type="submit" disabled={!hydrated || busy}>
          {busy ? "Saving…" : mode === "create" ? "Create business" : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
