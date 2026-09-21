import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
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
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data?.user) {
            const user = data.user
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'

            try {
                // Ensure profile exists for Google OAuth user
                await supabase.from('profiles').upsert({ id: user.id, full_name: fullName }, { onConflict: 'id' })

                // Ensure user role exists (default PASSENGER)
                const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
                if (!roleData) {
                    await supabase.from('user_roles').insert({ user_id: user.id, role: 'PASSENGER' })
                }
            } catch (err) {
                console.warn('OAuth profile sync warning:', err)
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
