import { NextRequest, NextResponse } from "next/server";
import { verifySecurityOtp } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, otp, next = "/dashboard" } = body;

        const cleanEmail = email?.trim()?.toLowerCase();
        const cleanOtp = otp?.trim();

        if (!cleanEmail || !cleanOtp) {
            return NextResponse.json(
                { success: false, error: "Email and 6-digit verification code are required." },
                { status: 400 }
            );
        }

        const result = verifySecurityOtp(cleanEmail, cleanOtp);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || "Invalid or expired verification code." },
                { status: 400 }
            );
        }

        // Set verification cookie
        const res = NextResponse.json({
            success: true,
            verified: true,
            email: cleanEmail,
            redirectUrl: next || "/dashboard",
            message: "Double verification successful. Identity confirmed.",
        });

        // Set 24-hour verification cookie
        res.cookies.set("superlines_2fa_verified", "true", {
            path: "/",
            maxAge: 24 * 60 * 60,
            sameSite: "lax",
            httpOnly: false,
        });

        return res;
    } catch (err: any) {
        console.error("Error in verify-otp API:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to verify security OTP." },
            { status: 500 }
        );
    }
}
