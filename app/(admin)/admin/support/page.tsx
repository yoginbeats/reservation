"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Headphones,
    Search,
    Send,
    CheckCircle2,
    Clock,
    MessageSquare,
    Star,
    RefreshCw,
    User,
    Mail,
    Phone,
    Sparkles,
    Loader2,
    Inbox,
} from "lucide-react";
import type { SupportThread, SupportStatus } from "@/lib/support-store";

const QUICK_REPLIES = [
    "Maraming salamat po sa inyong feedback! Pinapahalagahan namin ito upang mapabuti pa ang aming serbisyo.",
    "Magandang araw! Maaari po bang maibigay ang inyong Booking Reference (SL-...) para agad naming ma-check?",
    "Naipasa na po ang inyong concern sa aming Terminal Operations team. Maghintay lamang ng update.",
    "Naayos na po ang inyong request. Mangyaring i-refresh ang inyong My Tickets page o i-check ang inyong email.",
];

export default function AdminSupportPage() {
    const [threads, setThreads] = useState<SupportThread[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | SupportStatus>("ALL");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchThreads = useCallback(async (showSpinner = false) => {
        if (showSpinner) setLoading(true);
        try {
            const res = await fetch("/api/support?scope=admin");
            const data = await res.json();
            if (data.success) {
                setThreads(data.threads || []);
            }
        } catch (err) {
            console.error("Failed to fetch support threads:", err);
        } finally {
            if (showSpinner) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchThreads(true);
        const interval = setInterval(() => fetchThreads(false), 5000);
        return () => clearInterval(interval);
    }, [fetchThreads]);

    const activeThread = threads.find((t) => t.id === selectedId) || null;

    useEffect(() => {
        if (activeThread) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [activeThread?.messages?.length, selectedId]);

    const handleSelectThread = async (thread: SupportThread) => {
        setSelectedId(thread.id);
        if (thread.unread_by_admin) {
            try {
                await fetch("/api/support", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        threadId: thread.id,
                        scope: "admin",
                        markRead: true,
                    }),
                });
                fetchThreads(false);
            } catch {}
        }
    };

    const handleSendReply = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!activeThread || !replyText.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId: activeThread.id,
                    senderRole: "ADMIN",
                    message: replyText.trim(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setReplyText("");
                await fetchThreads(false);
            }
        } catch (err) {
            console.error("Failed to send admin reply:", err);
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (threadId: string, status: SupportStatus) => {
        try {
            await fetch("/api/support", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId,
                    scope: "admin",
                    status,
                    markRead: true,
                }),
            });
            await fetchThreads(false);
        } catch {}
    };

    const filteredThreads = threads.filter((t) => {
        if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
        if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = t.customer_name.toLowerCase().includes(q);
            const matchEmail = (t.customer_email || "").toLowerCase().includes(q);
            const matchPhone = (t.customer_phone || "").toLowerCase().includes(q);
            const matchMsg = t.messages.some((m) => m.message.toLowerCase().includes(q));
            if (!matchName && !matchEmail && !matchPhone && !matchMsg) return false;
        }
        return true;
    });

    const openCount = threads.filter((t) => t.status === "OPEN").length;
    const repliedCount = threads.filter((t) => t.status === "REPLIED").length;
    const resolvedCount = threads.filter((t) => t.status === "RESOLVED").length;
    const unreadCount = threads.filter((t) => t.unread_by_admin).length;

    const ratedThreads = threads.filter((t) => typeof t.rating === "number" && t.rating > 0);
    const avgRating =
        ratedThreads.length > 0
            ? (ratedThreads.reduce((acc, t) => acc + (t.rating || 0), 0) / ratedThreads.length).toFixed(1)
            : "—";

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                            <Headphones className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900">
                                Customer Service &amp; Feedback
                            </h1>
                            <p className="text-xs text-zinc-500">
                                Respond to live passenger inquiries, booking concerns, and trip feedback in real time.
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => fetchThreads(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-colors self-start sm:self-auto"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh Inbox
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Total Threads
                    </p>
                    <p className="text-2xl font-black text-zinc-900 mt-1">{threads.length}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        Needs Reply (Open)
                    </p>
                    <p className="text-2xl font-black text-amber-700 mt-1">
                        {openCount}
                        {unreadCount > 0 && (
                            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                                {unreadCount} unread
                            </span>
                        )}
                    </p>
                </div>
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                        Replied
                    </p>
                    <p className="text-2xl font-black text-blue-700 mt-1">{repliedCount}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Resolved
                    </p>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-white col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Avg. Rating
                    </p>
                    <p className="text-2xl font-black text-zinc-900 mt-1 flex items-center gap-1.5">
                        {avgRating}
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    </p>
                </div>
            </div>

            {/* Split-Pane Console */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-xs min-h-[580px]">
                {/* Left Pane: Thread List */}
                <div className="lg:col-span-5 xl:col-span-4 border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col bg-zinc-50/50">
                    {/* Search & Filters */}
                    <div className="p-3.5 border-b border-zinc-200 bg-white space-y-2.5">
                        <div className="relative">
                            <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search passenger, email, or message..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {(["ALL", "OPEN", "REPLIED", "RESOLVED"] as const).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                        statusFilter === st
                                            ? "bg-zinc-900 text-white"
                                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="ml-auto rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700"
                            >
                                <option value="ALL">All Topics</option>
                                <option value="Customer Service">Customer Service</option>
                                <option value="Feedback">Feedback</option>
                                <option value="Booking Issue">Booking Issue</option>
                                <option value="Refund / Rebooking">Refund / Rebooking</option>
                            </select>
                        </div>
                    </div>

                    {/* Thread List Items */}
                    <div className="flex-1 overflow-y-auto divide-y divide-zinc-200 max-h-[480px] lg:max-h-[540px]">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-zinc-400 text-xs gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading inquiries...
                            </div>
                        ) : filteredThreads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-2">
                                <Inbox className="h-8 w-8 text-zinc-300" />
                                <p className="text-sm font-bold text-zinc-600">No conversations found</p>
                                <p className="text-xs text-zinc-400">
                                    Messages and feedback from passengers will appear here automatically.
                                </p>
                            </div>
                        ) : (
                            filteredThreads.map((t) => {
                                const lastMsg = t.messages[t.messages.length - 1];
                                const isSelected = t.id === selectedId;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleSelectThread(t)}
                                        className={`w-full text-left p-3.5 transition-colors hover:bg-zinc-100/80 ${
                                            isSelected ? "bg-red-50/70 border-l-4 border-l-red-600" : ""
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {t.unread_by_admin && (
                                                    <span className="h-2 w-2 rounded-full bg-red-600 shrink-0" />
                                                )}
                                                <span className="text-xs font-black text-zinc-900 truncate">
                                                    {t.customer_name}
                                                </span>
                                            </div>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                    t.status === "RESOLVED"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : t.status === "REPLIED"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}
                                            >
                                                {t.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-1.5">
                                            <span className="font-semibold px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-700">
                                                {t.category}
                                            </span>
                                            {t.rating ? (
                                                <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    {t.rating}/5
                                                </span>
                                            ) : null}
                                            <span className="ml-auto">
                                                {new Date(t.updated_at).toLocaleDateString("en-PH", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>

                                        <p className="text-xs text-zinc-600 line-clamp-2 leading-snug">
                                            {lastMsg?.sender_role === "ADMIN" ? "You: " : ""}
                                            {lastMsg?.message || t.subject}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Pane: Active Conversation */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-white">
                    {!activeThread ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3 text-zinc-400">
                            <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
                                <MessageSquare className="h-7 w-7 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-zinc-700">
                                    Select a conversation to view &amp; reply
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                    All passenger inquiries and feedback from the website chatbox appear in the left inbox.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Conversation Header */}
                            <div className="p-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/70">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-zinc-500" />
                                        <h2 className="text-sm font-black text-zinc-900">
                                            {activeThread.customer_name}
                                        </h2>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
                                            {activeThread.category}
                                        </span>
                                        {activeThread.rating ? (
                                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                {activeThread.rating} / 5
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                                        {activeThread.customer_email && (
                                            <span className="inline-flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {activeThread.customer_email}
                                            </span>
                                        )}
                                        {activeThread.customer_phone && (
                                            <span className="inline-flex items-center gap-1 font-mono">
                                                <Phone className="h-3 w-3" />
                                                {activeThread.customer_phone}
                                            </span>
                                        )}
                                        <span className="font-mono text-[10px] text-zinc-400">
                                            ID: {activeThread.id}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {activeThread.status !== "RESOLVED" ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleStatusChange(activeThread.id, "RESOLVED")
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Mark Resolved
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleStatusChange(activeThread.id, "OPEN")
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
                                        >
                                            <Clock className="h-3.5 w-3.5" />
                                            Reopen Thread
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages Stream */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50/30 max-h-[360px]">
                                {activeThread.messages.map((msg) => {
                                    const isAdmin = msg.sender_role === "ADMIN";
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${
                                                isAdmin ? "items-end" : "items-start"
                                            }`}
                                        >
                                            <span className="text-[10px] font-semibold text-zinc-400 mb-1 px-1">
                                                {isAdmin
                                                    ? `${msg.sender_name} (Admin)`
                                                    : msg.sender_name}
                                            </span>
                                            <div
                                                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                                                    isAdmin
                                                        ? "bg-zinc-900 text-white rounded-br-sm"
                                                        : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm"
                                                }`}
                                            >
                                                {msg.message}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 mt-1 px-1">
                                                {new Date(msg.created_at).toLocaleString("en-PH", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Reply Templates + Admin Composer */}
                            <div className="p-4 border-t border-zinc-200 bg-white space-y-3">
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 shrink-0 mr-1">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        Quick Reply:
                                    </span>
                                    {QUICK_REPLIES.map((tpl, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setReplyText(tpl)}
                                            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors max-w-[200px] truncate"
                                            title={tpl}
                                        >
                                            {tpl}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handleSendReply} className="flex items-end gap-2.5">
                                    <textarea
                                        rows={2}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                                handleSendReply();
                                            }
                                        }}
                                        placeholder="Type your response to the passenger... (Ctrl+Enter to send)"
                                        className="flex-1 rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !replyText.trim()}
                                        className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-2 disabled:opacity-40 transition-colors shrink-0"
                                    >
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        Send Reply
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
