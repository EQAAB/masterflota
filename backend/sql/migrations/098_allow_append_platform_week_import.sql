-- Allow multiple completed imports for the same org + platform + pay week
-- (month-split platform reports: e.g. Mon–month-end + month-start–Sun).
-- Application still requires an explicit appendToExistingWeek flag on commit.

DROP INDEX IF EXISTS idx_earnings_imports_org_platform_week_completed;
