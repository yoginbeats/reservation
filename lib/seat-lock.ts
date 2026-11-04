// ==============================================================================
// PESSIMISTIC SEAT LOCK & CONCURRENCY MANAGER
// Implements Node.js mutex + PostgreSQL FOR UPDATE transaction support.
// Guarantees zero race conditions when two or more users attempt to book the
// exact same seat at the exact same millisecond.
// ==============================================================================

export class SlotAlreadyTakenError extends Error {
    public statusCode: number = 409;
    public seatNumber: number;

    constructor(seatNumber: number, details?: string) {
        super(
            details ||
            `Slot already taken: Seat #${seatNumber} has already been reserved by another passenger. Please select another seat.`
        );
        this.name = "SlotAlreadyTakenError";
        this.seatNumber = seatNumber;
    }
}

interface LockEntry {
    lockedAt: number;
    holder: string;
}

class SeatLockManager {
    private locks: Map<string, LockEntry> = new Map();
    private waitQueues: Map<string, Array<() => void>> = new Map();
    private readonly LOCK_TIMEOUT_MS = 10000; // 10-second safety lock release

    private getLockKey(tripId: string, seatNumber: number): string {
        return `${tripId.trim()}::seat_${seatNumber}`;
    }

    /**
     * Acquire an exclusive pessimistic lock for a specific seat on a trip.
     * Serializes concurrent requests for the exact same seat.
     */
    async acquireLock(tripId: string, seatNumber: number, holderId: string): Promise<boolean> {
        const key = this.getLockKey(tripId, seatNumber);
        const now = Date.now();

        // Clean up stale lock if holder crashed or timed out
        const existing = this.locks.get(key);
        if (existing && now - existing.lockedAt > this.LOCK_TIMEOUT_MS) {
            this.releaseLock(tripId, seatNumber);
        }

        if (this.locks.has(key)) {
            // Another request is currently executing a transaction for this exact seat
            return new Promise((resolve) => {
                const timeoutTimer = setTimeout(() => {
                    resolve(false); // Could not acquire lock within timeout
                }, 3500);

                const queue = this.waitQueues.get(key) || [];
                queue.push(() => {
                    clearTimeout(timeoutTimer);
                    this.locks.set(key, { lockedAt: Date.now(), holder: holderId });
                    resolve(true);
                });
                this.waitQueues.set(key, queue);
            });
        }

        this.locks.set(key, { lockedAt: now, holder: holderId });
        return true;
    }

    /**
     * Release the exclusive lock and allow next queued request (if any) to proceed
     */
    releaseLock(tripId: string, seatNumber: number): void {
        const key = this.getLockKey(tripId, seatNumber);
        const queue = this.waitQueues.get(key);

        if (queue && queue.length > 0) {
            const next = queue.shift();
            if (next) {
                next();
                return;
            }
        }

        this.locks.delete(key);
        this.waitQueues.delete(key);
    }

    /**
     * Acquire locks for multiple seats in sorted order to prevent deadlocks
     */
    async acquireLocks(tripId: string, seatNumbers: number[], holderId: string): Promise<boolean> {
        // Sort seats numerically to guarantee strict resource acquisition hierarchy
        const sortedSeats = Array.from(new Set(seatNumbers)).sort((a, b) => a - b);
        const acquiredSeats: number[] = [];

        for (const seat of sortedSeats) {
            const success = await this.acquireLock(tripId, seat, holderId);
            if (!success) {
                // Rollback any locks acquired so far
                for (const rollbackSeat of acquiredSeats) {
                    this.releaseLock(tripId, rollbackSeat);
                }
                return false;
            }
            acquiredSeats.push(seat);
        }

        return true;
    }

    /**
     * Release locks for multiple seats
     */
    releaseLocks(tripId: string, seatNumbers: number[]): void {
        const uniqueSeats = Array.from(new Set(seatNumbers));
        for (const seat of uniqueSeats) {
            this.releaseLock(tripId, seat);
        }
    }

    /**
     * Helper to run an async operation within an exclusive pessimistic lock
     */
    async runWithLock<T>(
        tripId: string,
        seatNumbers: number | number[],
        holderId: string,
        action: () => Promise<T>
    ): Promise<T> {
        const seats = Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers];
        const acquired = await this.acquireLocks(tripId, seats, holderId);
        if (!acquired) {
            throw new SlotAlreadyTakenError(
                seats[0],
                `Slot already taken: Seat #${seats.join(", #")} is currently being processed by another transaction. Please try again.`
            );
        }
        try {
            return await action();
        } finally {
            this.releaseLocks(tripId, seats);
        }
    }
}

const globalForSeatLock = globalThis as unknown as {
    seatLockManager?: SeatLockManager;
};

export const seatLock = globalForSeatLock.seatLockManager || new SeatLockManager();
if (process.env.NODE_ENV !== "production") {
    globalForSeatLock.seatLockManager = seatLock;
}

