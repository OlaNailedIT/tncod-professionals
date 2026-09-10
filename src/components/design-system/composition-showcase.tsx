"use client";

import { Grid, Section, Stack } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  FormActions,
  FormSection,
  Input,
  MetadataGroup,
  MetadataItem,
  Progress,
  StatusBadge,
  StatusField,
  StatusGroup,
  Textarea,
} from "@/components/ui";

/**
 * Phase 5.13 consolidated composition specimens.
 * Validates primitives together — not product screens or workflows.
 */
export function CompositionShowcase() {
  return (
    <section
      className="border-b border-border-subtle pb-14"
      data-phase513-composition="root"
    >
      <h2 className="mb-2 text-h2 text-foreground">Consolidated composition</h2>
      <p className="mb-8 layout-prose text-body-sm text-muted-foreground">
        Phase 5.13 laboratory specimens: Card + status + metadata + forms + actions under Member
        and EXCO density. Specimen content only — no Auth, product data, or workflows.
      </p>

      <Stack gap="comfortable">
        <div>
          <p className="mb-3 text-label text-foreground">Member composition</p>
          <Section density="member" data-phase513-composition="member">
            <Alert intent="info" title="Specimen next step">
              Spacious Member grouping with one clear primary action.
            </Alert>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Professional record specimen</CardTitle>
                    <CardDescription>
                      Shared Card / Status / Metadata / Field — Member density spacing.
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Specimen</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Stack gap="standard">
                  <StatusGroup>
                    <StatusField label="Profile">
                      <StatusBadge intent="info">Incomplete</StatusBadge>
                    </StatusField>
                    <StatusField label="Verification">
                      <StatusBadge intent="neutral">Not submitted</StatusBadge>
                    </StatusField>
                  </StatusGroup>
                  <MetadataGroup>
                    <MetadataItem label="Display name">Ada Example</MetadataItem>
                    <MetadataItem label="Organisation">TNCOD Professionals Lab</MetadataItem>
                    <MetadataItem label="Contact">ada.example@tncod.test</MetadataItem>
                  </MetadataGroup>
                  <FormSection
                    title="Specimen details"
                    description="Form composition inside Card. Not a product form."
                  >
                    <Field
                      label="Preferred name"
                      required
                      description="How the name should appear in specimens."
                    >
                      <Input name="phase513-member-name" autoComplete="off" defaultValue="Ada" />
                    </Field>
                    <Field label="Notes" optional>
                      <Textarea
                        name="phase513-member-notes"
                        defaultValue="Friendly, lower-pressure Member composition."
                      />
                    </Field>
                    <FormActions>
                      <Button type="button">Continue profile</Button>
                      <Button type="button" variant="outline">
                        Save later
                      </Button>
                    </FormActions>
                  </FormSection>
                </Stack>
              </CardContent>
              <CardFooter>
                <EmptyState
                  title="No opportunities listed"
                  action={
                    <Button type="button" size="sm" variant="ghost">
                      Browse later
                    </Button>
                  }
                >
                  Contextual absence — not an error.
                </EmptyState>
              </CardFooter>
            </Card>
          </Section>
        </div>

        <div>
          <p className="mb-3 text-label text-foreground">EXCO composition</p>
          <Section density="exco" data-phase513-composition="exco">
            <Alert intent="neutral" title="Operational specimen">
              Denser grouping, metadata, and compact actions. Same platform components.
            </Alert>
            <Card className="p-4 gap-3">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>Review queue specimen</CardTitle>
                    <CardDescription>Structured workspace density — not a verification UI.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline">
                      Refresh list
                    </Button>
                    <Button type="button" size="sm" variant="secondary">
                      Open specimen
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Stack gap="tight">
                  <StatusGroup>
                    <StatusField label="Profile">
                      <StatusBadge intent="success">Active</StatusBadge>
                    </StatusField>
                    <StatusField label="Verification">
                      <StatusBadge intent="warning">Needs clarification</StatusBadge>
                    </StatusField>
                    <StatusField label="Visibility">
                      <StatusBadge intent="neutral">Private</StatusBadge>
                    </StatusField>
                  </StatusGroup>
                  <MetadataGroup>
                    <MetadataItem label="Queue focus">Pending review</MetadataItem>
                    <MetadataItem label="Assignee">EXCO specimen</MetadataItem>
                    <MetadataItem label="Last sync">Laboratory only</MetadataItem>
                    <MetadataItem label="Reference">SPEC-513-EXCO</MetadataItem>
                  </MetadataGroup>
                  <Progress value={40} label="Specimen review progress" />
                  <FormSection title="Clarification note" description="Dense form composition.">
                    <Field
                      label="Internal note"
                      required
                      error="Provide a short clarification note."
                    >
                      <Input name="phase513-exco-note" autoComplete="off" defaultValue="" />
                    </Field>
                    <FormActions>
                      <Button type="button" size="sm">
                        Record note
                      </Button>
                      <Button type="button" size="sm" variant="ghost" disabled>
                        Disabled action
                      </Button>
                    </FormActions>
                  </FormSection>
                </Stack>
              </CardContent>
            </Card>
          </Section>
        </div>

        <div>
          <p className="mb-3 text-label text-foreground">Long-content edge cases</p>
          <p className="mb-3 layout-prose text-body-sm text-muted-foreground">
            Realistic long labels and values. Specimens must wrap without horizontal overflow.
          </p>
          <Grid columns={2} data-phase513-composition="long-content">
            <Card>
              <CardHeader>
                <CardTitle>
                  Very Long Professional Display Name That Should Wrap Gracefully Without Breaking
                  Layout
                </CardTitle>
                <CardDescription>
                  Organisation: The National Congress of Traditional Leaders of South Africa —
                  Professionals Laboratory Specimen Division
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetadataGroup>
                  <MetadataItem label="Service offering with an unusually long label">
                    Strategic community capacity mapping and professional activation planning for
                    multi-stakeholder programmes
                  </MetadataItem>
                  <MetadataItem label="Email-like string">
                    very.long.professional.contact.address+specimen@example.tncod.test
                  </MetadataItem>
                </MetadataGroup>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge intent="info">Profile incomplete — awaiting supporting details</StatusBadge>
                  <Badge variant="secondary">Multiple badges</Badge>
                  <Badge variant="outline">Wrap check</Badge>
                  <Badge variant="accent">Accent</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="button" size="sm">
                  Primary
                </Button>
                <Button type="button" size="sm" variant="outline">
                  Secondary
                </Button>
                <Button type="button" size="sm" variant="ghost">
                  Ghost
                </Button>
                <Button type="button" size="sm" variant="destructive" disabled>
                  Disabled
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Loading and empty composition</CardTitle>
                <CardDescription>Feedback primitives composed with Card footer actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Stack gap="standard">
                  <Button type="button" loading>
                    Saving specimen
                  </Button>
                  <EmptyState title="Nothing to show yet">
                    Empty optional content remains understandable without colour alone.
                  </EmptyState>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </div>
      </Stack>
    </section>
  );
}
