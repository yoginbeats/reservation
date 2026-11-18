import { NextRequest, NextResponse } from "next/server";
import { getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import {
    addSupportMessage,
    createSupportThread,
    getAllThreadsForAdmin,
    getThreadsForCustomer,
    SupportCategory,
    SupportStatus,
    updateSupportThread,
} from "@/lib/support-store";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const scope = searchParams.get("scope");

        if (scope === "admin") {
            const { user, role } = await getUserWithRoleAndTerminal();
            if (!user || role !== "ADMIN") {
                return NextResponse.json(
                    { success: false, error: "Unauthorized: Admin access required." },
                    { status: 403 }
                );
            }

            const threads = await getAllThreadsForAdmin();
            const unreadCount = threads.filter((t) => t.unread_by_admin).length;
            return NextResponse.json({ success: true, threads, unreadCount });
        }

        const sessionId = searchParams.get("sessionId") || "";
        const email = searchParams.get("email") || "";
        const threads = await getThreadsForCustomer(sessionId, email);
        const unreadCount = threads.filter((t) => t.unread_by_customer).length;

        return NextResponse.json({ success: true, threads, unreadCount });
    } catch (error) {
        console.error("GET /api/support error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to load support messages." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            threadId,
            sessionId,
            customerName,
            customerEmail,
            category,
            subject,
            message,
            rating,
            senderRole,
        } = body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json(
                { success: false, error: "Message is required." },
                { status: 400 }
            );
        }

        // Admin reply path
        if (senderRole === "ADMIN") {
            const { user, role } = await getUserWithRoleAndTerminal();
            if (!user || role !== "ADMIN") {
                return NextResponse.json(
                    { success: false, error: "Unauthorized: Only Admin can reply as support." },
                    { status: 403 }
                );
            }
            if (!threadId) {
                return NextResponse.json(
                    { success: false, error: "Thread ID is required for reply." },
                    { status: 400 }
                );
            }

            const adminName =
                user.user_metadata?.full_name ||
                user.user_metadata?.first_name ||
                "Superlines Admin Support";

            const updated = await addSupportMessage({
                thread_id: threadId,
                sender_role: "ADMIN",
                sender_name: adminName,
                message,
            });

            if (!updated) {
                return NextResponse.json(
                    { success: false, error: "Conversation not found." },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, thread: updated });
        }

        // Customer reply to existing thread
        if (threadId) {
            const updated = await addSupportMessage({
                thread_id: threadId,
                sender_role: "CUSTOMER",
                sender_name: customerName || "Passenger",
                message,
            });

            if (!updated) {
                return NextResponse.json(
                    { success: false, error: "Conversation not found." },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, thread: updated });
        }

        // Customer starting a new thread
        if (!sessionId || !customerName?.trim()) {
            return NextResponse.json(
                { success: false, error: "Name and session are required." },
                { status: 400 }
            );
        }

        const validCategories: SupportCategory[] = [
            "Customer Service",
            "Feedback",
            "Booking Issue",
            "Refund / Rebooking",
            "Other",
        ];
        const safeCategory: SupportCategory = validCategories.includes(category)
            ? category
            : "Customer Service";

        const thread = await createSupportThread({
            session_id: sessionId,
            customer_name: customerName,
            customer_email: customerEmail || "",
            category: safeCategory,
            subject: subject || "",
            message,
            rating: typeof rating === "number" ? Math.min(5, Math.max(1, rating)) : null,
        });

        return NextResponse.json({ success: true, thread }, { status: 201 });
    } catch (error) {
        console.error("POST /api/support error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send message." },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { threadId, scope, status, markRead, rating } = body;

        if (!threadId) {
            return NextResponse.json(
                { success: false, error: "Thread ID is required." },
                { status: 400 }
            );
        }

        if (scope === "admin") {
            const { user, role } = await getUserWithRoleAndTerminal();
            if (!user || role !== "ADMIN") {
                return NextResponse.json(
                    { success: false, error: "Unauthorized: Admin access required." },
                    { status: 403 }
                );
            }

            const updates: { status?: SupportStatus; unread_by_admin?: boolean } = {};
            if (status && ["OPEN", "REPLIED", "RESOLVED"].includes(status)) {
                updates.status = status;
            }
            if (markRead) {
                updates.unread_by_admin = false;
            }

            const updated = await updateSupportThread(threadId, updates);
            return NextResponse.json({ success: true, thread: updated });
        }

        // Customer updates (mark read or update rating)
        const updates: { unread_by_customer?: boolean; rating?: number } = {};
        if (markRead) {
            updates.unread_by_customer = false;
        }
        if (typeof rating === "number" && rating >= 1 && rating <= 5) {
            updates.rating = rating;
        }

        const updated = await updateSupportThread(threadId, updates);
        return NextResponse.json({ success: true, thread: updated });
    } catch (error) {
        console.error("PATCH /api/support error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update conversation." },
            { status: 500 }
        );
    }
}
