import { describe, expect, it } from "vitest";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "./permissions";

describe("permission helpers", () => {
  const perms = ["drivers.view", "drivers.edit"];

  it("hasPermission checks a single grant", () => {
    expect(hasPermission(perms, "drivers.view")).toBe(true);
    expect(hasPermission(perms, "drivers.create")).toBe(false);
  });

  it("hasAnyPermission checks alternates", () => {
    expect(hasAnyPermission(perms, ["drivers.create", "drivers.view"])).toBe(true);
    expect(hasAnyPermission(perms, ["vehicles.view"])).toBe(false);
  });

  it("hasAllPermissions requires every grant", () => {
    expect(hasAllPermissions(perms, ["drivers.view", "drivers.edit"])).toBe(true);
    expect(hasAllPermissions(perms, ["drivers.view", "drivers.create"])).toBe(false);
    expect(hasAllPermissions(perms, [])).toBe(true);
  });
});
