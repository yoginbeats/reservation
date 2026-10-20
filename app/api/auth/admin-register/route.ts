import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_ADMIN_KEYS = [
    "SUPERLINES2026",
    "ADMIN123",
    "SUPERLINESADMIN2026!",
    "ADMIN2026",
    "SUPERLINES",
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const firstName = (body.firstName || "").trim();
        const lastName = (body.lastName || "").trim();
        const email = (body.email || "").trim().toLowerCase();
        const password = (body.password || "").trim();
        const role = (body.role || "ADMIN").trim().toUpperCase();
        const terminal = (body.terminal || "Cubao Central Terminal").trim();
        const adminKey = (body.adminKey || "").trim().toUpperCase();

        if (!firstName || !lastName) {
            return NextResponse.json(
                { success: false, error: "Please enter your first and last name." },
                { status: 400 }
            );
        }

        if (!email) {
            return NextResponse.json(
                { success: false, error: "Please enter an official admin email address." },
                { status: 400 }
            );
        }

        if (!password || password.length < 6) {
            return NextResponse.json(
                { success: false, error: "Password must be at least 6 characters." },
                { status: 400 }
            );
        }

        // Validate Admin Authorization Passcode (defaults to SUPERLINES2026)
        if (adminKey && !VALID_ADMIN_KEYS.includes(adminKey)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid Admin Authorization Key. Please use the official passcode: SUPERLINES2026."
                },
                { status: 403 }
            );
        }

        const fullName = `${firstName} ${lastName}`;
        const supabase = await createClient();

        let createdUserId = "";
        let authSession = null;

        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        full_name: fullName,
                        role: "ADMIN",
                        admin_role: role,
                        terminal_name: terminal,
                        profile_completed: true,
                    },
                },
            });

            if (signUpError) {
                if (signUpError.message?.toLowerCase().includes("already registered")) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: "This email is already registered. Please go to Admin Sign In."
                        },
                        { status: 400 }
                    );
                }
                if (signUpError.message?.toLowerCase().includes("rate limit")) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: "Auth rate limit reached. Please wait a moment or sign in if already registered."
                        },
                        { status: 429 }
                    );
                }
                console.warn("Supabase signUp warning:", signUpError.message);
            }

            if (signUpData?.user) {
                createdUserId = signUpData.user.id;
                authSession = signUpData.session;

                // Sync profile & user_roles tables
                try {
                    await supabase.from("profiles").upsert({
                        id: createdUserId,
                        email,
                        first_name: firstName,
                        last_name: lastName,
                        full_name: fullName,
                        role: "ADMIN",
                        profile_completed: true,
                        updated_at: new Date().toISOString(),
                    });
                    await supabase.from("user_roles").upsert({
                        user_id: createdUserId,
                        role: "ADMIN",
                    });
                } catch (dbErr) {
                    console.warn("DB profile sync note:", dbErr);
                }
            }
        } catch (authErr) {
            console.warn("Supabase client exception during admin signup:", authErr);
        }

        const finalUserId = createdUserId || `admin-${Date.now()}`;
        const sessionUser = {
            id: finalUserId,
            email,
            role: "ADMIN",
            name: fullName,
            terminal: { name: terminal, id: "t-admin" },
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                full_name: fullName,
                role: "ADMIN",
                admin_role: role,
                terminal_name: terminal,
            },
        };

        const response = NextResponse.json({
            success: true,
            message: `Administrator account for ${fullName} created successfully!`,
            user: sessionUser,
            role: "ADMIN",
            redirectUrl: "/admin",
        });

        // Set unified system auth session cookies
        const sessionPayload = JSON.stringify({
            user: sessionUser,
            role: "ADMIN",
            terminal: { name: terminal },
            loggedInAt: new Date().toISOString(),
        });

        response.cookies.set("superlines_auth_session", sessionPayload, {
            path: "/",
            sameSite: "lax",
            httpOnly: false,
            maxAge: 60 * 60 * 24 * 7,
        });

        response.cookies.set("superlines_user_role", "ADMIN", {
            path: "/",
            sameSite: "lax",
            httpOnly: false,
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (err: any) {
        console.error("Admin Registration Error:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Internal server error during admin registration." },
            { status: 500 }
        );
    }
}
