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
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tvyibzqxruhywdlsugbo.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2eWlienF4cnVoeXdkbHN1Z2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzExNDUsImV4cCI6MjA4NjEwNzE0NX0.kdEua46esGGCuCUj3T-nQs5r1y4-nU5flk0jPFQZK-w",
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

    // Determine Role: Check emails first for branch admins
    let role = user?.user_metadata?.role
    let branch = null

    if (user?.email === 'superlinescubao@admin.com') {
        role = 'branch_admin'
        branch = 'Cubao'
    } else if (user?.email === 'superlinespitx@admin.com') {
        role = 'branch_admin'
        branch = 'PITX'
    } else if (user?.email === 'superlinesdaet@admin.com') {
        role = 'branch_admin'
        branch = 'Daet'
    } else if (user?.email === 'superlines@admin.com') {
        role = 'admin'
    }

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

    // Protect root page
    if (url.pathname === '/') {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
        if (role === 'branch_admin' && branch) {
            return NextResponse.redirect(new URL(`/admin/${branch.toLowerCase()}`, request.url))
        }
    }

    // Protect /admin routes
    if (url.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (role !== 'admin' && role !== 'branch_admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Specific restrictions for Branch Admins
        if (role === 'branch_admin' && branch) {
            // Redirect from generic /admin to their specific branch page
            if (url.pathname === '/admin') {
                return NextResponse.redirect(new URL(`/admin/${branch.toLowerCase()}`, request.url))
            }

            // Block access to Settings, Trips, and Buses
            const restrictedPaths = ['/admin/settings', '/admin/trips', '/admin/buses']
            if (restrictedPaths.some(path => url.pathname.startsWith(path))) {
                return NextResponse.redirect(new URL(`/admin/${branch.toLowerCase()}`, request.url))
            }
        }
    }

    // Protect /dashboard routes
    if (url.pathname.startsWith('/dashboard')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Auth redirection
    const authPages = ['/login', '/register']
    const isAuthPage = authPages.some(path => url.pathname === path || url.pathname.startsWith(path + '/'))

    if (isAuthPage && user) {
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
        if (role === 'branch_admin' && branch) {
            return NextResponse.redirect(new URL(`/admin/${branch}`, request.url))
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
