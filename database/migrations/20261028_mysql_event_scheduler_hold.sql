-- ==============================================================================
-- MYSQL EVENT SCHEDULER & TEMPORARY SLOT HOLD MIGRATION
-- Enables MySQL Event Scheduler and creates a background recurring event every 1 min
-- to revert expired 'pending' slots back to 'available'.
-- ==============================================================================

-- 1. Enable MySQL Global Event Scheduler
SET GLOBAL event_scheduler = ON;

-- 2. Ensure trip_seats table contains status and hold expiration timestamp columns
ALTER TABLE `trip_seats` 
    ADD COLUMN IF NOT EXISTS `status` ENUM('available', 'pending', 'booked') DEFAULT 'available',
    ADD COLUMN IF NOT EXISTS `hold_expires_at` DATETIME NULL,
    ADD COLUMN IF NOT EXISTS `held_by` VARCHAR(255) NULL;

-- 3. Create index on (status, hold_expires_at) for sub-millisecond query performance
CREATE INDEX IF NOT EXISTS `idx_trip_seats_pending_hold` 
ON `trip_seats` (`status`, `hold_expires_at`);

-- 4. Create MySQL Background Event: Revert expired 'pending' slots every 1 minute
DROP EVENT IF EXISTS `revert_expired_held_slots`;

DELIMITER $$

CREATE EVENT `revert_expired_held_slots`
ON SCHEDULE EVERY 1 MINUTE
STARTS CURRENT_TIMESTAMP
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Reverts pending slot holds older than 10 minutes back to available'
DO
BEGIN
    -- Atomic update: Revert expired pending slots to available status
    UPDATE `trip_seats`
    SET 
        `status` = 'available',
        `is_available` = 1,
        `hold_expires_at` = NULL,
        `held_by` = NULL
    WHERE 
        `status` = 'pending'
        AND `hold_expires_at` IS NOT NULL
        AND `hold_expires_at` <= NOW();
END $$

DELIMITER ;

-- ==============================================================================
-- VERIFICATION COMMANDS:
-- SHOW VARIABLES LIKE 'event_scheduler';
-- SHOW EVENTS FROM `superlines`;
-- ==============================================================================
