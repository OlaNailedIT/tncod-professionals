import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Field, Input, Textarea, Checkbox } from "@/components/ui";

describe("form field composition", () => {
  it("associates label with input via htmlFor/id", () => {
    const html = renderToStaticMarkup(
      <Field label="Email">
        <Input name="email" />
      </Field>,
    );
    expect(html).toMatch(/<label[^>]*for="([^"]+)"/);
    const match = html.match(/for="([^"]+)"/);
    expect(match?.[1]).toBeTruthy();
    expect(html).toContain(`id="${match![1]}"`);
  });

  it("marks required fields with asterisk and required attribute", () => {
    const html = renderToStaticMarkup(
      <Field label="Name" required>
        <Input name="name" />
      </Field>,
    );
    expect(html).toContain("*");
    expect(html).toContain("required");
    expect(html).toContain('aria-required="true"');
  });

  it("exposes error text with role=alert and aria-invalid", () => {
    const html = renderToStaticMarkup(
      <Field label="Email" error="Enter a valid email address.">
        <Input name="email" />
      </Field>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Enter a valid email address.");
    expect(html).toContain('aria-invalid="true"');
  });

  it("associates description via aria-describedby", () => {
    const html = renderToStaticMarkup(
      <Field label="Notes" description="Optional guidance.">
        <Textarea name="notes" />
      </Field>,
    );
    expect(html).toContain("Optional guidance.");
    expect(html).toContain("aria-describedby=");
  });

  it("supports disabled and read-only controls", () => {
    const disabled = renderToStaticMarkup(
      <Field label="Locked" disabled>
        <Input name="locked" />
      </Field>,
    );
    expect(disabled).toContain("disabled");

    const readOnly = renderToStaticMarkup(
      <Field label="Readonly">
        <Input name="ro" readOnly defaultValue="x" />
      </Field>,
    );
    expect(readOnly).toMatch(/readOnly|readonly/i);
  });

  it("supports inline checkbox layout", () => {
    const html = renderToStaticMarkup(
      <Field label="Accept specimen" layout="inline">
        <Checkbox name="accept" />
      </Field>,
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("Accept specimen");
  });
});
