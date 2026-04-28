"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getTripsAction() {
    const { data, error } = await supabaseAdmin
        .from('trips')
        .select(`
            *,
            buses (*)
        `)
        .order('departure_time', { ascending: true });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

export async function getTripAction(id: string) {
    const { data, error } = await supabaseAdmin
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

export async function addTripAction(newTrip: any) {
    const { data, error } = await supabaseAdmin.from("trips").insert([newTrip]).select();
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/trips");
    return { success: true, data };
}

export async function updateTripAction(id: string, tripData: any) {
    const { data, error } = await supabaseAdmin.from("trips").update(tripData).eq('id', id).select();
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/trips");
    return { success: true, data };
}

export async function deleteTripAction(id: string) {
    await supabaseAdmin.from('reservations').delete().eq('trip_id', id);
    const { error } = await supabaseAdmin.from('trips').delete().eq('id', id);
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/trips");
    return { success: true };
}

export async function deleteAllTripsAction() {
    await supabaseAdmin.from('reservations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabaseAdmin.from('trips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/trips");
    return { success: true };
}
