"use client";

import * as React from "react";
import { Container, Section, Stack } from "@/components/layout";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetadataGroup,
  MetadataItem,
  StatusBadge,
  StatusField,
  StatusGroup,
  Surface,
} from "@/components/ui";
import {
  AppShell,
  type AppShellContext,
  isNavActive,
  memberNavItems,
  excoNavItems,
} from "@/components/shell";

/**
 * Phase 5.10 shells + Phase 5.11 density + Phase 5.13 Card composition in shell.
 * Not product dashboards, profiles, or EXCO workflows.
 */
export function ShellShowcase() {
  const [context, setContext] = React.useState<AppShellContext>("public");
  const [pathname, setPathname] = React.useState("/");

  React.useEffect(() => {
    if (context === "public") setPathname("/");
    else if (context === "member") setPathname("/dashboard");
    else setPathname("/exco");
  }, [context]);

  return (
    <section className="border-b border-border-subtle pb-14">
      <h2 className="mb-2 text-h2 text-foreground">Application shells &amp; navigation</h2>
      <p className="mb-6 layout-prose text-body-sm text-muted-foreground">
        Shared Public, Member, and EXCO chrome. Specimens use local path state — product routes are
        not implemented. Navigation does not grant access. Member and EXCO share one language with
        different density (Phase 5.11).
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["public", "Public"],
            ["member", "Member"],
            ["exco", "EXCO"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={context === value ? "default" : "outline"}
            aria-pressed={context === value}
            onClick={() => setContext(value)}
          >
            {label} shell
          </Button>
        ))}
      </div>

      <p className="mb-3 text-caption text-muted-foreground">
        Specimen pathname: <code className="text-foreground">{pathname}</code>
        {context === "member" && isNavActive(pathname, "/profile")
          ? " · Profile active (includes /profile/edit)"
          : null}
        {context === "member" ? ` · ${memberNavItems.length} primary destinations` : null}
        {context === "exco" ? ` · ${excoNavItems.length} operational destinations (grouped)` : null}
      </p>

      <div className="overflow-hidden rounded-md border border-border shadow-subtle">
        <div className="max-h-[36rem] overflow-auto">
          <AppShell
            context={context}
            pathname={pathname}
            mode="button"
            onNavigate={setPathname}
            title={
              context === "member"
                ? "Member specimen"
                : context === "exco"
                  ? "EXCO specimen"
                  : undefined
            }
            breadcrumbs={
              context === "exco" && pathname.startsWith("/exco/professionals")
                ? [
                    { label: "Professionals", href: "/exco/professionals" },
                    { label: "Specimen record" },
                  ]
                : undefined
            }
          >
            <Container width={context === "exco" ? "wide" : "standard"} className="py-2">
              {context === "member" ? (
                <Section density="member" data-audit-density="member">
                  <Alert intent="info" title="What matters next">
                    Complete your profile when you are ready. This is a laboratory specimen — not
                    your real dashboard.
                  </Alert>
                  <Card>
                    <CardHeader>
                      <CardTitle>Welcome back</CardTitle>
                      <CardDescription>
                        One clear next step. Shared Card / Button / StatusBadge — Member
                        composition uses more space.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Stack gap="standard">
                        <StatusGroup>
                          <StatusField label="Profile">
                            <StatusBadge intent="info">Profile incomplete</StatusBadge>
                          </StatusField>
                        </StatusGroup>
                        <div className="flex flex-wrap gap-3">
                          <Button type="button" onClick={() => setPathname("/profile/edit")}>
                            Continue profile
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setPathname("/profile/edit")}
                          >
                            Simulate /profile/edit
                          </Button>
                        </div>
                      </Stack>
                    </CardContent>
                  </Card>
                </Section>
              ) : null}

              {context === "exco" ? (
                <Section density="exco" data-audit-density="exco">
                  <Alert intent="neutral" title="Workspace specimen">
                    Operational framing for review work. Not a verification queue or product
                    workflow.
                  </Alert>
                  <Card className="gap-3 p-4">
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle>Professionals workspace</CardTitle>
                          <CardDescription>
                            Denser grouping and metadata. Same platform components.
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline">
                            Refresh list
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setPathname("/exco/professionals/specimen")}
                          >
                            Open specimen
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Stack gap="tight">
                        <MetadataGroup>
                          <MetadataItem label="Queue focus">Pending review</MetadataItem>
                          <MetadataItem label="Visibility filter">All</MetadataItem>
                          <MetadataItem label="Last sync">Specimen only</MetadataItem>
                        </MetadataGroup>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge intent="warning">Needs clarification</StatusBadge>
                          <StatusBadge intent="success">Verified</StatusBadge>
                          <StatusBadge intent="neutral">Private</StatusBadge>
                        </div>
                      </Stack>
                    </CardContent>
                  </Card>
                </Section>
              ) : null}

              {context === "public" ? (
                <Stack gap="comfortable">
                  <Alert intent="info" title="Design-system specimen">
                    Public shell is light chrome for discover and join. Not a marketing site
                    redesign.
                  </Alert>
                  <Surface className="p-5">
                    <p className="text-h4 text-foreground">Public content area</p>
                    <p className="mt-2 text-body-sm text-muted-foreground">
                      Future public screens compose into{" "}
                      <code className="text-foreground">main#main-content</code>.
                    </p>
                  </Surface>
                </Stack>
              ) : null}
            </Container>
          </AppShell>
        </div>
      </div>
    </section>
  );
}
