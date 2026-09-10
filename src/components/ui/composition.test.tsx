import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Section, Stack } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FormActions,
  FormSection,
  Input,
  MetadataGroup,
  MetadataItem,
  StatusBadge,
  StatusField,
  StatusGroup,
} from "@/components/ui";

describe("Phase 5.13 composition", () => {
  it("preserves Field label/error associations inside Card + FormSection", () => {
    const html = renderToStaticMarkup(
      <Card>
        <CardHeader>
          <CardTitle>Specimen</CardTitle>
          <CardDescription>Composition check</CardDescription>
        </CardHeader>
        <CardContent>
          <FormSection title="Group" description="Nested form">
            <Field label="Preferred name" required description="Help text" error="Required.">
              <Input name="compose-name" />
            </Field>
            <FormActions>
              <Button type="button">Primary</Button>
            </FormActions>
          </FormSection>
        </CardContent>
      </Card>,
    );

    expect(html).toMatch(/for="([^"]+)"/);
    const match = html.match(/for="([^"]+)"/);
    expect(html).toContain(`id="${match![1]}"`);
    expect(html).toContain("aria-describedby=");
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain("Help text");
    expect(html).toContain("Required.");
  });

  it("composes status and metadata without colour-only meaning", () => {
    const html = renderToStaticMarkup(
      <Section density="exco">
        <Stack gap="tight">
          <StatusGroup>
            <StatusField label="Verification">
              <StatusBadge intent="warning">Needs clarification</StatusBadge>
            </StatusField>
          </StatusGroup>
          <MetadataGroup>
            <MetadataItem label="Queue focus">Pending review</MetadataItem>
          </MetadataGroup>
          <Badge variant="outline">Specimen</Badge>
        </Stack>
      </Section>,
    );

    expect(html).toContain("Needs clarification");
    expect(html).toContain("Verification");
    expect(html).toContain("Queue focus");
    expect(html).toContain("Pending review");
    expect(html).toContain("layout-section-exco");
  });

  it("keeps Member and EXCO as density classes on shared Section", () => {
    const member = renderToStaticMarkup(
      <Section density="member">
        <Card>
          <CardFooter>
            <Button type="button">Continue</Button>
          </CardFooter>
        </Card>
      </Section>,
    );
    const exco = renderToStaticMarkup(
      <Section density="exco">
        <Card>
          <CardFooter>
            <Button type="button" size="sm">
              Open
            </Button>
          </CardFooter>
        </Card>
      </Section>,
    );

    expect(member).toContain("layout-section-member");
    expect(exco).toContain("layout-section-exco");
    expect(member).not.toContain("MemberCard");
    expect(exco).not.toContain("ExcoCard");
  });
});
