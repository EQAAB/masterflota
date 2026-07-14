SELECT
  (
    SELECT COUNT(*)::int
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_earnings_imports_org_platform_week_completed'
  ) AS unique_completed_index_exists,
  (
    SELECT COUNT(*)::int
    FROM (
      SELECT 1
      FROM earnings_imports
      WHERE status = 'completed'
      GROUP BY organization_id, platform, week_start, week_end
      HAVING COUNT(*) > 1
    ) d
  ) AS duplicate_completed_groups;
