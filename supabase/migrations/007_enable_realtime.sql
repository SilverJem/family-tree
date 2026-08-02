-- Enable Realtime for people and relationships tables
BEGIN;

-- Check if the publication exists, and add tables to it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE people, relationships;
    ELSE
        CREATE PUBLICATION supabase_realtime FOR TABLE people, relationships;
    END IF;
END
$$;

COMMIT;
