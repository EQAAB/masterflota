import { describe, expect, it, vi } from "vitest";
import {
  appendToExistingWeekPreviewMessage,
  appendToExistingWeekRequiredMessage,
  duplicatePlatformWeekImportMessage,
  earningsPlatformLabel,
  findCompletedPlatformWeekImport,
  toExistingWeekImportDto,
} from "./findCompletedPlatformWeekImport";

const sample = {
  id: "a",
  platform: "glovo",
  week_start: "2026-05-11",
  week_end: "2026-05-17",
  file_name: "glovo.csv",
  import_date: "2026-05-18",
} as const;

describe("earningsPlatformLabel", () => {
  it("maps known platforms", () => {
    expect(earningsPlatformLabel("uber")).toBe("Uber");
    expect(earningsPlatformLabel("bolt_taxi")).toBe("Bolt Taxi");
  });
});

describe("append / duplicate week messages", () => {
  it("preview message explains append is allowed", () => {
    expect(appendToExistingWeekPreviewMessage(sample)).toContain("already imported (glovo.csv)");
    expect(appendToExistingWeekPreviewMessage(sample)).toContain("add this file to the same pay week");
  });

  it("required message asks for confirm or revert", () => {
    expect(appendToExistingWeekRequiredMessage(sample)).toContain("Add to this week");
    expect(duplicatePlatformWeekImportMessage(sample)).toBe(appendToExistingWeekRequiredMessage(sample));
  });

  it("maps DTO for API responses", () => {
    expect(toExistingWeekImportDto(sample)).toEqual({
      id: "a",
      platform: "glovo",
      weekStart: "2026-05-11",
      weekEnd: "2026-05-17",
      fileName: "glovo.csv",
      importDate: "2026-05-18",
    });
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
