import { describe, expect, it } from "vitest";
import { DEV_JWT_SECRET, resolveJwtSecret } from "./env";

const VALID_PROD_SECRET = "a".repeat(32);

describe("resolveJwtSecret", () => {
  it("throws in production when secret is missing", () => {
    expect(() => resolveJwtSecret(undefined, "production")).toThrow(
      "JWT_SECRET is required when NODE_ENV=production",
    );
    expect(() => resolveJwtSecret("   ", "production")).toThrow(
      "JWT_SECRET is required when NODE_ENV=production",
    );
  });

  it("throws in production for dev default secret", () => {
    expect(() => resolveJwtSecret(DEV_JWT_SECRET, "production")).toThrow(
      "JWT_SECRET must not use a default or placeholder value in production",
    );
  });

  it("throws in production for README placeholder secret", () => {
    expect(() => resolveJwtSecret("your_jwt_secret_change_in_production", "production")).toThrow(
      "JWT_SECRET must not use a default or placeholder value in production",
    );
  });

  it("throws in production when secret is too short", () => {
    expect(() => resolveJwtSecret("short", "production")).toThrow(
      "JWT_SECRET must be at least 32 characters when NODE_ENV=production",
    );
  });

  it("returns secret in production when valid", () => {
    expect(resolveJwtSecret(VALID_PROD_SECRET, "production")).toBe(VALID_PROD_SECRET);
    expect(resolveJwtSecret(`  ${VALID_PROD_SECRET}  `, "production")).toBe(VALID_PROD_SECRET);
  });

  it("returns dev default when unset in development", () => {
    expect(resolveJwtSecret(undefined, "development")).toBe(DEV_JWT_SECRET);
    expect(resolveJwtSecret(undefined, undefined)).toBe(DEV_JWT_SECRET);
  });

  it("returns custom secret in development when set", () => {
    const custom = "my-local-dev-secret";
    expect(resolveJwtSecret(custom, "development")).toBe(custom);
  });
});
