import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

export const getUserWithRoleAndTerminal = async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { user: null, role: null, terminal: null }
    }

    let role = user.user_metadata?.role
    let terminal = null

    // Check user_roles table
    const { data: roleData } = await supabase
        .from('user_roles')
        .select(`
            role,
            terminal_id,
            terminals (
                id,
                name,
                location
            )
        `)
        .eq('user_id', user.id)
        .single()

    if (roleData) {
        role = roleData.role || role
        const t = roleData.terminals as any
        terminal = Array.isArray(t) ? t[0] : t
    }

    if (!role) {
        role = 'PASSENGER'
    }

    // Standardize legacy 'client' role to PASSENGER
    if (role === 'client') role = 'PASSENGER'
    if (role === 'admin') role = 'ADMIN'

    return { user, role, terminal }
}

export const getRole = async () => {
    const { role } = await getUserWithRoleAndTerminal()
    return role || 'PASSENGER'
}

