"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Megaphone, Plus, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw, Eye } from "lucide-react";
import {
    getAnnouncementsAction,
    addAnnouncementAction,
    updateAnnouncementAction,
    deleteAnnouncementAction,
    AnnouncementItem
} from "@/app/actions/announcement";

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    // Form states
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [feedback, setFeedback] = useState<string | null>(null);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await getAnnouncementsAction();
            if (res.success && res.data) {
                setAnnouncements(res.data);
            }
        } catch (err: any) {
            console.error("Failed to load announcements:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setSubmitting(true);
        setFeedback(null);
        try {
            const res = await addAnnouncementAction({
                title: title.trim(),
                content: content.trim(),
                image_url: imageUrl.trim() || null,
                is_active: isActive,
            });

            if (res.success) {
                setTitle("");
                setContent("");
                setImageUrl("");
                setIsActive(true);
                setOpenModal(false);
                loadAnnouncements();
            } else {
                setFeedback(res.error || "Failed to create announcement");
            }
        } catch (err: any) {
            setFeedback(err?.message || "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (item: AnnouncementItem) => {
        const newStatus = !item.is_active;
        try {
            await updateAnnouncementAction(item.id, { is_active: newStatus });
            setAnnouncements(prev =>
                prev.map(a => a.id === item.id ? { ...a, is_active: newStatus } : a)
            );
        } catch (err) {
            console.error("Failed to toggle status:", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteAnnouncementAction(id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("Failed to delete announcement:", err);
        }
    };

    const handleSeedDefault = async () => {
        setSubmitting(true);
        try {
            await addAnnouncementAction({
                title: "New Ride, Better Journey",
                content: "We're happy to announce that a new bus unit has officially arrived and is now ready to serve our passengers! Enjoy a safer, smoother, and more comfortable trip.",
                image_url: null,
                is_active: true,
            });
            loadAnnouncements();
        } finally {
            setSubmitting(false);
        }
    };

    const activeCount = announcements.filter(a => a.is_active).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
                        <Megaphone className="h-7 w-7 text-red-600" />
                        Announcements & Broadcasts
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Publish operational advisories, route notices, and promotional banners to passenger screens in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadAnnouncements} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    <Dialog open={openModal} onOpenChange={setOpenModal}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700 font-bold">
                                <Plus className="mr-1.5 h-4 w-4" /> New Announcement
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create Broadcast Announcement</DialogTitle>
                                <DialogDescription>
                                    This will appear in the top marquee banner on the Superlines website.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreate} className="space-y-4 pt-2">
                                {feedback && (
                                    <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{feedback}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="aTitle" className="font-bold text-xs uppercase tracking-wider">
                                        Announcement Title *
                                    </Label>
                                    <Input
                                        id="aTitle"
                                        required
                                        placeholder="e.g. Daet Route Advisory, Holiday Schedule"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="aContent" className="font-bold text-xs uppercase tracking-wider">
                                        Announcement Message / Content *
                                    </Label>
                                    <Textarea
                                        id="aContent"
                                        required
                                        rows={3}
                                        placeholder="Provide complete details for passengers..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="aImg" className="font-bold text-xs uppercase tracking-wider">
                                        Media / Image / Video URL (Optional)
                                    </Label>
                                    <Input
                                        id="aImg"
                                        placeholder="https://example.com/banner.png or .mp4"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Direct link to image (.jpg, .png) or short video clip (.mp4, .webm).
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="aActive"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                                    />
                                    <Label htmlFor="aActive" className="text-sm font-semibold cursor-pointer">
                                        Publish immediately (Active)
                                    </Label>
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-red-600 hover:bg-red-700 font-bold"
                                    >
                                        {submitting ? "Publishing..." : "Publish Announcement"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Total Broadcasts</CardDescription>
                        <CardTitle className="text-2xl font-black">{announcements.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        All announcements created in system
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Live On Website</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-600">{activeCount}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Currently displayed in passenger marquee
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Inactive / Drafts</CardDescription>
                        <CardTitle className="text-2xl font-black text-zinc-500">
                            {announcements.length - activeCount}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Hidden from passenger views
                    </CardContent>
                </Card>
            </div>

            {/* Announcements List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Announcements</CardTitle>
                    <CardDescription>
                        Manage active statuses, edit messages, or remove outdated advisories.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-zinc-400" />
                            Loading announcements...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                            <Megaphone className="h-10 w-10 text-zinc-300 mx-auto" />
                            <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">
                                No announcements published yet
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Broadcast vital travel updates or seed the default Superlines fleet announcement.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSeedDefault}
                                disabled={submitting}
                                className="font-semibold"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1 text-red-600" />
                                Add Superlines Fleet Notice
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {announcements.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                                        item.is_active
                                            ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm"
                                            : "bg-zinc-50/80 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/60 opacity-70"
                                    }`}
                                >
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        {item.image_url ? (
                                            item.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                <video
                                                    src={item.image_url}
                                                    className="h-12 w-16 rounded-lg object-cover shrink-0 border"
                                                    muted
                                                    loop
                                                    autoPlay
                                                    playsInline
                                                />
                                            ) : (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={item.image_url}
                                                    alt="Announcement preview"
                                                    className="h-12 w-16 rounded-lg object-cover shrink-0 border"
                                                />
                                            )
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 shrink-0 font-bold">
                                                <Megaphone className="h-5 w-5" />
                                            </div>
                                        )}

                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                                    {item.title}
                                                </h4>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                                        item.is_active
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                                            : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                                    }`}
                                                >
                                                    {item.is_active ? (
                                                        <>
                                                            <CheckCircle2 className="h-3 w-3" /> Live
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-3 w-3" /> Inactive
                                                        </>
                                                    )}
                                                </span>
                                            </div>

                                            <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                                                {item.content}
                                            </p>

                                            {item.created_at && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    Published: {new Date(item.created_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggleStatus(item)}
                                            className="text-xs font-semibold h-8"
                                        >
                                            {item.is_active ? "Deactivate" : "Activate"}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(item.id)}
                                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                                            title="Delete announcement"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
