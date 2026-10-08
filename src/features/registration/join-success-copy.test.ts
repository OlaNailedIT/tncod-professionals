import { describe, expect, it } from "vitest";
import {
  JOIN_SUCCESS_HEADING,
  JOIN_SUCCESS_LEAD,
  JOIN_SUCCESS_NEXT_BODY,
} from "@/features/registration/join-success-copy";

describe("join success copy", () => {
  it("does not claim Auth or a professional record was created", () => {
    const blob = `${JOIN_SUCCESS_HEADING}\n${JOIN_SUCCESS_LEAD}\n${JOIN_SUCCESS_NEXT_BODY}`.toLowerCase();
    expect(blob).not.toMatch(/auth identity/);
    expect(blob).not.toMatch(/record has been created/);
    expect(blob).not.toMatch(/you are registered/);
    expect(blob).toMatch(/sign in/);
    expect(blob).toMatch(/do not assume a new account was created/);
  });

  it("gives a real support route without publishing an unconfirmed inbox", () => {
    expect(JOIN_SUCCESS_NEXT_BODY.toLowerCase()).toMatch(/stop retrying/);
    expect(JOIN_SUCCESS_NEXT_BODY.toLowerCase()).toMatch(/exco/);
    expect(JOIN_SUCCESS_NEXT_BODY.toLowerCase()).toMatch(/church channel/);
    expect(JOIN_SUCCESS_NEXT_BODY.toLowerCase()).not.toContain(
      "cityofdavidprofessionals@gmail.com",
    );
    expect(JOIN_SUCCESS_NEXT_BODY.toLowerCase()).not.toMatch(/mailto:/);
  });
});
