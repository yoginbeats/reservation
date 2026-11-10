import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendLiveEmail } from '@/lib/email-service'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    const origin = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'https://superlinestransportation.com')

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

                    // Send Welcome Email for new Google signups
                    if (user.email) {
                        sendLiveEmail({
                            to: user.email,
                            subject: "🎉 Welcome to Superlines! Your Google Account is Connected",
                            html: `
                                <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px;">
                                    <h2 style="color: #dc2626; margin-top: 0;">Mabuhay, ${fullName}! 🎉</h2>
                                    <p>Your Google Account <strong>${user.email}</strong> is now registered and verified with the <strong>Superlines Online Reservation & Ticketing Portal</strong>.</p>
                                    <p>You can now book your bus trips, select preferred seats, and access digital boarding tickets anytime.</p>
                                    <p style="margin-top: 24px;"><a href="${origin}/book" style="background: #dc2626; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Book a Trip Now &rarr;</a></p>
                                    <hr style="border: 0; border-top: 1px solid #f4f4f5; margin: 24px 0;" />
                                    <p style="font-size: 11px; color: #71717a;">Superlines Transportation Co., Inc. &bull; Official Digital Dispatch</p>
                                </div>
                            `,
                            fromName: "Superlines Passenger Portal",
                        }).catch((e) => console.warn("Google OAuth welcome email send notice:", e));
                    }
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

                const targetNext = !isComplete
                    ? `/complete-profile?next=${encodeURIComponent(next)}`
                    : next;

                // 🔒 REQUIRE 2-STEP DOUBLE VERIFICATION (OTP & SECONDARY GOOGLE ALERT)
                const verifyUrl = `${origin}/auth/verify-otp?email=${encodeURIComponent(user.email || "")}&next=${encodeURIComponent(targetNext)}`;
                return NextResponse.redirect(verifyUrl);
            } catch (err) {
                console.warn('OAuth profile sync warning:', err);
            }

            return NextResponse.redirect(`${origin}/auth/verify-otp?email=${encodeURIComponent(user.email || "")}&next=${encodeURIComponent(next)}`);
        }
    }

    // Return the user to login with an informative message if code exchange failed
    return NextResponse.redirect(`${origin}/login?error=The+link+has+expired+or+is+invalid.+Please+request+a+new+one.`)
}
