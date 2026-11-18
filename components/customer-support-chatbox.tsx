"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
    MessageSquareHeart,
    X,
    Send,
    Headphones,
    Star,
    ChevronLeft,
    Plus,
    CheckCircle2,
    Clock,
    Sparkles,
    Loader2,
} from "lucide-react";
import type { SupportCategory, SupportThread } from "@/lib/support-store";

const CATEGORIES: { value: SupportCategory; label: string }[] = [
    { value: "Customer Service", label: "Customer Service" },
    { value: "Feedback", label: "Feedback" },
    { value: "Booking Issue", label: "Booking Issue" },
    { value: "Refund / Rebooking", label: "Refund / Rebook" },
];

function getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "";
    const key = "superlines_support_session_id";
    let id = localStorage.getItem(key);
    if (!id) {
        id = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem(key, id);
    }
    return id;
}

export function CustomerSupportChatbox() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [sessionId, setSessionId] = useState("");
    const [threads, setThreads] = useState<SupportThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    // New conversation form state
    const [viewMode, setViewMode] = useState<"list" | "new" | "chat">("new");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [category, setCategory] = useState<SupportCategory>("Customer Service");
    const [rating, setRating] = useState<number>(5);
    const [messageText, setMessageText] = useState("");
    const [replyText, setReplyText] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Hide on staff portals (/admin, /teller, /conductor)
    const isStaffRoute =
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/teller") ||
        pathname?.startsWith("/conductor");

    // Initialize session + prefill authenticated passenger info
    useEffect(() => {
        if (isStaffRoute) return;
        const sid = getOrCreateSessionId();
        setSessionId(sid);

        const storedName = localStorage.getItem("superlines_support_name");
        const storedEmail = localStorage.getItem("superlines_support_email");
        if (storedName) setCustomerName(storedName);
        if (storedEmail) setCustomerEmail(storedEmail);

        fetch("/api/auth/session")
            .then((r) => r.json())
            .then((data) => {
                if (data?.authenticated && data?.user) {
                    const u = data.user;
                    const metaName =
                        u.user_metadata?.full_name ||
                        `${u.user_metadata?.first_name || ""} ${u.user_metadata?.last_name || ""}`.trim();
                    if (metaName && !storedName) setCustomerName(metaName);
                    if (u.email && !storedEmail) setCustomerEmail(u.email);
                }
            })
            .catch(() => {});
    }, [isStaffRoute]);

    const fetchThreads = useCallback(async () => {
        if (!sessionId || isStaffRoute) return;
        try {
            const params = new URLSearchParams({ sessionId });
            if (customerEmail) params.set("email", customerEmail);
            const res = await fetch(`/api/support?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setThreads(data.threads || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch {}
    }, [sessionId, customerEmail, isStaffRoute]);

    // Initial load + polling when open (or slower polling when closed for unread badge)
    useEffect(() => {
        if (!sessionId || isStaffRoute) return;
        fetchThreads();
        const interval = setInterval(fetchThreads, isOpen ? 5000 : 20000);
        return () => clearInterval(interval);
    }, [sessionId, isOpen, isStaffRoute, fetchThreads]);

    // Scroll to bottom when messages change
    const activeThread = threads.find((t) => t.id === activeThreadId) || null;
    useEffect(() => {
        if (viewMode === "chat") {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [activeThread?.messages?.length, viewMode]);

    // Mark thread as read when opened
    const openThread = async (thread: SupportThread) => {
        setActiveThreadId(thread.id);
        setViewMode("chat");
        if (thread.unread_by_customer) {
            try {
                await fetch("/api/support", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ threadId: thread.id, markRead: true }),
                });
                fetchThreads();
            } catch {}
        }
    };

    const handleOpenBox = () => {
        setIsOpen(true);
        if (threads.length > 0 && viewMode === "new" && !messageText) {
            // If user already has threads, show list or most recent thread
            setViewMode("list");
        }
        fetchThreads();
    };

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!customerName.trim()) {
            setError("Please enter your name.");
            return;
        }
        if (!messageText.trim()) {
            setError("Please enter your message or feedback.");
            return;
        }

        setSending(true);
        try {
            localStorage.setItem("superlines_support_name", customerName.trim());
            if (customerEmail.trim()) {
                localStorage.setItem("superlines_support_email", customerEmail.trim());
            }

            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    customerName: customerName.trim(),
                    customerEmail: customerEmail.trim(),
                    category,
                    rating: category === "Feedback" ? rating : null,
                    message: messageText.trim(),
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || "Failed to send message.");
            } else {
                setMessageText("");
                await fetchThreads();
                setActiveThreadId(data.thread.id);
                setViewMode("chat");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeThread || !replyText.trim() || sending) return;

        setSending(true);
        setError("");
        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId: activeThread.id,
                    customerName: customerName || activeThread.customer_name,
                    message: replyText.trim(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setReplyText("");
                await fetchThreads();
            } else {
                setError(data.error || "Failed to send reply.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSending(false);
        }
    };

    if (isStaffRoute) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[360px] sm:w-[390px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-3.5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            {(viewMode === "chat" || (viewMode === "new" && threads.length > 0)) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveThreadId(null);
                                        setViewMode("list");
                                        setError("");
                                    }}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                                    title="Back to conversations"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            )}
                            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
                                <Headphones className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight leading-tight">
                                    Superlines Support &amp; Feedback
                                </h3>
                                <p className="text-[11px] text-white/85 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 inline-block" />
                                    Direct line to Admin Support
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                            aria-label="Close support chat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body */}
                    {viewMode === "list" && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    Your Conversations ({threads.length})
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setViewMode("new");
                                        setError("");
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    New Chat
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {loading ? (
                                    <div className="flex items-center justify-center py-10 text-zinc-400 text-xs gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading conversations...
                                    </div>
                                ) : threads.length === 0 ? (
                                    <div className="text-center py-10 space-y-2">
                                        <p className="text-xs text-zinc-500">No messages yet.</p>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("new")}
                                            className="text-xs font-bold text-red-600 underline"
                                        >
                                            Start a conversation or send feedback
                                        </button>
                                    </div>
                                ) : (
                                    threads.map((t) => {
                                        const lastMsg = t.messages[t.messages.length - 1];
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => openThread(t)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all bg-white dark:bg-zinc-900 hover:border-red-300 ${
                                                    t.unread_by_customer
                                                        ? "border-red-400 ring-1 ring-red-200"
                                                        : "border-zinc-200 dark:border-zinc-800"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                        {t.category}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            t.status === "RESOLVED"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : t.status === "REPLIED"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-amber-100 text-amber-700"
                                                        }`}
                                                    >
                                                        {t.unread_by_customer ? "New Reply" : t.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                                    {lastMsg?.message || t.subject}
                                                </p>
                                                <p className="text-[10px] text-zinc-400 mt-1">
                                                    {new Date(t.updated_at).toLocaleString("en-PH", {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {viewMode === "new" && (
                        <form
                            onSubmit={handleCreateThread}
                            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50 dark:bg-zinc-950"
                        >
                            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                <span>
                                    May tanong sa biyahe, booking issue, o feedback? Mag-message dito at sasagot ang aming Admin team.
                                </span>
                            </div>

                            {error && (
                                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                    Topic / Category
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {CATEGORIES.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setCategory(c.value)}
                                            className={`px-2.5 py-2 rounded-lg text-xs font-semibold border text-left transition-colors ${
                                                category === c.value
                                                    ? "bg-red-600 text-white border-red-600"
                                                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-red-300"
                                            }`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {category === "Feedback" && (
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                        Rate Your Experience
                                    </label>
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="p-0.5 focus:outline-none"
                                            >
                                                <Star
                                                    className={`h-5 w-5 transition-colors ${
                                                        star <= rating
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-zinc-300"
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                        <span className="ml-2 text-xs font-bold text-zinc-600">
                                            {rating} / 5
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-2.5">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Juan Dela Cruz"
                                        className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="juan@example.com"
                                        className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                                    Message / Feedback *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Ilagay ang iyong katanungan, booking reference, o feedback..."
                                    className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5" />
                                        Send to Admin Support
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {viewMode === "chat" && activeThread && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                            {/* Thread Subheader */}
                            <div className="px-3.5 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 font-semibold text-zinc-600 dark:text-zinc-300">
                                    <span>{activeThread.category}</span>
                                    {activeThread.rating ? (
                                        <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                                            &bull; <Star className="h-3 w-3 fill-amber-400" /> {activeThread.rating}
                                        </span>
                                    ) : null}
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                        activeThread.status === "RESOLVED"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : activeThread.status === "REPLIED"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-amber-100 text-amber-700"
                                    }`}
                                >
                                    {activeThread.status === "RESOLVED" ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                        <Clock className="h-3 w-3" />
                                    )}
                                    {activeThread.status}
                                </span>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                                {activeThread.messages.map((msg) => {
                                    const isCustomer = msg.sender_role === "CUSTOMER";
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${
                                                isCustomer ? "items-end" : "items-start"
                                            }`}
                                        >
                                            <span className="text-[10px] text-zinc-400 mb-0.5 px-1 font-medium">
                                                {isCustomer ? "You" : `${msg.sender_name} (Admin)`}
                                            </span>
                                            <div
                                                className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${
                                                    isCustomer
                                                        ? "bg-red-600 text-white rounded-br-sm"
                                                        : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm"
                                                }`}
                                            >
                                                {msg.message}
                                            </div>
                                            <span className="text-[9px] text-zinc-400 mt-0.5 px-1">
                                                {new Date(msg.created_at).toLocaleTimeString("en-PH", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
                            <form
                                onSubmit={handleSendReply}
                                className="p-2.5 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={
                                        activeThread.status === "RESOLVED"
                                            ? "Send a follow-up to reopen..."
                                            : "Type your message..."
                                    }
                                    className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !replyText.trim()}
                                    className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 transition-colors shrink-0"
                                    aria-label="Send message"
                                >
                                    {sending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Launcher Button */}
            <button
                type="button"
                onClick={() => (isOpen ? setIsOpen(false) : handleOpenBox())}
                className="relative group flex items-center gap-2.5 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-full shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
                aria-label="Customer Service and Feedback Chat"
            >
                {isOpen ? (
                    <X className="h-5 w-5" />
                ) : (
                    <MessageSquareHeart className="h-5 w-5" />
                )}
                <span className="text-xs font-bold tracking-tight hidden sm:inline">
                    {isOpen ? "Close Chat" : "Customer Service"}
                </span>
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}
