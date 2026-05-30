SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicle_history'
ORDER BY ordinal_position;

SELECT conname
FROM pg_constraint
WHERE conrelid = 'vehicle_history'::regclass
  AND contype = 'c'
  AND conname LIKE '%event_type%';
