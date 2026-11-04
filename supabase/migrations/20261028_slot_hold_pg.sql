-- ==============================================================================
-- POSTGRESQL / SUPABASE TEMPORARY SLOT HOLD MIGRATION
-- Adds hold_expires_at, status columns and automated 1-minute expiration sweeper
-- ==============================================================================

-- 1. Ensure columns exist on trip_seats
ALTER TABLE public.trip_seats 
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available',
    ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS held_by TEXT DEFAULT NULL;

-- 2. Cleanup Stored Function: Revert Expired Holds
CREATE OR REPLACE FUNCTION public.revert_expired_held_slots()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reverted_count INT;
BEGIN
    UPDATE public.trip_seats
    SET 
        status = 'available',
        is_available = TRUE,
        hold_expires_at = NULL,
        held_by = NULL
    WHERE 
        status = 'pending' 
        AND hold_expires_at IS NOT NULL 
        AND hold_expires_at <= NOW();
        
    GET DIAGNOSTICS v_reverted_count = ROW_COUNT;
    RETURN v_reverted_count;
END;
$$;

-- 3. If pg_cron is available, schedule the job every 1 minute
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'revert_expired_held_slots_job',
            '* * * * *',
            'SELECT public.revert_expired_held_slots();'
        );
    END IF;
END $$;
