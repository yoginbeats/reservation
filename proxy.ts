import { type NextRequest, NextResponse } from 'next/server'

// 503 MAINTENANCE MODE - LOCKS DOWN ENTIRE WEB APP
// Returns HTTP 503 with X-Robots-Tag: noindex, nofollow, noarchive on every route
export default async function proxy(request: NextRequest) {
    return new NextResponse("Temporarily unavailable", {
        status: 503,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Robots-Tag": "noindex, nofollow, noarchive",
            "Retry-After": "86400",
        },
    });
}

export const config = {
    matcher: ['/:path*'],
}
