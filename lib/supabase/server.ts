import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tvyibzqxruhywdlsugbo.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2eWlienF4cnVoeXdkbHN1Z2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MzExNDUsImV4cCI6MjA4NjEwNzE0NX0.kdEua46esGGCuCUj3T-nQs5r1y4-nU5flk0jPFQZK-w",
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

export const getRole = async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { role: 'client', branch: null }

    const email = user.email

    // Whitelist for branch admins
    if (email === 'superlinescubao@admin.com') return { role: 'branch_admin', branch: 'Cubao' }
    if (email === 'superlinespitx@admin.com') return { role: 'branch_admin', branch: 'PITX' }
    if (email === 'superlinesdaet@admin.com') return { role: 'branch_admin', branch: 'Daet' }
    if (email === 'superlines@admin.com') return { role: 'admin', branch: null }

    // Fallback to user_metadata or DB roles
    let role = user.user_metadata?.role
    if (!role) {
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()
        role = roleData?.role || 'client'
    }

    return { role, branch: null }
}
