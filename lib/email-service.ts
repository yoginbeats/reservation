import nodemailer from "nodemailer";

interface SendEmailParams {
    to: string | string[];
    subject: string;
    html: string;
    fromName?: string;
}

interface SendEmailResult {
    success: boolean;
    provider: "GMAIL_SMTP" | "CUSTOM_SMTP" | "RESEND" | "SIMULATION";
    messageId?: string;
    error?: string;
}

/**
 * Universal Production Email Dispatcher
 * Automatically detects whether Gmail SMTP, Custom SMTP, or Resend API is configured.
 */
export async function sendLiveEmail({
    to,
    subject,
    html,
    fromName = "Superlines Bus Co.",
}: SendEmailParams): Promise<SendEmailResult> {
    const recipients = Array.isArray(to) ? to : [to];
    const cleanRecipients = recipients.map((e) => e.trim().toLowerCase()).filter(Boolean);

    if (cleanRecipients.length === 0) {
        return {
            success: false,
            provider: "SIMULATION",
            error: "No valid recipient email address provided.",
        };
    }

    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || "djeugenerasco11@gmail.com";
    const gmailAppPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "zaxetukbahpgcdyz").replace(/\s+/g, "");
    const smtpHost = process.env.SMTP_HOST;
    const resendApiKey = process.env.RESEND_API_KEY;

    // =========================================================================
    // 1. GMAIL / CUSTOM SMTP DISPATCH (Free, sends to ANY Gmail address)
    // =========================================================================
    if (gmailUser && gmailAppPass) {
        try {
            const isCustomHost = Boolean(smtpHost && !smtpHost.includes("gmail"));
            const transporter = nodemailer.createTransport(
                isCustomHost
                    ? {
                          host: smtpHost,
                          port: Number(process.env.SMTP_PORT) || 465,
                          secure: (process.env.SMTP_SECURE || "true") === "true",
                          auth: {
                              user: gmailUser,
                              pass: gmailAppPass.replace(/\s+/g, ""), // clean spaces in app password
                          },
                      }
                    : {
                          service: "gmail",
                          auth: {
                              user: gmailUser,
                              pass: gmailAppPass.replace(/\s+/g, ""),
                          },
                      }
            );

            const senderAddress = process.env.SMTP_FROM || `"${fromName}" <${gmailUser}>`;

            const info = await transporter.sendMail({
                from: senderAddress,
                to: cleanRecipients.join(", "),
                subject,
                html,
            });

            console.log(`[Email Service] Live SMTP email delivered to ${cleanRecipients.join(", ")} (ID: ${info.messageId})`);
            return {
                success: true,
                provider: isCustomHost ? "CUSTOM_SMTP" : "GMAIL_SMTP",
                messageId: info.messageId,
            };
        } catch (smtpErr: any) {
            console.error("[Email Service] SMTP dispatch error:", smtpErr?.message || smtpErr);
            // Fall through to Resend if available
        }
    }

    // =========================================================================
    // 2. RESEND API DISPATCH
    // =========================================================================
    if (resendApiKey) {
        try {
            const fromEmail = process.env.RESEND_FROM || "Superlines Security <onboarding@resend.dev>";
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendApiKey.trim()}`,
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: cleanRecipients,
                    subject,
                    html,
                }),
            });

            const data = await res.json();
            if (res.ok && data?.id) {
                console.log(`[Email Service] Live Resend API email delivered to ${cleanRecipients.join(", ")} (ID: ${data.id})`);
                return {
                    success: true,
                    provider: "RESEND",
                    messageId: data.id,
                };
            } else {
                console.warn("[Email Service] Resend API returned error:", data);
            }
        } catch (resendErr: any) {
            console.error("[Email Service] Resend API fetch error:", resendErr?.message || resendErr);
        }
    }

    // =========================================================================
    // 3. FALLBACK / SIMULATION (When no credentials configured in .env yet)
    // =========================================================================
    console.warn(
        `[Email Service] No live email credentials configured. To send real emails to Gmail, add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local`
    );

    return {
        success: false,
        provider: "SIMULATION",
        error: "No live email provider configured. Please set GMAIL_USER & GMAIL_APP_PASSWORD or RESEND_API_KEY in .env.local.",
    };
}
