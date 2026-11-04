// ==============================================================================
// RATE LIMITER & BRUTE-FORCE DEFENSE
// Enforces: Max 10 requests per 15 minutes per IP for booking and login endpoints.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
    count: number;
    resetTime: number; // Timestamp in ms
}

class InMemoryRateLimiter {
    private hits: Map<string, RateLimitRecord> = new Map();
    private readonly cleanupIntervalMs = 60 * 1000; // Cleanup stale records every minute

    constructor() {
        if (typeof setInterval !== "undefined") {
            setInterval(() => this.cleanup(), this.cleanupIntervalMs);
        }
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, record] of this.hits.entries()) {
            if (now >= record.resetTime) {
                this.hits.delete(key);
            }
        }
    }

    /**
     * Check and record a hit for a given key (IP + endpoint)
     */
    check(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const existing = this.hits.get(key);

        if (!existing || now >= existing.resetTime) {
            // New or reset window
            const record: RateLimitRecord = {
                count: 1,
                resetTime: now + windowMs,
            };
            this.hits.set(key, record);
            return {
                allowed: true,
                remaining: maxRequests - 1,
                resetTime: record.resetTime,
            };
        }

        if (existing.count >= maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: existing.resetTime,
            };
        }

        existing.count += 1;
        return {
            allowed: true,
            remaining: maxRequests - existing.count,
            resetTime: existing.resetTime,
        };
    }
}

const globalForLimiter = globalThis as unknown as {
    superlinesRateLimiter?: InMemoryRateLimiter;
};

export const rateLimiter = globalForLimiter.superlinesRateLimiter || new InMemoryRateLimiter();
if (process.env.NODE_ENV !== "production") {
    globalForLimiter.superlinesRateLimiter = rateLimiter;
}

/**
 * Extract client IP address safely from request headers
 */
export function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
    return "127.0.0.1";
}

/**
 * Helper to enforce rate limiting on Next.js Route Handlers.
 * In Stealth Mode (default): Disguises blocks as natural authentication failures
 * or standard client messages with zero technical footprint (no 429 status code, no leaked headers).
 */
export async function enforceRateLimit(
    req: NextRequest,
    endpointKey: string,
    maxRequests: number = 10,
    windowMs: number = 15 * 60 * 1000, // 15 minutes default
    stealthMode: boolean = true
): Promise<NextResponse | null> {
    const ip = getClientIp(req);
    const key = `${endpointKey}::${ip}`;
    const result = rateLimiter.check(key, maxRequests, windowMs);

    if (!result.allowed) {
        if (stealthMode) {
            // Tarpit delay: 1.2s silent slowdown to neutralize automated brute-force bots
            await new Promise((resolve) => setTimeout(resolve, 1200));

            // Return generic, clean error response based on endpoint with zero technical leakage
            if (endpointKey.includes("login") || endpointKey.includes("auth")) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Invalid email or password. Please check your credentials and try again.",
                    },
                    { status: 401 }
                );
            }

            return NextResponse.json(
                {
                    success: false,
                    error: "Unable to process request at this time. Please refresh and try again.",
                },
                { status: 400 }
            );
        }

        // Visible / Debug fallback
        const minutesLeft = Math.ceil((result.resetTime - Date.now()) / (60 * 1000));
        return NextResponse.json(
            {
                success: false,
                error: `Too many attempts from this IP. Please try again after ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
            },
            { status: 429 }
        );
    }

    return null;
}

/**
 * Standard express-rate-limit configuration object for Express server usage
 */
export const expressRateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: false, // Hidden headers in stealth mode
    legacyHeaders: false,
    message: {
        success: false,
        error: "Invalid email or password. Please check your credentials and try again.",
    },
};

