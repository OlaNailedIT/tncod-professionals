"use client";

import * as React from "react";
import { Stack } from "@/components/layout";
import {
  Alert,
  Button,
  EmptyState,
  Dialog,
  Progress,
  Skeleton,
  Spinner,
  Surface,
  ToastProvider,
  useToast,
} from "@/components/ui";

function ToastDemo() {
  const { push } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          push({
            title: "Draft saved",
            description: "Your changes are stored. You can continue editing.",
            intent: "success",
          })
        }
      >
        Show success toast
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          push({
            title: "Could not refresh the list",
            description: "Check your connection, then try again.",
            intent: "danger",
          })
        }
      >
        Show recoverable toast
      </Button>
    </div>
  );
}

/**
 * Phase 5.8 design-system laboratory specimens.
 * Not product workflows, screens, or API-backed actions.
 */
export function FeedbackShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [destructiveOpen, setDestructiveOpen] = React.useState(false);

  return (
    <ToastProvider>
      <section className="border-b border-border-subtle pb-14">
        <h2 className="mb-2 text-h2 text-foreground">Feedback &amp; interaction patterns</h2>
        <p className="mb-8 layout-prose text-body-sm text-muted-foreground">
          Reusable language for progress, completion, failure, waiting, emptiness, and
          confirmation. Specimens only — not product screens or workflows.
        </p>

        <Stack gap="comfortable">
          <div>
            <p className="mb-3 text-label text-foreground">Semantic alerts</p>
            <Stack gap="tight">
              <Alert intent="neutral" title="Note">
                This is a laboratory specimen. No account data is involved.
              </Alert>
              <Alert intent="info" title="Guidance">
                Complete the remaining fields when you are ready. Nothing is submitted here.
              </Alert>
              <Alert intent="success" title="Saved">
                Your draft was saved. You can leave this page and return later.
              </Alert>
              <Alert intent="warning" title="Before you continue">
                This action cannot be undone from this specimen. Review the details first.
              </Alert>
              <Alert intent="danger" role="alert" title="Could not complete the request">
                The operation did not finish. Nothing was changed. Try again in a moment.
              </Alert>
            </Stack>
          </div>

          <div>
            <p className="mb-3 text-label text-foreground">Loading &amp; progress</p>
            <Surface className="p-5">
              <Stack gap="comfortable">
                <div className="flex flex-wrap items-center gap-4">
                  <Spinner label="Loading section" />
                  <Button type="button" loading>
                    Saving
                  </Button>
                  <Button type="button" variant="outline" disabled>
                    Idle disabled
                  </Button>
                </div>
                <Progress value={64} label="Specimen progress" />
                <div className="grid gap-2 sm:grid-cols-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Stack>
            </Surface>
          </div>

          <div>
            <p className="mb-3 text-label text-foreground">Empty &amp; recovery</p>
            <Stack gap="comfortable">
              <EmptyState
                title="No items yet"
                action={
                  <Button type="button" variant="secondary">
                    Add a specimen item
                  </Button>
                }
              >
                Nothing has been added to this list. When content exists, it will appear here.
              </EmptyState>
              <Alert intent="danger" role="alert" title="List could not be loaded">
                The request timed out. Content was not updated.{" "}
                <Button type="button" size="sm" variant="outline" className="ml-1 align-baseline">
                  Try again
                </Button>
              </Alert>
            </Stack>
          </div>

          <div>
            <p className="mb-3 text-label text-foreground">Dialog confirmation</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(true)}>
                Open confirmation
              </Button>
              <Button type="button" variant="destructive" onClick={() => setDestructiveOpen(true)}>
                Open destructive confirmation
              </Button>
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              title="Leave this specimen?"
              confirmLabel="Leave"
              cancelLabel="Stay"
            >
              Unsaved specimen text will be discarded. This is not a product action.
            </Dialog>
            <Dialog
              open={destructiveOpen}
              onOpenChange={setDestructiveOpen}
              tone="destructive"
              title="Remove this specimen item?"
              confirmLabel="Remove"
              cancelLabel="Keep"
            >
              The item will be removed from this laboratory list. No database records are affected.
            </Dialog>
          </div>

          <div>
            <p className="mb-3 text-label text-foreground">Temporary notifications</p>
            <p className="mb-3 text-caption text-muted-foreground">
              Toasts are for brief, non-blocking feedback. Critical errors stay in alerts or
              inline messages.
            </p>
            <ToastDemo />
          </div>
        </Stack>
      </section>
    </ToastProvider>
  );
}
