/**
 * Captures the payout details layout comparison mockup as PNG.
 * Requires: frontend dev server running (`npm run dev`), Playwright chromium.
 *
 * Usage: node scripts/capture-payout-mockup.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../../docs/design/payout-details-layout-comparison.png");
const BASE_URL = process.env.MOCKUP_BASE_URL ?? "http://localhost:5173/fleet";

const mockUser = {
  id: "mock-user",
  organizationId: "mock-org",
  email: "mock@fleetmanager.local",
  firstName: "Mock",
  lastName: "Admin",
  role: "admin",
};

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ user }) => {
      localStorage.setItem("fleet_auth_token", "mock-export-token");
      localStorage.setItem("fleet_auth_user", JSON.stringify(user));
    },
    { user: mockUser },
  );

  await page.goto(`${BASE_URL}/design/payout-details-comparison`, { waitUntil: "networkidle" });
  await page.waitForSelector(".fm-payout-mockup-row", { timeout: 15000 });
  await page.waitForTimeout(500);

  const exportEl = page.locator(".fm-payout-mockup-export");
  await mkdir(dirname(OUT_PATH), { recursive: true });
  await exportEl.screenshot({ path: OUT_PATH, type: "png" });

  await browser.close();
  console.log(`Saved mockup to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
