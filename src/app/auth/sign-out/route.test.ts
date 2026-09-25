import { describe, expect, it } from "vitest";
import * as route from "@/app/auth/sign-out/route";

describe("sign-out route method boundary", () => {
  it("exports POST and does not export GET", () => {
    expect(typeof route.POST).toBe("function");
    expect("GET" in route).toBe(false);
  });
});
