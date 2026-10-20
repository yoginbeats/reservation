import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authErr } = await supabase.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Please log in first." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            firstName = "",
            middleName = "",
            lastName = "",
            birthdate = null,
            age = null,
            phoneNumber = "",
            address = "",
            password = "",
        } = body;

        const cleanFirst = String(firstName || "").trim();
        const cleanMiddle = String(middleName || "").trim();
        const cleanLast = String(lastName || "").trim();
        const cleanPhone = String(phoneNumber || "").trim();
        const cleanAddress = String(address || "").trim();
        const fullName = `${cleanFirst} ${cleanMiddle ? cleanMiddle + " " : ""}${cleanLast}`.trim();
        const parsedAge = age !== null && age !== "" && !isNaN(Number(age)) ? parseInt(String(age), 10) : null;
        const validBirthdate = birthdate && String(birthdate).match(/^\d{4}-\d{2}-\d{2}$/) ? birthdate : null;

        if (!cleanFirst || !cleanLast) {
            return NextResponse.json(
                { success: false, error: "First name and last name are required." },
                { status: 400 }
            );
        }

        if (!cleanPhone) {
            return NextResponse.json(
                { success: false, error: "Phone number or email address is required." },
                { status: 400 }
            );
        }

        if (!cleanAddress) {
            return NextResponse.json(
                { success: false, error: "Complete address is required." },
                { status: 400 }
            );
        }

        // 1. Update Auth user metadata (client session & admin API)
        const metadataUpdate: any = {
            first_name: cleanFirst,
            middle_name: cleanMiddle,
            last_name: cleanLast,
            full_name: fullName,
            birthdate: validBirthdate,
            age: parsedAge,
            phone_number: cleanPhone,
            address: cleanAddress,
            profile_completed: true,
        };

        try {
            await supabase.auth.updateUser({ data: metadataUpdate });
        } catch (e) {
            console.warn("Client auth updateUser notice:", e);
        }

        try {
            const adminAuthUpdate: any = { user_metadata: metadataUpdate };
            if (password && password.length >= 6) {
                adminAuthUpdate.password = password;
            }
            await supabaseAdmin.auth.admin.updateUserById(user.id, adminAuthUpdate);
        } catch (adminAuthErr) {
            console.warn("Admin auth update notice:", adminAuthErr);
        }

        // 2. Persist to public.profiles table via supabaseAdmin (guaranteed RLS bypass)
        const profilePayload = {
            id: user.id,
            email: user.email,
            first_name: cleanFirst,
            middle_name: cleanMiddle,
            last_name: cleanLast,
            full_name: fullName,
            birthdate: validBirthdate,
            age: parsedAge,
            phone_number: cleanPhone,
            address: cleanAddress,
            profile_completed: true,
            updated_at: new Date().toISOString(),
        };

        const { data: savedProfile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert(profilePayload, { onConflict: "id" })
            .select()
            .single();

        if (profileError) {
            console.error("Critical: Failed to upsert profile via admin client:", profileError);
            return NextResponse.json(
                { success: false, error: profileError.message || "Failed to update database profile record." },
                { status: 500 }
            );
        }

        // 3. Ensure role exists safely (do not overwrite ADMIN or TELLER)
        try {
            const { data: existingRole } = await supabaseAdmin
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!existingRole) {
                await supabaseAdmin.from("user_roles").insert({
                    user_id: user.id,
                    role: "PASSENGER",
                });
            }
        } catch (roleErr) {
            console.warn("Role check non-fatal notice:", roleErr);
        }

        // 4. Send Welcome Confirmation Email (non-blocking)
        try {
            fetch(`${req.nextUrl.origin}/api/auth/send-welcome-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    firstName: cleanFirst,
                    lastName: cleanLast,
                    phoneNumber: cleanPhone,
                }),
            }).catch(() => {});
        } catch (_) {}

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully.",
            profile: savedProfile || profilePayload,
        });
    } catch (err: any) {
        console.error("API /api/profile/update error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "An unexpected error occurred while saving profile." },
            { status: 500 }
        );
    }
}
