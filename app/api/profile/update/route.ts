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

        // 2. Persist to public.profiles table via supabaseAdmin (with schema adaptation)
        const fullPayload: Record<string, any> = {
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

        const currentPayload = { ...fullPayload };
        let savedProfile: any = null;
        let lastError: any = null;

        // Automatically prune any columns not yet migrated in the cloud schema
        for (let attempt = 0; attempt < 8; attempt++) {
            const { data, error } = await supabaseAdmin
                .from("profiles")
                .upsert(currentPayload, { onConflict: "id" })
                .select()
                .maybeSingle();

            if (!error) {
                savedProfile = data;
                lastError = null;
                break;
            }

            lastError = error;
            console.warn(`Profile upsert attempt ${attempt + 1} notice:`, error.message);

            // Pattern match: "Could not find the 'xyz' column of 'profiles' in the schema cache"
            const match = error.message?.match(/Could not find the '([a-zA-Z0-9_]+)' column/i);
            if (match && match[1] && match[1] in currentPayload && match[1] !== "id") {
                delete currentPayload[match[1]];
                continue;
            } else {
                break;
            }
        }

        if (lastError && !savedProfile) {
            console.warn("Notice: Continuing with Auth metadata persistence despite DB notice:", lastError.message);
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
            profile: { ...fullPayload, ...(savedProfile || {}) },
        });
    } catch (err: any) {
        console.error("API /api/profile/update error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "An unexpected error occurred while saving profile." },
            { status: 500 }
        );
    }
}
