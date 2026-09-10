import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Alert,
  Button,
  EmptyState,
  Progress,
  Skeleton,
  Spinner,
} from "@/components/ui";

describe("feedback primitives", () => {
  it("renders semantic alert variants with text meaning", () => {
    const success = renderToStaticMarkup(
      <Alert intent="success" title="Saved">
        Your draft was saved. You can continue later.
      </Alert>,
    );
    expect(success).toContain("role=\"status\"");
    expect(success).toContain("Saved");
    expect(success).toContain("Your draft was saved");

    const danger = renderToStaticMarkup(
      <Alert intent="danger" role="alert" title="Could not complete the request">
        Nothing was changed. Try again in a moment.
      </Alert>,
    );
    expect(danger).toContain("role=\"alert\"");
    expect(danger).toContain("Nothing was changed");
  });

  it("keeps empty states distinct from errors", () => {
    const html = renderToStaticMarkup(
      <EmptyState title="No items yet">Nothing has been added yet.</EmptyState>,
    );
    expect(html).toContain("No items yet");
    expect(html).not.toContain("role=\"alert\"");
  });

  it("exposes accessible spinner and progress semantics", () => {
    const spinner = renderToStaticMarkup(<Spinner label="Loading section" />);
    expect(spinner).toContain("role=\"status\"");
    expect(spinner).toContain("Loading section");

    const progress = renderToStaticMarkup(<Progress value={40} max={100} label="Upload" />);
    expect(progress).toContain("role=\"progressbar\"");
    expect(progress).toContain("aria-valuenow=\"40\"");
    expect(progress).toContain("40%");
  });

  it("renders skeleton as decorative placeholder", () => {
    const html = renderToStaticMarkup(<Skeleton className="h-8 w-full" />);
    expect(html).toContain("aria-hidden=\"true\"");
  });

  it("button loading sets busy and disabled to prevent duplicate activation", () => {
    const html = renderToStaticMarkup(
      <Button type="button" loading>
        Saving
      </Button>,
    );
    expect(html).toContain("aria-busy=\"true\"");
    expect(html).toContain("disabled");
    expect(html).toContain("Processing");
    expect(html).toContain("Saving");
  });
});
