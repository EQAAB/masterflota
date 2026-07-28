import { describe, expect, it } from "vitest";
import { normalizeAppBasePath, viteBasePathFrom } from "./basePath";

describe("normalizeAppBasePath", () => {
  it("defaults to /fleet when unset", () => {
    expect(normalizeAppBasePath(undefined)).toBe("/fleet");
    expect(normalizeAppBasePath("")).toBe("/fleet");
  });

  it("supports domain root", () => {
    expect(normalizeAppBasePath("/")).toBe("/");
  });

  it("normalizes custom prefixes", () => {
    expect(normalizeAppBasePath("fleet")).toBe("/fleet");
    expect(normalizeAppBasePath("/fleet/")).toBe("/fleet");
  });
});

describe("viteBasePathFrom", () => {
  it("adds trailing slash for subpaths", () => {
    expect(viteBasePathFrom(undefined)).toBe("/fleet/");
    expect(viteBasePathFrom("/")).toBe("/");
  });
});
