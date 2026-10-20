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
            const meta = user.user_metadata || {}
            const fullName = meta.full_name || meta.name || `${meta.given_name || ''} ${meta.family_name || ''}`.trim() || user.email?.split('@')[0] || 'Passenger'

            try {
                // Check if user's profile already has complete details
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('profile_completed, phone_number, address')
                    .eq('id', user.id)
                    .maybeSingle();

                const isComplete = existingProfile?.profile_completed || (existingProfile?.phone_number && existingProfile?.address);

                // Ensure basic record exists if not yet present
                if (!existingProfile) {
                    await supabase.from('profiles').upsert(
                        {
                            id: user.id,
                            email: user.email,
                            full_name: fullName,
                            first_name: meta.given_name || meta.first_name || '',
                            last_name: meta.family_name || meta.last_name || '',
                            profile_completed: false
                        },
                        { onConflict: 'id' }
                    );
                }

                // Ensure user role exists (default PASSENGER)
                const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
                if (!roleData) {
                    await supabase.from('user_roles').insert({ user_id: user.id, role: 'PASSENGER' });
                }

                // If user is resetting password, allow them to proceed straight to /reset-password
                if (next === '/reset-password' || next.startsWith('/reset-password')) {
                    return NextResponse.redirect(`${origin}${next}`);
                }

                // If profile details are incomplete, redirect them to the completion form!
                if (!isComplete) {
                    return NextResponse.redirect(`${origin}/complete-profile?next=${encodeURIComponent(next)}`);
                }
            } catch (err) {
                console.warn('OAuth profile sync warning:', err);
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to login with an informative message if code exchange failed
    return NextResponse.redirect(`${origin}/login?error=The+link+has+expired+or+is+invalid.+Please+request+a+new+one.`)
}
