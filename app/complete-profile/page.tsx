import { redirect } from "next/navigation";
import { getUserWithRoleAndTerminal, createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CompleteProfileForm } from "@/components/complete-profile-form";

export const metadata = {
    title: "Complete Your Passenger Profile | Superlines Transportation",
    description: "Provide complete passenger details for booking verification and bus manifest compliance.",
};

export default async function CompleteProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const { user } = await getUserWithRoleAndTerminal();
    const resolvedParams = await searchParams;
    const nextUrl = resolvedParams?.next || "/dashboard";

    if (!user) {
        redirect(`/login?next=${encodeURIComponent(nextUrl)}`);
    }

    // Load profile record from DB (both user client & admin fallback)
    let profile = null;
    try {
        const supabase = await createClient();
        const { data: pData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
        profile = pData;

        if (!profile) {
            const { data: adminProfile } = await supabaseAdmin
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();
            if (adminProfile) profile = adminProfile;
        }
    } catch (e) {
        console.warn("Could not load profile in CompleteProfilePage:", e);
    }

    return (
        <CompleteProfileForm
            user={user}
            initialProfile={profile}
            nextUrl={nextUrl}
        />
    );
}
