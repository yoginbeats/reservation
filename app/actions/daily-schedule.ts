"use server";

import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { DailyScheduleItem, INITIAL_WHITEBOARD_SCHEDULES } from "@/lib/constants/daily-schedules";

export type { DailyScheduleItem };

const LOCAL_STORAGE_FILE = path.join(process.cwd(), "data", "daily-schedules.json");

function readLocalSchedules(): DailyScheduleItem[] {
    try {
        if (fs.existsSync(LOCAL_STORAGE_FILE)) {
            const raw = fs.readFileSync(LOCAL_STORAGE_FILE, "utf-8");
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch {}
    return INITIAL_WHITEBOARD_SCHEDULES;
}

function writeLocalSchedules(items: DailyScheduleItem[]) {
    try {
        const dir = path.dirname(LOCAL_STORAGE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(items, null, 2), "utf-8");
    } catch (e) {
        console.warn("Could not save to local storage file:", e);
    }
}

export async function getDailySchedulesAction(): Promise<{ success: boolean; data: DailyScheduleItem[]; error?: string }> {
    try {
        // 1. Try Supabase query
        const { data, error } = await supabaseAdmin
            .from("daily_terminal_schedules")
            .select("*")
            .order("order_index", { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
            return { success: true, data: data as DailyScheduleItem[] };
        }

        // 2. Fallback to resilient file store or default whiteboard data
        const localItems = readLocalSchedules();
        return { success: true, data: localItems };
    } catch (err: any) {
        console.warn("Notice: Loading fallback whiteboard schedules:", err?.message);
        return { success: true, data: readLocalSchedules() };
    }
}

export async function addDailyScheduleAction(newItem: Omit<DailyScheduleItem, "id">): Promise<{ success: boolean; data?: DailyScheduleItem; error?: string }> {
    try {
        const id = `sched-${Date.now()}`;
        const item: DailyScheduleItem = {
            id,
            ...newItem,
            created_at: new Date().toISOString(),
        };

        // Try Supabase insert
        try {
            await supabaseAdmin.from("daily_terminal_schedules").insert([item]);
        } catch (_) {}

        // Keep local resilient store synchronized
        const current = readLocalSchedules();
        current.push(item);
        writeLocalSchedules(current);

        revalidatePath("/schedules");
        revalidatePath("/admin/daily-schedules");
        return { success: true, data: item };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to add schedule item" };
    }
}

export async function updateDailyScheduleAction(id: string, updates: Partial<DailyScheduleItem>): Promise<{ success: boolean; error?: string }> {
    try {
        // Try Supabase update
        try {
            await supabaseAdmin.from("daily_terminal_schedules").update(updates).eq("id", id);
        } catch (_) {}

        // Update local file store
        const current = readLocalSchedules();
        const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
        writeLocalSchedules(updated);

        revalidatePath("/schedules");
        revalidatePath("/admin/daily-schedules");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to update schedule item" };
    }
}

export async function deleteDailyScheduleAction(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Try Supabase delete
        try {
            await supabaseAdmin.from("daily_terminal_schedules").delete().eq("id", id);
        } catch (_) {}

        // Delete from local file store
        const current = readLocalSchedules();
        const filtered = current.filter((item) => item.id !== id);
        writeLocalSchedules(filtered);

        revalidatePath("/schedules");
        revalidatePath("/admin/daily-schedules");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to delete schedule item" };
    }
}

export async function resetDailySchedulesAction(): Promise<{ success: boolean; data: DailyScheduleItem[]; error?: string }> {
    try {
        // Clean Supabase table if possible
        try {
            await supabaseAdmin.from("daily_terminal_schedules").delete().neq("id", "none");
            await supabaseAdmin.from("daily_terminal_schedules").insert(INITIAL_WHITEBOARD_SCHEDULES);
        } catch (_) {}

        writeLocalSchedules(INITIAL_WHITEBOARD_SCHEDULES);

        revalidatePath("/schedules");
        revalidatePath("/admin/daily-schedules");
        return { success: true, data: INITIAL_WHITEBOARD_SCHEDULES };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to reset schedules", data: INITIAL_WHITEBOARD_SCHEDULES };
    }
}
