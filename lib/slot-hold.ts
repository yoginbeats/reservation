// ==============================================================================
// TEMPORARY SLOT HOLD & BACKGROUND EXPIRATION SWEEPER
// Holds slot for 10 minutes when clicked; automatically reverts to available.
// ==============================================================================

import { seatLock, SlotAlreadyTakenError } from "./seat-lock";

export interface SlotHoldEntry {
    tripId: string;
    seatNumber: number;
    heldBy: string; // Session ID or client IP
    status: "pending" | "confirmed" | "available";
    heldAt: number; // Timestamp ms
    holdExpiresAt: number; // Timestamp ms (heldAt + 10 minutes)
}

export const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes

class SlotHoldManager {
    private holds: Map<string, SlotHoldEntry> = new Map();
    private sweeperTimer: NodeJS.Timeout | null = null;

    constructor() {
        // Start background cleaner event running every 1 minute
        if (typeof setInterval !== "undefined") {
            this.sweeperTimer = setInterval(() => {
                this.revertExpiredHolds();
            }, 60 * 1000); // 1 minute
        }
    }

    private getKey(tripId: string, seatNumber: number): string {
        return `${tripId.trim()}::seat_${seatNumber}`;
    }

    /**
     * Temporary slot hold: When a customer clicks a slot, update status to 'pending'
     * and set hold_expires_at to NOW() + 10 minutes.
     * Uses pessimistic lock to ensure only one customer gets the hold.
     */
    async holdSlot(
        tripId: string,
        seatNumber: number,
        heldBy: string
    ): Promise<{ success: boolean; holdExpiresAt: number; remainingSeconds: number }> {
        const key = this.getKey(tripId, seatNumber);

        return await seatLock.runWithLock(tripId, seatNumber, heldBy, async () => {
            const now = Date.now();
            const existing = this.holds.get(key);

            // If currently held by someone else and not expired
            if (existing && existing.status === "pending" && existing.heldBy !== heldBy && now < existing.holdExpiresAt) {
                const secondsLeft = Math.ceil((existing.holdExpiresAt - now) / 1000);
                throw new SlotAlreadyTakenError(
                    seatNumber,
                    `Slot already taken: Seat #${seatNumber} is currently held by another passenger. Hold expires in ${secondsLeft}s.`
                );
            }

            const expiresAt = now + HOLD_DURATION_MS;
            const entry: SlotHoldEntry = {
                tripId,
                seatNumber,
                heldBy,
                status: "pending",
                heldAt: now,
                holdExpiresAt: expiresAt,
            };

            this.holds.set(key, entry);

            return {
                success: true,
                holdExpiresAt: expiresAt,
                remainingSeconds: Math.ceil(HOLD_DURATION_MS / 1000),
            };
        });
    }

    /**
     * Release a hold explicitly (e.g. user unselects seat or cancels)
     */
    releaseHold(tripId: string, seatNumber: number, heldBy?: string): boolean {
        const key = this.getKey(tripId, seatNumber);
        const existing = this.holds.get(key);
        if (existing) {
            if (!heldBy || existing.heldBy === heldBy) {
                this.holds.delete(key);
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a seat is currently held
     */
    isSeatHeld(tripId: string, seatNumber: number, requestingHolder?: string): boolean {
        const key = this.getKey(tripId, seatNumber);
        const existing = this.holds.get(key);
        if (!existing) return false;

        const now = Date.now();
        if (now >= existing.holdExpiresAt) {
            // Revert expired hold back to available
            this.holds.delete(key);
            return false;
        }

        if (requestingHolder && existing.heldBy === requestingHolder) {
            return false; // User's own hold is valid for them
        }

        return existing.status === "pending";
    }

    /**
     * Background Event: Revert expired 'pending' slots back to 'available'
     * Runs every 1 minute.
     */
    revertExpiredHolds(): { revertedCount: number } {
        const now = Date.now();
        let revertedCount = 0;

        for (const [key, entry] of this.holds.entries()) {
            if (entry.status === "pending" && now >= entry.holdExpiresAt) {
                this.holds.delete(key);
                revertedCount++;
                console.log(`[Slot Sweeper] Automatically reverted expired held seat #${entry.seatNumber} on trip ${entry.tripId} back to available.`);
            }
        }

        return { revertedCount };
    }

    /**
     * Get all currently active holds for a trip
     */
    getActiveHoldsForTrip(tripId: string): SlotHoldEntry[] {
        const now = Date.now();
        const active: SlotHoldEntry[] = [];
        for (const entry of this.holds.values()) {
            if (entry.tripId === tripId && entry.status === "pending" && now < entry.holdExpiresAt) {
                active.push(entry);
            }
        }
        return active;
    }
}

const globalForSlotHold = globalThis as unknown as {
    superlinesSlotHoldManager?: SlotHoldManager;
};

export const slotHoldManager = globalForSlotHold.superlinesSlotHoldManager || new SlotHoldManager();
if (process.env.NODE_ENV !== "production") {
    globalForSlotHold.superlinesSlotHoldManager = slotHoldManager;
}
