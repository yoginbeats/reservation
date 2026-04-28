"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getBusesAction() {
    const { data, error } = await supabaseAdmin.from("buses").select("*").order("bus_number", { ascending: true });
    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

export async function addBusAction(newBus: any) {
    const { data, error } = await supabaseAdmin.from("buses").insert([newBus]).select();
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/buses");
    return { success: true, data };
}

export async function updateBusAction(id: string, editValues: any) {
    const { data, error } = await supabaseAdmin.from("buses").update(editValues).eq("id", id).select();
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/buses");
    return { success: true, data };
}

export async function deleteBusAction(id: string) {
    // Note: ensure cascading deletes are handled, or handle them here.
    const { data: relatedTrips } = await supabaseAdmin.from("trips").select("id").eq("bus_id", id);
    if (relatedTrips && relatedTrips.length > 0) {
        const tripIds = relatedTrips.map(t => t.id);
        await supabaseAdmin.from("reservations").delete().in("trip_id", tripIds);
        await supabaseAdmin.from("trips").delete().in("id", tripIds);
    }

    const { error } = await supabaseAdmin.from("buses").delete().eq("id", id);
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/buses");
    return { success: true };
}

export async function deleteAllBusesAction() {
    await supabaseAdmin.from("reservations").delete().neq("id", "00000000-0000-0000-0000-000000000000"); 
    await supabaseAdmin.from("trips").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await supabaseAdmin.from("buses").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/buses");
    return { success: true };
}
