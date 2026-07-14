-- Enforce one completed weekly import per org + platform + pay week.
-- Preview / failed / reverted imports are allowed (re-upload after revert).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM earnings_imports
    WHERE status = 'completed'
    GROUP BY organization_id, platform, week_start, week_end
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Migration 097 blocked: duplicate completed earnings_imports for the same organization/platform/week exist. Revert or clean up extras, then re-run.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_earnings_imports_org_platform_week_completed
  ON earnings_imports (organization_id, platform, week_start, week_end)
  WHERE status = 'completed';
