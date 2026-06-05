import { describe, expect, it } from "vitest";
import { generateStrongPassword } from "./generateStrongPassword";

const LOWER_RE = /[a-z]/;
const UPPER_RE = /[A-Z]/;
const DIGIT_RE = /[0-9]/;
const SYMBOL_RE = /[!@#$%^&*\-_+=]/;

describe("generateStrongPassword", () => {
  it("defaults to 12 characters", () => {
    expect(generateStrongPassword()).toHaveLength(12);
  });

  it("respects custom length with minimum 12", () => {
    expect(generateStrongPassword(16)).toHaveLength(16);
    expect(generateStrongPassword(8)).toHaveLength(12);
  });

  it("includes lowercase, uppercase, digit, and symbol", () => {
    const pwd = generateStrongPassword();
    expect(LOWER_RE.test(pwd)).toBe(true);
    expect(UPPER_RE.test(pwd)).toBe(true);
    expect(DIGIT_RE.test(pwd)).toBe(true);
    expect(SYMBOL_RE.test(pwd)).toBe(true);
  });

  it("produces different passwords on consecutive calls", () => {
    const a = generateStrongPassword();
    const b = generateStrongPassword();
    expect(a).not.toBe(b);
  });
});
