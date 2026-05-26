SELECT
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'earnings_imports'
          AND column_name = 'reverted_by'
    ) AS earnings_imports_reverted_by_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'earnings_imports'
          AND column_name = 'reverted_at'
    ) AS earnings_imports_reverted_at_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'earnings_records'
          AND column_name = 'is_reversal'
    ) AS earnings_records_is_reversal_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'earnings_records'
          AND column_name = 'reversal_of_record_id'
    ) AS earnings_records_reversal_of_exists;
