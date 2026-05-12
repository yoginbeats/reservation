"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getAnnouncementsAction() {
    const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

export async function getActiveAnnouncementsAction() {
    const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

export async function getAnnouncementAction(id: string) {
    const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

export async function addAnnouncementAction(newAnnouncement: any) {
    const { data, error } = await supabaseAdmin
        .from("announcements")
        .insert([newAnnouncement])
        .select();
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true, data };
}

export async function updateAnnouncementAction(id: string, announcementData: any) {
    const { data, error } = await supabaseAdmin
        .from("announcements")
        .update(announcementData)
        .eq('id', id)
        .select();
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true, data };
}

export async function deleteAnnouncementAction(id: string) {
    const { error } = await supabaseAdmin
        .from('announcements')
        .delete()
        .eq('id', id);
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return { success: true };
}
