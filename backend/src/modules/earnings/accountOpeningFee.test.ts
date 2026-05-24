import { describe, expect, it } from "vitest";
import {
  resolveAccountOpeningFeeForEarningsRow,
  resolvePlatformFeeForEarningsRow,
} from "./accountOpeningFee";

describe("resolveAccountOpeningFeeForEarningsRow", () => {
  const driverId = "d1";
  const applied = () => new Set<string>();

  it("Bolt courier always returns 0", () => {
    const set = applied();
    expect(
      resolveAccountOpeningFeeForEarningsRow({
        platform: "bolt_courier",
        csvFee: 71.44,
        orgDefault: 50,
        driverId,
        defaultAppliedForDriver: set,
      }),
    ).toBe(0);
    expect(set.size).toBe(0);
  });

  it("Glovo uses CSV when present", () => {
    const set = applied();
    expect(
      resolveAccountOpeningFeeForEarningsRow({
        platform: "glovo",
        csvFee: -71.44,
        orgDefault: 50,
        driverId,
        defaultAppliedForDriver: set,
      }),
    ).toBe(71.44);
  });

  it("Glovo applies org default once per driver", () => {
    const set = applied();
    const opts = {
      platform: "glovo" as const,
      csvFee: null,
      orgDefault: 25,
      driverId,
      defaultAppliedForDriver: set,
    };
    expect(resolveAccountOpeningFeeForEarningsRow(opts)).toBe(25);
    expect(resolveAccountOpeningFeeForEarningsRow(opts)).toBeNull();
    expect(set.has(driverId)).toBe(true);
  });

  it("Glovo with zero org default returns null on second row", () => {
    const set = applied();
    expect(
      resolveAccountOpeningFeeForEarningsRow({
        platform: "glovo",
        csvFee: null,
        orgDefault: 0,
        driverId,
        defaultAppliedForDriver: set,
      }),
    ).toBeNull();
  });
});

describe("resolvePlatformFeeForEarningsRow", () => {
  const driverId = "d1";
  const applied = () => new Set<string>();

  it("Bolt courier always returns 0", () => {
    expect(
      resolvePlatformFeeForEarningsRow({
        platform: "bolt_courier",
        csvFee: 100,
        orgDefault: 50,
        driverId,
        defaultAppliedForDriver: applied(),
      }),
    ).toBe(0);
  });

  it("Glovo uses CSV Taxa aplicatie when present", () => {
    const set = applied();
    expect(
      resolvePlatformFeeForEarningsRow({
        platform: "glovo",
        csvFee: -8.99,
        orgDefault: 0,
        driverId,
        defaultAppliedForDriver: set,
      }),
    ).toBe(8.99);
  });

  it("Glovo applies org default platform fee once per driver", () => {
    const set = applied();
    const opts = {
      platform: "glovo" as const,
      csvFee: null,
      orgDefault: 12.5,
      driverId,
      defaultAppliedForDriver: set,
    };
    expect(resolvePlatformFeeForEarningsRow(opts)).toBe(12.5);
    expect(resolvePlatformFeeForEarningsRow(opts)).toBeNull();
  });
});
