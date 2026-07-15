-- Expect: no unique index on completed platform/week imports.
SELECT to_regclass('public.idx_earnings_imports_org_platform_week_completed') IS NULL AS index_dropped;
