import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// ⚠️ BYPASS AUTH: Set to true ONLY for debugging if needed, strictly false for production
const DEV_BYPASS_AUTH = false

export default async function proxy(request: NextRequest) {
    // Update session for all requests
    const response = await updateSession(request)

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

    let user: any = null;
    let role: string = 'PASSENGER';

    try {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user || null;

        if (user) {
            role = user.user_metadata?.role || role;
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (roleData?.role) {
                role = roleData.role;
            }
        }
    } catch (err) {
        console.warn('Supabase Auth connection offline/paused in middleware:', err);
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
            case 'TELLER': return '/teller'
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
            return NextResponse.redirect(new URL('/teller', request.url))
        }
        if (user && role === 'CONDUCTOR') {
            return NextResponse.redirect(new URL('/conductor', request.url))
        }
        return response
    }

    // Protect /admin routes - require ADMIN role
    if (url.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (role !== 'ADMIN') {
            return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
        }
    }

    // Protect /teller routes - require TELLER or ADMIN role
    if (url.pathname.startsWith('/teller')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (role !== 'TELLER' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
        }
    }

    // Protect /conductor routes - require CONDUCTOR or ADMIN role
    if (url.pathname.startsWith('/conductor')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (role !== 'CONDUCTOR' && role !== 'ADMIN') {
            return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
        }
    }

    // Protect passenger routes (/dashboard, /book, /my-tickets) - require being logged in
    const passengerRoutes = ['/dashboard', '/book', '/my-tickets', '/reservations']
    if (passengerRoutes.some(p => url.pathname.startsWith(p))) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Redirect logged-in users away from auth pages to their respective dashboards
    const authPages = ['/login', '/register']
    const isAuthPage = authPages.some(path => url.pathname === path || url.pathname.startsWith(path + '/'))

    if (isAuthPage && user) {
        return NextResponse.redirect(new URL(getRoleHomePage(role), request.url))
    }

    return response
}


export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
