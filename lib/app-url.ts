/**
 * Resolves the canonical public origin URL for Superlines Bus Portal.
 * Guarantees that links in emails, PayMongo GCash redirects, and OAuth callbacks
 * resolve directly to the live domain: https://superlinestransportation.com
 */
export function resolveAppOrigin(req?: any): string {
    const liveProductionUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://superlinestransportation.com";

    if (!req) return liveProductionUrl;

    try {
        const getHeader = (name: string): string | null => {
            if (typeof req.headers?.get === "function") {
                return req.headers.get(name);
            }
            if (req.headers && typeof req.headers === "object") {
                return req.headers[name] || req.headers[name.toLowerCase()] || null;
            }
            return null;
        };

        const host = getHeader("x-forwarded-host") || getHeader("host");
        const proto = getHeader("x-forwarded-proto") || (host && host.includes("localhost") ? "http" : "https");

        if (host) {
            return `${proto}://${host}`;
        }

        const origin = getHeader("origin") || req.nextUrl?.origin;
        if (origin) {
            return origin;
        }
    } catch {
        // Fallback to production URL on any error
    }

    return liveProductionUrl;
}

