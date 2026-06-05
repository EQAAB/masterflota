import { describe, expect, it } from "vitest";
import { hasAllPermissions, hasAnyPermission } from "./permissions";

describe("permission helpers", () => {
  const perms = ["imports.view", "payouts.view", "drivers.view"];

  it("hasAnyPermission matches one", () => {
    expect(hasAnyPermission(perms, ["imports.delete", "imports.view"])).toBe(true);
    expect(hasAnyPermission(perms, ["imports.delete"])).toBe(false);
  });

  it("hasAllPermissions matches all", () => {
    expect(hasAllPermissions(perms, ["imports.view", "drivers.view"])).toBe(true);
    expect(hasAllPermissions(perms, ["imports.view", "imports.delete"])).toBe(false);
  });
});
