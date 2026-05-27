import { describe, expect, it } from "vitest";
import {
  inferPlatformFeeFromGrossNet,
  resolveAccountOpeningFeeForEarningsRow,
  resolvePlatformFeeForEarningsRow,
  resolvePlatformFeeWithGrossNetInference,
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

describe("inferPlatformFeeFromGrossNet", () => {
  it("infers fee from income + tips − net", () => {
    expect(inferPlatformFeeFromGrossNet(670.88, 661.89, 0)).toBeCloseTo(8.99, 2);
    expect(inferPlatformFeeFromGrossNet(100, 90, 5)).toBe(15);
  });

  it("returns null when gross or net missing", () => {
    expect(inferPlatformFeeFromGrossNet(null, 100, 0)).toBeNull();
    expect(inferPlatformFeeFromGrossNet(100, 100, 0)).toBeNull();
  });
});

describe("resolvePlatformFeeWithGrossNetInference", () => {
  it("falls back to gross−net for Glovo when Taxa aplicatie is absent", () => {
    const set = new Set<string>();
    const fee = resolvePlatformFeeWithGrossNetInference({
      platform: "glovo",
      csvFee: null,
      gross: 400,
      net: 360,
      tips: 0,
      orgDefault: 0,
      driverId: "d1",
      defaultAppliedForDriver: set,
    });
    expect(fee).toBe(40);
  });
});
