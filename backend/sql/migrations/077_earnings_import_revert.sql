-- Soft revert for completed earnings imports (negative mirror rows, no deletes)

ALTER TABLE earnings_imports
    ADD COLUMN IF NOT EXISTS reverted_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS reverted_at TIMESTAMPTZ;

ALTER TABLE earnings_imports DROP CONSTRAINT IF EXISTS earnings_imports_status_check;
ALTER TABLE earnings_imports
    ADD CONSTRAINT earnings_imports_status_check
    CHECK (status IN ('preview', 'completed', 'failed', 'reverted'));

ALTER TABLE earnings_records
    ADD COLUMN IF NOT EXISTS is_reversal BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS reversal_of_record_id UUID REFERENCES earnings_records(id);

CREATE INDEX IF NOT EXISTS idx_earnings_records_import_reversal
    ON earnings_records (import_id)
    WHERE is_reversal;

CREATE INDEX IF NOT EXISTS idx_earnings_records_reversal_of
    ON earnings_records (reversal_of_record_id)
    WHERE reversal_of_record_id IS NOT NULL;
