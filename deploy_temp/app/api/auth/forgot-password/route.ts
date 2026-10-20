import { NextRequest, NextResponse } from "next/server";
import { findSystemCredential } from "@/lib/constants/credentials";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = (body.email || "").trim().toLowerCase();

        if (!email) {
            return NextResponse.json(
                { success: false, error: "Please enter your registered email address." },
                { status: 400 }
            );
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid email address." },
                { status: 400 }
            );
        }

        // 1. Check if email belongs to predefined staff/system personnel
        const staffCred = findSystemCredential(email);
        if (staffCred) {
            return NextResponse.json({
                success: true,
                isStaff: true,
                message: `The account ${email} is an assigned Superlines Staff (${staffCred.role}) account. Staff credentials are managed via the Central Admin Command Center. For instant access, sign in with your assigned staff password.`,
            });
        }

        // 2. Resolve the application origin
        const origin =
            req.headers.get("origin") ||
            req.nextUrl.origin ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            "http://localhost:3000";

        const redirectTo = `${origin}/auth/callback?next=/reset-password`;

        // 3. Request Supabase to send native password recovery email
        const supabase = await createClient();
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (resetErr) {
            console.warn("Supabase native resetPasswordForEmail warning:", resetErr);
            // If rate limited or error, we still try admin generateLink fallback
        }

        // 4. Generate recovery link via Supabase Admin for backup / custom email
        let actionLink: string | null = null;
        try {
            const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
                type: "recovery",
                email,
                options: {
                    redirectTo,
                },
            });

            if (!linkErr && linkData?.properties?.action_link) {
                actionLink = linkData.properties.action_link;
            }
        } catch (adminErr) {
            console.warn("Supabase admin generateLink notice:", adminErr);
        }

        // 5. If Resend API Key is configured, send official Superlines HTML template
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey && actionLink) {
            try {
                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 24px; color: #f4f4f5; }
                            .container { max-width: 560px; margin: 0 auto; background: #18181b; border-radius: 16px; overflow: hidden; border: 1px solid #27272a; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                            .header { background: linear-gradient(135deg, #b91c1c, #dc2626); padding: 32px 24px; text-align: center; color: #ffffff; }
                            .header h1 { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; }
                            .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; letter-spacing: 0.5px; }
                            .content { padding: 32px 24px; }
                            .title { font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
                            .text { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 12px 0; }
                            .btn-wrap { text-align: center; margin: 28px 0; }
                            .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 800; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4); }
                            .security-box { background: #27272a; border-left: 4px solid #ef4444; border-radius: 8px; padding: 12px 16px; margin: 24px 0; font-size: 12px; color: #d4d4d8; }
                            .footer { background: #09090b; padding: 20px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #27272a; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Superlines Bus Co.</h1>
                                <p>Official Online Reservation & Ticketing</p>
                            </div>
                            <div class="content">
                                <div class="title">Reset Your Superlines Password 🔒</div>
                                <p class="text">
                                    We received a request to reset the password for your Superlines Passenger account registered with <strong>${email}</strong>.
                                </p>
                                <p class="text">
                                    Click the button below to choose a new password. This link is secure and will expire in 1 hour.
                                </p>
                                <div class="btn-wrap">
                                    <a href="${actionLink}" class="btn">Reset Password Now &rarr;</a>
                                </div>
                                <div class="security-box">
                                    <strong>Didn't request this?</strong> If you did not ask for a password reset, you can safely ignore this email. Your password will remain unchanged.
                                </div>
                                <p class="text" style="font-size: 12px; word-break: break-all;">
                                    If the button doesn't work, copy and paste this link into your browser:<br>
                                    <span style="color: #ef4444;">${actionLink}</span>
                                </p>
                            </div>
                            <div class="footer">
                                &copy; 2026 Superlines Transportation Co. Inc. &bull; Cubao & Daet Central Terminals<br>
                                This is an automated notification. Please do not reply directly to this email.
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({
                        from: "Superlines Bus <security@resend.dev>",
                        to: [email],
                        subject: "Superlines Password Reset Request",
                        html: emailHtml,
                    }),
                });
            } catch (mailErr) {
                console.warn("Resend email delivery warning:", mailErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: `A password reset link has been sent to ${email}. Please check your inbox and click the link to set a new password.`,
        });
    } catch (err: any) {
        console.error("Forgot password error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to process password reset request." },
            { status: 500 }
        );
    }
}
