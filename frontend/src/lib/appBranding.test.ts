import { describe, expect, it, beforeEach, vi } from "vitest";

describe("getAppBranding", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("defaults to Fleet Manager when env is unset", async () => {
    vi.stubEnv("VITE_APP_NAME", "");
    const { getAppBranding } = await import("./appBranding");
    expect(getAppBranding().appName).toBe("Fleet Manager");
    expect(getAppBranding().logoMonogram).toBe("FM");
  });

  it("reads MasterFlota branding from env", async () => {
    vi.stubEnv("VITE_APP_NAME", "MasterFlota");
    vi.stubEnv("VITE_APP_LOGO_MONOGRAM", "MF");
    vi.stubEnv("VITE_MARKETING_URL", "https://masterflota.com");
    vi.stubEnv("VITE_COMPANY_NAME", "EQAAB");
    vi.stubEnv("VITE_COMPANY_URL", "https://eqaab.com");
    const { getAppBranding } = await import("./appBranding");
    const branding = getAppBranding();
    expect(branding.appName).toBe("MasterFlota");
    expect(branding.logoMonogram).toBe("MF");
    expect(branding.marketingUrl).toBe("https://masterflota.com");
    expect(branding.companyName).toBe("EQAAB");
    expect(branding.companyUrl).toBe("https://eqaab.com");
  });
});
