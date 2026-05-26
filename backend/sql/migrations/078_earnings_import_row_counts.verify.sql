SELECT
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'earnings_imports'
          AND column_name = 'total_rows'
    ) AS total_rows_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'earnings_imports'
          AND column_name = 'processed_rows'
    ) AS processed_rows_exists;
