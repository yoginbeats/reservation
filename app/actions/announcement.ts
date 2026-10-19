"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface AnnouncementItem {
    id: string;
    title: string;
    content: string;
    is_active?: boolean;
    image_url?: string | null;
    created_at?: string;
}

export async function getAnnouncementsAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message, data: [] };
        }
        return { success: true, data: data as AnnouncementItem[] };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to fetch announcements", data: [] };
    }
}

export async function getActiveAnnouncementsAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message, data: [] };
        }
        return { success: true, data: data as AnnouncementItem[] };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to fetch active announcements", data: [] };
    }
}

export async function getAnnouncementAction(id: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('announcements')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) {
            return { success: false, error: error.message, data: null };
        }
        return { success: true, data: data as AnnouncementItem };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to fetch announcement", data: null };
    }
}

export async function addAnnouncementAction(newAnnouncement: Record<string, unknown>) {
    try {
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
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to add announcement" };
    }
}

export async function updateAnnouncementAction(id: string, announcementData: Record<string, unknown>) {
    try {
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
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to update announcement" };
    }
}

export async function deleteAnnouncementAction(id: string) {
    try {
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
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to delete announcement" };
    }
}
