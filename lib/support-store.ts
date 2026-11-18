import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type SupportCategory =
    | "Customer Service"
    | "Feedback"
    | "Booking Issue"
    | "Refund / Rebooking"
    | "Other";

export type SupportStatus = "OPEN" | "REPLIED" | "RESOLVED";

export interface SupportMessage {
    id: string;
    thread_id: string;
    sender_role: "CUSTOMER" | "ADMIN";
    sender_name: string;
    message: string;
    created_at: string;
}

export interface SupportThread {
    id: string;
    session_id: string;
    customer_name: string;
    customer_email: string;
    category: SupportCategory;
    subject: string;
    status: SupportStatus;
    rating?: number | null;
    unread_by_admin: boolean;
    unread_by_customer: boolean;
    created_at: string;
    updated_at: string;
    messages: SupportMessage[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const SUPPORT_FILE = path.join(DATA_DIR, "support-messages.json");

function ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readLocalStore(): { threads: SupportThread[] } {
    ensureDirectoryExists();
    if (!fs.existsSync(SUPPORT_FILE)) {
        const initial = { threads: [] };
        fs.writeFileSync(SUPPORT_FILE, JSON.stringify(initial, null, 2), "utf-8");
        return initial;
    }

    try {
        const content = fs.readFileSync(SUPPORT_FILE, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed?.threads)) {
            return parsed;
        }
        return { threads: [] };
    } catch (e) {
        console.error("Error reading support store:", e);
        return { threads: [] };
    }
}

function writeLocalStore(data: { threads: SupportThread[] }) {
    ensureDirectoryExists();
    fs.writeFileSync(SUPPORT_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

async function isSupabaseSupportReady(): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .from("support_threads")
            .select("id")
            .limit(1);
        return !error;
    } catch {
        return false;
    }
}

export async function getAllThreadsForAdmin(): Promise<SupportThread[]> {
    const useDb = await isSupabaseSupportReady();
    if (useDb) {
        const { data: threads, error } = await supabaseAdmin
            .from("support_threads")
            .select("*")
            .order("updated_at", { ascending: false });

        if (!error && threads) {
            const { data: messages } = await supabaseAdmin
                .from("support_messages")
                .select("*")
                .order("created_at", { ascending: true });

            const msgMap = new Map<string, SupportMessage[]>();
            for (const msg of (messages || []) as SupportMessage[]) {
                const arr = msgMap.get(msg.thread_id) || [];
                arr.push(msg);
                msgMap.set(msg.thread_id, arr);
            }

            return (threads as Omit<SupportThread, "messages">[]).map((t) => ({
                ...t,
                customer_email: t.customer_email || "",
                subject: t.subject || "",
                messages: msgMap.get(t.id) || [],
            }));
        }
    }

    const store = readLocalStore();
    return [...store.threads].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
}

export async function getThreadsForCustomer(
    sessionId: string,
    customerEmail?: string
): Promise<SupportThread[]> {
    const cleanEmail = customerEmail?.trim().toLowerCase() || "";
    const cleanSession = sessionId.trim();

    if (!cleanSession && !cleanEmail) return [];

    const all = await getAllThreadsForAdmin();
    return all.filter((t) => {
        if (cleanSession && t.session_id === cleanSession) return true;
        if (cleanEmail && t.customer_email?.toLowerCase() === cleanEmail) return true;
        return false;
    });
}

export async function createSupportThread(input: {
    session_id: string;
    customer_name: string;
    customer_email?: string;
    category: SupportCategory;
    subject?: string;
    message: string;
    rating?: number | null;
}): Promise<SupportThread> {
    const now = new Date().toISOString();
    const threadId = generateId("CS");
    const msgId = generateId("MSG");
    const derivedSubject =
        input.subject?.trim() ||
        input.message.trim().slice(0, 60) + (input.message.trim().length > 60 ? "..." : "");

    const newThread: SupportThread = {
        id: threadId,
        session_id: input.session_id,
        customer_name: input.customer_name.trim(),
        customer_email: (input.customer_email || "").trim(),
        category: input.category,
        subject: derivedSubject,
        status: "OPEN",
        rating: input.rating ?? null,
        unread_by_admin: true,
        unread_by_customer: false,
        created_at: now,
        updated_at: now,
        messages: [
            {
                id: msgId,
                thread_id: threadId,
                sender_role: "CUSTOMER",
                sender_name: input.customer_name.trim(),
                message: input.message.trim(),
                created_at: now,
            },
        ],
    };

    const useDb = await isSupabaseSupportReady();
    if (useDb) {
        const { error: tErr } = await supabaseAdmin.from("support_threads").insert({
            id: newThread.id,
            session_id: newThread.session_id,
            customer_name: newThread.customer_name,
            customer_email: newThread.customer_email,
            category: newThread.category,
            subject: newThread.subject,
            status: newThread.status,
            rating: newThread.rating,
            unread_by_admin: true,
            unread_by_customer: false,
            created_at: now,
            updated_at: now,
        });

        if (!tErr) {
            await supabaseAdmin.from("support_messages").insert(newThread.messages[0]);
            return newThread;
        }
    }

    const store = readLocalStore();
    store.threads.unshift(newThread);
    writeLocalStore(store);
    return newThread;
}

export async function addSupportMessage(input: {
    thread_id: string;
    sender_role: "CUSTOMER" | "ADMIN";
    sender_name: string;
    message: string;
}): Promise<SupportThread | null> {
    const now = new Date().toISOString();
    const msg: SupportMessage = {
        id: generateId("MSG"),
        thread_id: input.thread_id,
        sender_role: input.sender_role,
        sender_name: input.sender_name.trim(),
        message: input.message.trim(),
        created_at: now,
    };

    const isAdmin = input.sender_role === "ADMIN";
    const nextStatus: SupportStatus = isAdmin ? "REPLIED" : "OPEN";

    const useDb = await isSupabaseSupportReady();
    if (useDb) {
        const { error: mErr } = await supabaseAdmin.from("support_messages").insert(msg);
        if (!mErr) {
            await supabaseAdmin
                .from("support_threads")
                .update({
                    status: nextStatus,
                    unread_by_admin: !isAdmin,
                    unread_by_customer: isAdmin,
                    updated_at: now,
                })
                .eq("id", input.thread_id);

            const all = await getAllThreadsForAdmin();
            return all.find((t) => t.id === input.thread_id) || null;
        }
    }

    const store = readLocalStore();
    const idx = store.threads.findIndex((t) => t.id === input.thread_id);
    if (idx === -1) return null;

    store.threads[idx].messages.push(msg);
    store.threads[idx].status = nextStatus;
    store.threads[idx].unread_by_admin = !isAdmin;
    store.threads[idx].unread_by_customer = isAdmin;
    store.threads[idx].updated_at = now;
    writeLocalStore(store);

    return store.threads[idx];
}

export async function updateSupportThread(
    threadId: string,
    updates: {
        status?: SupportStatus;
        unread_by_admin?: boolean;
        unread_by_customer?: boolean;
        rating?: number | null;
    }
): Promise<SupportThread | null> {
    const now = new Date().toISOString();

    const useDb = await isSupabaseSupportReady();
    if (useDb) {
        const { error } = await supabaseAdmin
            .from("support_threads")
            .update({
                ...updates,
                updated_at: now,
            })
            .eq("id", threadId);

        if (!error) {
            const all = await getAllThreadsForAdmin();
            return all.find((t) => t.id === threadId) || null;
        }
    }

    const store = readLocalStore();
    const idx = store.threads.findIndex((t) => t.id === threadId);
    if (idx === -1) return null;

    store.threads[idx] = {
        ...store.threads[idx],
        ...updates,
        updated_at: now,
    };
    writeLocalStore(store);
    return store.threads[idx];
}
