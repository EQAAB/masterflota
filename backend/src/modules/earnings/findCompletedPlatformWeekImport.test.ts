import { describe, expect, it, vi } from "vitest";
import {
  duplicatePlatformWeekImportMessage,
  earningsPlatformLabel,
  findCompletedPlatformWeekImport,
} from "./findCompletedPlatformWeekImport";

describe("earningsPlatformLabel", () => {
  it("maps known platforms", () => {
    expect(earningsPlatformLabel("uber")).toBe("Uber");
    expect(earningsPlatformLabel("bolt_taxi")).toBe("Bolt Taxi");
  });
});

describe("duplicatePlatformWeekImportMessage", () => {
  it("includes platform, week, and optional file name", () => {
    expect(
      duplicatePlatformWeekImportMessage({
        id: "a",
        platform: "glovo",
        week_start: "2026-05-11",
        week_end: "2026-05-17",
        file_name: "glovo.csv",
        import_date: "2026-05-18",
      }),
    ).toBe(
      "Glovo earnings for 2026-05-11 → 2026-05-17 already imported (glovo.csv). Revert that import before uploading again.",
    );
  });
});

describe("findCompletedPlatformWeekImport", () => {
  it("queries completed imports for org/platform/week", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "imp-1",
          platform: "uber",
          week_start: "2026-05-11",
          week_end: "2026-05-17",
          file_name: "u.csv",
          import_date: "2026-05-18",
        },
      ],
    });
    const result = await findCompletedPlatformWeekImport(
      { query } as never,
      "org-1",
      "uber",
      "2026-05-11",
      "2026-05-17",
    );
    expect(result?.id).toBe("imp-1");
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'completed'"),
      ["org-1", "uber", "2026-05-11", "2026-05-17"],
    );
  });

  it("excludes the current import id when provided", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await findCompletedPlatformWeekImport(
      { query } as never,
      "org-1",
      "bolt",
      "2026-05-11",
      "2026-05-17",
      "imp-self",
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("id <> $5::uuid"),
      ["org-1", "bolt", "2026-05-11", "2026-05-17", "imp-self"],
    );
  });
});
