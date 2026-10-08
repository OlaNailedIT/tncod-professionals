import { describe, expect, it } from "vitest";
import {
  classifyAuthErrorMessage,
  signInRequestUserMessage,
  callbackUserMessage,
  maskEmail,
} from "@/lib/auth/classify-auth-error";

describe("classifyAuthErrorMessage", () => {
  it("detects rate limits", () => {
    expect(classifyAuthErrorMessage("email rate limit exceeded")).toBe("rate_limit");
    expect(classifyAuthErrorMessage("over_email_send_rate_limit")).toBe("rate_limit");
    expect(classifyAuthErrorMessage("Too many requests")).toBe("rate_limit");
  });

  it("detects consumed / expired link classes", () => {
    expect(classifyAuthErrorMessage("otp_expired")).toBe("callback_consumed");
    expect(classifyAuthErrorMessage("Token has expired or been used")).toBe("callback_consumed");
  });

  it("maps user-facing request messages", () => {
    expect(signInRequestUserMessage("rate_limit")).not.toMatch(/enter it/i);
    expect(signInRequestUserMessage("rate_limit", { codeInputVisible: true })).toMatch(
      /enter it above/i,
    );
    expect(signInRequestUserMessage("unknown")).toMatch(/could not send/i);
  });

  it("maps callback messages for consumed links", () => {
    expect(callbackUserMessage("callback_consumed")).toMatch(/already used|email security/i);
  });

  it("masks emails for display", () => {
    expect(maskEmail("member@example.com")).toBe("m***@example.com");
    expect(maskEmail("a@b.co")).toBe("a***@b.co");
  });
});
