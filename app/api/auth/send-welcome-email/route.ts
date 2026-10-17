import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, firstName, lastName, phoneNumber } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Valued Passenger";

        // HTML Content for the Superlines Welcome Email
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
                    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e4e4e7; }
                    .header { background: linear-gradient(135deg, #b91c1c, #dc2626); padding: 32px 24px; text-align: center; color: #ffffff; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
                    .content { padding: 32px 24px; color: #18181b; }
                    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
                    .details-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; }
                    .detail-row:last-child { border-bottom: none; }
                    .detail-label { color: #71717a; }
                    .detail-value { font-weight: 600; color: #09090b; }
                    .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 20px; }
                    .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Superlines Bus Co.</h1>
                        <p>Official Online Reservation & Ticketing</p>
                    </div>
                    <div class="content">
                        <div class="greeting">Mabuhay, ${fullName}! 🎉</div>
                        <p>Your Superlines Passenger Account has been successfully created and verified.</p>
                        <p>You can now book bus schedules online, pay securely via PayMongo (GCash, Maya, Cards), and access your digital QR tickets anytime.</p>
                        
                        <div class="details-box">
                            <div class="detail-row">
                                <span class="detail-label">Passenger Name:</span>
                                <span class="detail-value">${fullName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Registered Email:</span>
                                <span class="detail-value">${email}</span>
                            </div>
                            ${phoneNumber ? `
                            <div class="detail-row">
                                <span class="detail-label">Contact Number:</span>
                                <span class="detail-value">${phoneNumber}</span>
                            </div>
                            ` : ''}
                            <div class="detail-row">
                                <span class="detail-label">Login Method:</span>
                                <span class="detail-value">Google Sign-In or Email & Password</span>
                            </div>
                        </div>

                        <p style="font-size: 13px; color: #52525b;">
                            <strong>Note:</strong> You can use both <em>"Continue with Google"</em> or log in with your email address and password whenever you visit.
                        </p>

                        <div style="text-align: center; margin-top: 24px;">
                            <a href="${req.headers.get("origin") || "http://localhost:3000"}/reservations" class="btn">
                                Book Your First Trip Now &rarr;
                            </a>
                        </div>
                    </div>
                    <div class="footer">
                        Superlines Transportation Company Inc. &bull; Cubao & Daet Terminals<br>
                        This is an automated notification. Please do not reply directly to this email.
                    </div>
                </div>
            </body>
            </html>
        `;

        // If RESEND_API_KEY is configured in .env.local, send live email
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            try {
                const resendResponse = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({
                        from: "Superlines Bus <onboarding@resend.dev>",
                        to: [email],
                        subject: "Welcome to Superlines! Your Account is Ready",
                        html: emailHtml,
                    }),
                });
                const resendData = await resendResponse.json();
                console.log("Resend API response:", resendData);
            } catch (mailErr) {
                console.warn("Live email send failed:", mailErr);
            }
        } else {
            console.log(`[Account Welcome Email Simulation] To: ${email} | Name: ${fullName}`);
        }

        return NextResponse.json({
            success: true,
            message: "Welcome email processed successfully.",
        });
    } catch (err: any) {
        console.error("Welcome email error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to process welcome email" },
            { status: 500 }
        );
    }
}
