import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand/logo";
import { Container, Grid, PageFrame, Section, Stack } from "@/components/layout";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  MetadataGroup,
  MetadataItem,
  Separator,
  StatusBadge,
  StatusField,
  StatusGroup,
  Surface,
} from "@/components/ui";
import {
  presentProfileStatus,
  presentVerificationStatus,
  presentVisibilityStatus,
} from "@/lib/status";
import { FormsShowcase } from "@/components/design-system/forms-showcase";
import { FeedbackShowcase } from "@/components/design-system/feedback-showcase";
import { ShellShowcase } from "@/components/design-system/shell-showcase";
import { CompositionShowcase } from "@/components/design-system/composition-showcase";

export const metadata: Metadata = {
  title: "Design system — TNCOD Professionals",
  description: "Phase 5 design-system validation surface. Not a product page.",
  robots: { index: false, follow: false },
};

function Swatch({
  name,
  className,
  note,
}: {
  name: string;
  className: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 rounded-md border border-border-subtle ${className}`} />
      <div>
        <p className="text-label text-foreground">{name}</p>
        {note ? <p className="text-caption text-muted-foreground">{note}</p> : null}
      </div>
    </div>
  );
}

function DemoBlock({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted px-3 py-4 text-body-sm text-foreground">
      {label}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <PageFrame className="py-10 font-sans">
      <Container width="wide">
        <Stack gap="section">
          <header className="flex flex-col gap-4 border-b border-border-subtle pb-8">
            <BrandLogo className="max-w-[280px]" priority />
            <div>
              <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
                Development only · Phase 5.2–5.13
              </p>
              <h1 className="mt-1 text-h1 text-foreground">Design system</h1>
              <p className="mt-2 layout-prose text-body-sm text-muted-foreground">
                Static validation of tokens, typography, layout, components, status, forms,
                feedback, shells, and consolidated composition. No product data, Auth, or workflows.
              </p>
            </div>
          </header>

          <ShellShowcase />

          <FeedbackShowcase />

          <FormsShowcase />

          <CompositionShowcase />

          <section className="border-b border-border-subtle pb-14">
            <h2 className="mb-2 text-h2 text-foreground">Data &amp; status patterns</h2>
            <p className="mb-8 layout-prose text-body-sm text-muted-foreground">
              Semantic intents and independent professional dimensions from the locked Phase 0–2
              architecture. Specimens only — not product screens.
            </p>

            <Stack gap="comfortable">
              <div>
                <p className="mb-3 text-label text-foreground">Semantic intents</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge intent="neutral">Neutral</StatusBadge>
                  <StatusBadge intent="info">Informational</StatusBadge>
                  <StatusBadge intent="success">Positive</StatusBadge>
                  <StatusBadge intent="warning">Caution</StatusBadge>
                  <StatusBadge intent="danger">Negative</StatusBadge>
                </div>
                <p className="mt-2 text-caption text-muted-foreground">
                  Text carries meaning. Colour reinforces intent using existing state tokens — not
                  brand gold, not raw hex.
                </p>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">
                  Independent dimensions (must not collapse)
                </p>
                <Surface className="p-5">
                  <p className="mb-4 text-h4 text-foreground">Example professional specimen</p>
                  <StatusGroup>
                    <StatusField label="Profile">
                      <StatusBadge intent={presentProfileStatus("COMPLETE").intent}>
                        {presentProfileStatus("COMPLETE").label}
                      </StatusBadge>
                    </StatusField>
                    <StatusField label="Verification">
                      <StatusBadge intent={presentVerificationStatus("VERIFIED").intent}>
                        {presentVerificationStatus("VERIFIED").label}
                      </StatusBadge>
                    </StatusField>
                    <StatusField label="Directory">
                      <StatusBadge intent={presentVisibilityStatus("MEMBERS_ONLY").intent}>
                        {presentVisibilityStatus("MEMBERS_ONLY").label}
                      </StatusBadge>
                    </StatusField>
                  </StatusGroup>
                  <p className="mt-4 layout-prose text-body-sm text-muted-foreground">
                    Valid combination: verified without public directory listing. Private/members
                    visibility is not rejection.
                  </p>
                </Surface>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Verification sample row</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "NOT_REVIEWED",
                      "PENDING",
                      "UNDER_REVIEW",
                      "VERIFIED",
                      "NEEDS_CLARIFICATION",
                      "REJECTED",
                    ] as const
                  ).map((s) => {
                    const p = presentVerificationStatus(s);
                    return (
                      <StatusBadge key={s} intent={p.intent}>
                        {p.label}
                      </StatusBadge>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Visibility sample row</p>
                <div className="flex flex-wrap gap-2">
                  {(["PRIVATE", "MEMBERS_ONLY", "DIRECTORY"] as const).map((s) => {
                    const p = presentVisibilityStatus(s);
                    return (
                      <StatusBadge key={s} intent={p.intent}>
                        {p.label}
                      </StatusBadge>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Metadata</p>
                <Surface className="p-5">
                  <MetadataGroup>
                    <MetadataItem label="Sample field">Example value</MetadataItem>
                    <MetadataItem label="Another field">Generic content</MetadataItem>
                    <MetadataItem label="Longer value">
                      Values wrap within the container; labels stay caption weight.
                    </MetadataItem>
                  </MetadataGroup>
                </Surface>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Colour-independent meaning</p>
                <p className="mb-2 layout-prose text-body-sm text-muted-foreground">
                  Same states with intentional neutral presentation — labels remain readable.
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge intent="neutral">Verified</StatusBadge>
                  <StatusBadge intent="neutral">Rejected</StatusBadge>
                  <StatusBadge intent="neutral">Private</StatusBadge>
                </div>
              </div>
            </Stack>
          </section>

          <section className="border-b border-border-subtle pb-14">
            <h2 className="mb-2 text-h2 text-foreground">Core components</h2>
            <p className="mb-8 layout-prose text-body-sm text-muted-foreground">
              Reusable primitives that compose locked tokens and layout. Neutral examples only —
              not product screens.
            </p>

            <Stack gap="comfortable">
              <div>
                <p className="mb-3 text-label text-foreground">Button</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button">Primary</Button>
                  <Button type="button" variant="secondary">
                    Secondary
                  </Button>
                  <Button type="button" variant="outline">
                    Outline
                  </Button>
                  <Button type="button" variant="ghost">
                    Ghost
                  </Button>
                  <Button type="button" variant="destructive">
                    Destructive
                  </Button>
                  <Button type="button" variant="link">
                    Link
                  </Button>
                  <Button type="button" disabled>
                    Disabled
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" size="sm">
                    Small
                  </Button>
                  <Button type="button" size="default">
                    Default
                  </Button>
                  <Button type="button" size="lg">
                    Large
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Surface hierarchy</p>
                <Grid columns={3}>
                  <Surface tone="default" className="p-4">
                    <p className="text-label text-foreground">Primary surface</p>
                    <p className="mt-1 text-caption text-muted-foreground">bg-surface</p>
                  </Surface>
                  <Surface tone="muted" className="p-4">
                    <p className="text-label text-foreground">Muted surface</p>
                    <p className="mt-1 text-caption text-muted-foreground">bg-surface-muted</p>
                  </Surface>
                  <Surface tone="subtle" className="p-4">
                    <p className="text-label text-foreground">Subtle surface</p>
                    <p className="mt-1 text-caption text-muted-foreground">bg-surface-subtle</p>
                  </Surface>
                </Grid>
                <p className="mt-2 text-caption text-muted-foreground">
                  Canvas remains page background (`bg-background`). Controls use primary / secondary
                  / outline tokens — not a fourth surface colour.
                </p>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Card</p>
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle>Content boundary</CardTitle>
                    <CardDescription>
                      Cards mark meaningful groups — not every paragraph.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    Neutral body copy for design-system validation. No directory or profile content.
                  </CardContent>
                  <CardFooter>
                    <Button type="button" size="sm">
                      Primary
                    </Button>
                    <Button type="button" size="sm" variant="outline">
                      Outline
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Badge</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Muted</Badge>
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="accent">Accent</Badge>
                </div>
                <p className="mt-2 text-caption text-muted-foreground">
                  Presentational only. Business status mapping is Phase 5.6.
                </p>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Avatar</p>
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar size="sm" fallback="AB" alt="Example A B" />
                  <Avatar size="md" fallback="CD" alt="Example C D" />
                  <Avatar size="lg" fallback="EF" alt="Example E F" />
                </div>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Separator</p>
                <Surface className="max-w-md p-4">
                  <p className="text-body-sm text-foreground">Above</p>
                  <Separator className="my-3" />
                  <p className="text-body-sm text-foreground">Below</p>
                </Surface>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Composition</p>
                <p className="mb-3 layout-prose text-body-sm text-muted-foreground">
                  PageFrame → Container → Section → Card → Stack. Structural only.
                </p>
                <Section density="member" className="max-w-lg">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar fallback="TN" alt="Example" />
                        <div>
                          <CardTitle>Example group</CardTitle>
                          <CardDescription>Shared components · member density spacing</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent>
                      <Stack gap="tight">
                        <p>Related line</p>
                        <p className="text-muted-foreground">Supporting line</p>
                      </Stack>
                    </CardContent>
                    <CardFooter>
                      <Badge variant="outline">Neutral</Badge>
                      <Button type="button" size="sm" variant="ghost">
                        Action
                      </Button>
                    </CardFooter>
                  </Card>
                </Section>
              </div>
            </Stack>
          </section>

          <section className="border-b border-border-subtle pb-14">
            <h2 className="mb-2 text-h2 text-foreground">Layout & spacing</h2>
            <p className="mb-8 layout-prose text-body-sm text-muted-foreground">
              One spatial system · two densities. Containers, gutters, stacks, and grids compose
              Phase 5.2 spacing tokens — they do not invent a second scale.
            </p>

            <Stack gap="comfortable">
              <div>
                <p className="mb-3 text-label text-foreground">Containers</p>
                <Stack gap="tight">
                  {(
                    [
                      ["narrow", "layout-container-narrow", "640px"],
                      ["standard", "layout-container-standard", "960px"],
                      ["wide", "layout-container-wide", "1280px"],
                    ] as const
                  ).map(([name, cls, note]) => (
                    <div key={name} className="rounded-md border border-border-subtle bg-surface p-2">
                      <div
                        className={cnDemo(cls)}
                        style={{
                          marginInline: "auto",
                          background: "var(--surface-muted)",
                          border: "1px dashed var(--border)",
                          padding: "var(--space-md)",
                        }}
                      >
                        <p className="text-caption text-muted-foreground">
                          {name} · {note}
                        </p>
                      </div>
                    </div>
                  ))}
                </Stack>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Page gutters</p>
                <p className="text-body-sm text-muted-foreground">
                  Responsive <code className="font-mono text-caption">--layout-page-gutter</code>:
                  16 → 24 → 32 → 48px (from Phase 5.2 spacing). This page uses{" "}
                  <code className="font-mono text-caption">PageFrame</code>.
                </p>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Stacks (vertical rhythm)</p>
                <Grid columns={2}>
                  <div className="rounded-md border border-border bg-surface p-4">
                    <p className="mb-2 text-caption text-muted-foreground">tight (8px)</p>
                    <Stack gap="tight">
                      <DemoBlock label="A" />
                      <DemoBlock label="B" />
                      <DemoBlock label="C" />
                    </Stack>
                  </div>
                  <div className="rounded-md border border-border bg-surface p-4">
                    <p className="mb-2 text-caption text-muted-foreground">comfortable (24px)</p>
                    <Stack gap="comfortable">
                      <DemoBlock label="A" />
                      <DemoBlock label="B" />
                    </Stack>
                  </div>
                </Grid>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Content grouping</p>
                <p className="mb-3 layout-prose text-body-sm text-muted-foreground">
                  Related items → tight/standard. Related groups → group gap. New section → section
                  density gap.
                </p>
                <div className="rounded-md border border-border bg-surface p-4">
                  <Stack gap="comfortable">
                    <Stack gap="tight">
                      <p className="text-h4 text-foreground">Group title</p>
                      <p className="text-body-sm text-muted-foreground">
                        Heading stays close to its content.
                      </p>
                    </Stack>
                    <Stack gap="tight">
                      <p className="text-h4 text-foreground">Next group</p>
                      <p className="text-body-sm text-muted-foreground">
                        Moderate gap separates groups without starting a new page section.
                      </p>
                    </Stack>
                  </Stack>
                </div>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Grid</p>
                <Grid columns={3}>
                  <DemoBlock label="Cell 1" />
                  <DemoBlock label="Cell 2" />
                  <DemoBlock label="Cell 3" />
                </Grid>
                <p className="mt-2 text-caption text-muted-foreground">
                  1 col mobile · 2 tablet · 3 desktop (for 3-column grids)
                </p>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Reading width</p>
                <p className="layout-prose text-body text-foreground">
                  Long-form guidance stays within approximately 65 characters per line so
                  professional descriptions remain readable. Operational tables may exceed this
                  intentionally and scroll locally.
                </p>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Alignment</p>
                <p className="text-body-sm text-muted-foreground">
                  Default: left-aligned text and shared container edges. Centring is reserved for
                  intentional empty states or focused introductory content — not whole app screens.
                </p>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Member vs EXCO density</p>
                <Grid columns={2}>
                  <Section density="member" className="rounded-md border border-border bg-surface p-6">
                    <p className="text-h4 text-foreground">Member</p>
                    <DemoBlock label="Block" />
                    <DemoBlock label="Block" />
                    <p className="text-body-sm text-muted-foreground">
                      Section gap = 32px · lighter · more spacious
                    </p>
                  </Section>
                  <Section density="exco" className="rounded-md border border-border bg-surface p-4">
                    <p className="text-h4 text-foreground">EXCO</p>
                    <DemoBlock label="Block" />
                    <DemoBlock label="Block" />
                    <p className="text-body-sm text-muted-foreground">
                      Section gap = 16px · denser · still calm · same type scale
                    </p>
                  </Section>
                </Grid>
              </div>

              <div>
                <p className="mb-3 text-label text-foreground">Overflow</p>
                <p className="mb-2 text-body-sm text-muted-foreground">
                  Page: no unintended horizontal scroll. Wide operational content may use local
                  scroll:
                </p>
                <div className="layout-scroll-x rounded-md border border-border bg-surface p-3">
                  <div className="flex gap-3" style={{ width: "48rem" }}>
                    <DemoBlock label="Wide A" />
                    <DemoBlock label="Wide B" />
                    <DemoBlock label="Wide C" />
                    <DemoBlock label="Wide D" />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border-subtle bg-surface-muted p-5">
                <p className="text-label text-foreground">Layout notes (5.4 locked)</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-body-sm text-muted-foreground">
                  <li>Cards/surfaces: established in Phase 5.5 — still not for every text block</li>
                  <li>Forms: label→field tight; fields standard; sections use density gaps (5.8)</li>
                  <li>Tables: density via grouping, not shrinking below 16px body</li>
                  <li>Shell → page → container → section → group (nav shell is Phase 5.10)</li>
                  <li>Full-bleed is intentional only — default content is contained</li>
                </ul>
              </div>
            </Stack>
          </section>

          <section className="border-b border-border-subtle pb-14">
            <h2 className="mb-2 text-h2 text-foreground">Typography</h2>
            <p className="mb-8 layout-prose text-body-sm text-muted-foreground">
              Inter · weights 400–700 · one scale for Member and EXCO.
            </p>
            <Stack gap="comfortable">
              <div>
                <p className="mb-2 text-caption text-muted-foreground">Display</p>
                <p className="text-display text-foreground">TNCOD Professionals</p>
              </div>
              <div>
                <p className="mb-2 text-caption text-muted-foreground">H1</p>
                <h1 className="text-h1 text-foreground">Welcome to the professional community</h1>
              </div>
              <div>
                <p className="mb-2 text-caption text-muted-foreground">Body</p>
                <p className="layout-prose text-body text-foreground">
                  You can register quickly and remain useful in the internal database even while
                  your profile is still incomplete.
                </p>
              </div>
            </Stack>
          </section>

          <section>
            <h2 className="mb-4 text-h3 text-foreground">Brand colours</h2>
            <Grid columns={4}>
              <Swatch name="brand-primary" className="bg-brand-primary" note="#0E2954" />
              <Swatch name="brand-secondary" className="bg-brand-secondary" note="#1F75FE" />
              <Swatch name="brand-gold" className="bg-brand-gold" note="#D4AF37" />
              <Swatch name="brand-white" className="bg-brand-white border-border" note="#FFFFFF" />
            </Grid>
          </section>

          <section id="focus-demo">
            <h2 className="mb-4 text-h3 text-foreground">Focus</h2>
            <p className="mb-3 text-body-sm text-muted-foreground">
              Focus ring unchanged from Phase 5.2 (
              <code className="font-mono text-caption">--ring</code>).
            </p>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-label text-primary-foreground"
            >
              Focus primary
            </button>
          </section>
        </Stack>
      </Container>
    </PageFrame>
  );
}

function cnDemo(cls: string) {
  return `layout-container ${cls}`;
}
