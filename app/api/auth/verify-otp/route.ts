import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
        }

        // 1. Verify OTP in our database
        const { data: verification, error: verifyError } = await supabaseAdmin
            .from('otp_verifications')
            .select('*')
            .eq('phone', phone)
            .eq('code', code)
            .single();

        if (verifyError || !verification) {
            return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
        }

        // Check expiration
        if (new Date(verification.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Code has expired' }, { status: 401 });
        }

        // 2. Ensure user exists in Supabase Auth
        let user;
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        user = users.find((u: any) => u.phone === phone);

        if (!user) {
            // Create user if not exists
            const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
                phone,
                phone_confirm: true,
                user_metadata: { role: 'client' }
            });
            if (createError) throw createError;
            user = newUser;
        } else {
            // Mark phone as confirmed if it wasn't
            await supabaseAdmin.auth.admin.updateUserById(user.id, { phone_confirm: true });
        }

        // 3. Generate a link to sign the user in
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            phone: phone,
        } as any);

        if (linkError) {
            console.error('Link Generation Error:', linkError);
            return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
        }

        // Delete the used OTP
        await supabaseAdmin.from('otp_verifications').delete().eq('phone', phone);

        return NextResponse.json({ 
            success: true, 
            action_link: linkData.properties.action_link 
        });
    } catch (error: any) {
        console.error('Verify OTP Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
