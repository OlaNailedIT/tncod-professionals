"use client";

import { Section, Stack } from "@/components/layout";
import {
  Button,
  Checkbox,
  Field,
  FormActions,
  FormSection,
  Input,
  Radio,
  RadioGroup,
  Select,
  Surface,
  Textarea,
} from "@/components/ui";

/**
 * Phase 5.7 design-system laboratory specimens.
 * Not registration, profile, or product forms.
 */
export function FormsShowcase() {
  return (
    <section className="border-b border-border-subtle pb-14">
      <h2 className="mb-2 text-h2 text-foreground">Forms &amp; input patterns</h2>
      <p className="mb-8 layout-prose text-body-sm text-muted-foreground">
        Reusable field composition and controls. Required fields use a visible asterisk. Specimens
        only — not product workflows.
      </p>

      <Stack gap="comfortable">
        <div>
          <p className="mb-3 text-label text-foreground">Controls</p>
          <Surface className="max-w-md p-5">
            <FormSection title="Sample group" description="Neutral laboratory content.">
              <Field label="Full name" required description="As it should appear professionally.">
                <Input name="demo-name" autoComplete="off" defaultValue="Ada Example" />
              </Field>
              <Field
                label="Email"
                required
                error="Enter a valid email address."
                description="Used for account contact in later phases."
              >
                <Input
                  name="demo-email"
                  type="email"
                  autoComplete="off"
                  defaultValue="not-an-email"
                />
              </Field>
              <Field label="Headline" optional>
                <Input name="demo-headline" autoComplete="off" placeholder="Short professional headline" />
              </Field>
              <Field label="Notes">
                <Textarea name="demo-notes" defaultValue="Sample multiline text." />
              </Field>
              <Field label="Preference">
                <Select name="demo-select" defaultValue="members">
                  <option value="private">Private</option>
                  <option value="members">Members only</option>
                  <option value="directory">Directory</option>
                </Select>
              </Field>
              <Field label="I understand this is a specimen" layout="inline">
                <Checkbox name="demo-check" defaultChecked />
              </Field>
              <div>
                <p id="demo-radio-legend" className="mb-2 text-label text-foreground">
                  Sample choice
                </p>
                <RadioGroup name="demo-radio" aria-labelledby="demo-radio-legend">
                  <Radio value="a" label="Option A" defaultChecked />
                  <Radio value="b" label="Option B" />
                </RadioGroup>
              </div>
              <Field label="Disabled field" disabled>
                <Input name="demo-disabled" disabled defaultValue="Not editable" />
              </Field>
              <Field label="Read-only field">
                <Input name="demo-readonly" readOnly defaultValue="Read-only value" />
              </Field>
              <FormActions>
                <Button type="button">Primary action</Button>
                <Button type="button" variant="outline">
                  Secondary
                </Button>
              </FormActions>
            </FormSection>
          </Surface>
        </div>

        <div>
          <p className="mb-3 text-label text-foreground">Member vs EXCO density</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Section density="member" className="rounded-md border border-border bg-surface p-5">
              <p className="text-h4 text-foreground">Member</p>
              <Field label="Sample">
                <Input name="member-a" autoComplete="off" />
              </Field>
              <Field label="Another">
                <Input name="member-b" autoComplete="off" />
              </Field>
              <p className="text-caption text-muted-foreground">Section gap 32px · more spacious</p>
            </Section>
            <Section density="exco" className="rounded-md border border-border bg-surface p-4">
              <p className="text-h4 text-foreground">EXCO</p>
              <Field label="Sample">
                <Input name="exco-a" autoComplete="off" />
              </Field>
              <Field label="Another">
                <Input name="exco-b" autoComplete="off" />
              </Field>
              <p className="text-caption text-muted-foreground">Section gap 16px · denser · same controls</p>
            </Section>
          </div>
        </div>
      </Stack>
    </section>
  );
}
