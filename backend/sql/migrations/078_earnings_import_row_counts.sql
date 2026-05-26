-- Track CSV row totals vs committed earnings rows (delete allowed when processed_rows = 0)

ALTER TABLE earnings_imports
    ADD COLUMN IF NOT EXISTS total_rows INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS processed_rows INTEGER NOT NULL DEFAULT 0;

UPDATE earnings_imports
SET processed_rows = COALESCE(record_count, 0),
    total_rows = COALESCE(
        NULLIF((detection_meta->>'rowCount')::text, '')::integer,
        COALESCE(record_count, 0),
        0
    )
WHERE processed_rows = 0 AND total_rows = 0;
