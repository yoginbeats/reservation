import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// ==============================================================================
// 🚧 MAINTENANCE MODE TOGGLE
// Set to true to display 503 maintenance page on the live public domain.
// Note: Localhost (127.0.0.1 / localhost) ALWAYS bypasses this so you can develop & test!
// ==============================================================================
export const MAINTENANCE_MODE = false

// ⚠️ BYPASS AUTH: Set to true ONLY for debugging if needed, strictly false for production
const DEV_BYPASS_AUTH = false

export default async function proxy(request: NextRequest) {
    const host = request.headers.get('host') || ''
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1')

    // If maintenance mode is active and not on localhost, serve 503 maintenance page
    if (MAINTENANCE_MODE && !isLocal) {
        return new NextResponse(
            `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Under Maintenance | Superlines</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #09090b;
        color: #f4f4f5;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        box-sizing: border-box;
      }
      .card {
        max-width: 520px;
        width: 100%;
        background: #18181b;
        border: 2px solid rgba(234, 179, 8, 0.6);
        border-radius: 24px;
        padding: 44px 32px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      }
      .badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 9999px;
        background: rgba(234, 179, 8, 0.15);
        color: #facc15;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 20px;
        border: 1px solid rgba(234, 179, 8, 0.3);
      }
      h1 {
        font-size: 28px;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 12px 0;
      }
      p {
        font-size: 15px;
        color: #a1a1aa;
        line-height: 1.6;
        margin: 0 0 20px 0;
      }
      .notice {
        margin-top: 28px;
        padding-top: 22px;
        border-top: 1px solid #27272a;
        font-size: 12px;
        color: #71717a;
        line-height: 1.5;
      }
      .notice strong {
        color: #d4d4d8;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">System Maintenance</div>
      <h1>We’ll be back soon</h1>
      <p>Temporary maintenance is currently in progress. The online booking and reservation system is temporarily unavailable.</p>
      <div class="notice">
        <strong>Academic Project Notice</strong><br>
        This portal is for academic project purposes only. For actual passenger bus trips and bookings, please proceed to your nearest official Superlines terminal.
      </div>
    </div>
  </body>
</html>`,
            {
                status: 503,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-Robots-Tag': 'noindex, nofollow, noarchive',
                    'Retry-After': '86400',
                },
            }
        )
    }

    // Update session for all requests
    const response = await updateSession(request)
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')

    // Skip all auth checks if DEV_BYPASS_AUTH is enabled
    if (DEV_BYPASS_AUTH) {
        return response
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                },
            },
        }
    )

    let user: any = null
    let role: string = 'PASSENGER'

    // 1. Check system session cookie for instant, zero-delay authentication
    const systemSessionCookie = request.cookies.get('superlines_auth_session')?.value
    if (typeof systemSessionCookie === 'string') {
        try {
            const parsed = JSON.parse(decodeURIComponent(systemSessionCookie))
            if (parsed?.user) {
                user = parsed.user
                role = parsed.role || user.role || user.user_metadata?.role || 'PASSENGER'
            }
        } catch {}
    }

    // 2. Fallback to Supabase Database Auth if not logged in via system session
    if (!user) {
        try {
            const { data: userData } = await supabase.auth.getUser()
            user = userData?.user || null

            if (user) {
                role = user.user_metadata?.role || role
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single()

                if (roleData && typeof (roleData as any).role === 'string') {
                    role = (roleData as any).role
                }
            }
        } catch (err) {
            console.warn('Supabase Auth connection offline/paused in middleware:', err)
        }
    }

    // Default & Standardize role string
    if (!role) role = 'PASSENGER'
    if (role === 'admin') role = 'ADMIN'
    if (role === 'client') role = 'PASSENGER'

    const url = new URL(request.url)

    // Helper to get role home page
    const getRoleHomePage = (userRole: string) => {
        switch (userRole) {
            case 'ADMIN': return '/admin'
            case 'TELLER': return '/teller/walk-in'
            case 'CONDUCTOR': return '/conductor'
            default: return '/dashboard'
        }
    }

    // Root page behavior
    if (url.pathname === '/') {
        if (user && role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
        if (user && role === 'TELLER') {
            return NextResponse.redirect(new URL('/teller/walk-in', request.url))
        }
        if (user && role === 'CONDUCTOR') {
            return NextResponse.redirect(new URL('/conductor', request.url))
        }
        return response
    }

    // Protect /admin routes - require ADMIN role
    if (url.pathname.startsWith('/admin')) {
        if (user && role !== 'ADMIN') {
            return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
        }
        if (url.pathname === '/admin/login' || url.pathname === '/admin/register') {
            if (user && role === 'ADMIN') {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
            return response
        }
        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
        if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
        }
    }

    // Protect /api/admin routes - require ADMIN role for mutations
    // Allow public read GET for trips/routes/buses so passenger and teller portals can read schedules seamlessly
    // Allow TELLER role to sync counter walk-in sales with /api/admin/payments
    if (url.pathname.startsWith('/api/admin')) {
        const isPublicRead = request.method === 'GET' && (
            url.pathname.startsWith('/api/admin/trips') ||
            url.pathname.startsWith('/api/admin/routes') ||
            url.pathname.startsWith('/api/admin/buses')
        );
        const isTellerBookingSync = (role === 'TELLER' || role === 'ADMIN') && (
            url.pathname.startsWith('/api/admin/payments') ||
            url.pathname.startsWith('/api/admin/bookings')
        );
        if (!isPublicRead && !isTellerBookingSync && (!user || role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: 'Unauthorized access: Main Admin privileges required.' }, { status: 403 })
        }
    }

    // Protect /teller routes - require TELLER or ADMIN role
    if (url.pathname.startsWith('/teller')) {
        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
        if (role !== 'TELLER' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
        }
    }

    // Protect /conductor routes - require CONDUCTOR or ADMIN role
    if (url.pathname.startsWith('/conductor')) {
        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
        if (role !== 'CONDUCTOR' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
        }
    }

    // Protect passenger private routes (/dashboard, /my-tickets, /complete-profile) - require being logged in
    const passengerRoutes = ['/dashboard', '/my-tickets', '/reservations', '/complete-profile']
    if (passengerRoutes.some(p => url.pathname.startsWith(p))) {
        if (!user) {
            const redirectUrl = encodeURIComponent(url.pathname + url.search)
            return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}&notice=login_required`, request.url))
        }
    }

    // Redirect logged-in users away from auth pages to their respective dashboards
    const authPages = ['/login', '/register', '/auth/verify-otp']
    const isAuthPage = authPages.some(path => url.pathname === path || url.pathname.startsWith(path + '/'))

    if (url.pathname.includes('/auth/verify-otp')) {
        return NextResponse.redirect(new URL(user ? getRoleHomePage(role) : '/login', request.url))
    }

    if (isAuthPage && user) {
        return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
    }

    // Helmet Secure HTTP Headers
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    response.headers.set('X-DNS-Prefetch-Control', 'on')

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
