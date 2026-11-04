// ==============================================================================
// EXPRESS-SESSION & SYSTEM AUTH SESSION CONFIGURATION
// Configured with a strict 15-minute maxAge timeout for maximum security.
// ==============================================================================

export const SESSION_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes (900,000 ms)
export const SESSION_MAX_AGE_SECONDS = 15 * 60; // 900 seconds

export const sessionConfig = {
    secret: process.env.SESSION_SECRET || "superlines-transport-auth-session-key-2026",
    name: "superlines.sid",
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on every active request
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE_MS, // 15-minute timeout
        sameSite: "lax" as const,
        path: "/",
    },
};

/**
 * Returns cookie options for Next.js response cookies adhering to 15-minute timeout
 */
export function getSessionCookieOptions() {
    return {
        path: "/",
        sameSite: "lax" as const,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE_SECONDS, // 15 minutes
    };
}
