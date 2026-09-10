import { describe, expect, it } from "vitest";
import { parseDirectoryQuery, directoryQueryString, DIRECTORY_PAGE_SIZE } from "./query";

describe("directory query", () => {
  it("locks page size at 25", () => {
    expect(DIRECTORY_PAGE_SIZE).toBe(25);
  });

  it("parses URL params and sanitizes page", () => {
    expect(parseDirectoryQuery({ q: "Engineer", page: "2" })).toEqual({
      q: "Engineer",
      profession: "",
      industry: "",
      location: "",
      service: "",
      page: 2,
    });
    expect(parseDirectoryQuery({ page: "0" }).page).toBe(1);
    expect(parseDirectoryQuery({ page: "-3" }).page).toBe(1);
    expect(parseDirectoryQuery({ page: "abc" }).page).toBe(1);
  });

  it("builds shareable query strings", () => {
    expect(directoryQueryString({ q: "ada", page: 1 })).toBe("?q=ada");
    expect(directoryQueryString({ q: "ada", page: 2 })).toBe("?q=ada&page=2");
  });
});
