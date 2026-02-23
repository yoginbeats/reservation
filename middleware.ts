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

    const { data: { user } } = await supabase.auth.getUser()

    // Determine Role: Check metadata first, then fallback to DB
    let role = user?.user_metadata?.role

    if (user && !role) {
        try {
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single()

            if (roleData) {
                role = roleData.role
            }
        } catch (error) {
            console.error('Error fetching user role:', error)
        }
    }

    // Default to client if no role found
    if (!role) role = 'client'

    const url = new URL(request.url)

    // Define public paths that don't require authentication
    const publicPaths = ['/login', '/register']
    const isPublicPath = publicPaths.some(path => url.pathname === path || url.pathname.startsWith(path + '/'))

    // Protect root page - require authentication
    // Admins go directly to /admin dashboard, clients see the 2-card landing page
    if (url.pathname === '/') {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    // Protect /admin routes - require admin role
    if (url.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (role !== 'admin') {
            // Redirect non-admins to client dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Protect /dashboard routes - require being logged in
    if (url.pathname.startsWith('/dashboard')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Redirect logged-in users away from auth pages to their respective dashboards
    // Only redirect if they are visiting login or register. NOT landing page (/).
    const authPages = ['/login', '/register']
    const isAuthPage = authPages.some(path => url.pathname === path || url.pathname.startsWith(path + '/'))

    if (isAuthPage && user) {
        // Redirect based on role
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
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
