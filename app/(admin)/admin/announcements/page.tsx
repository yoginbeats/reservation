"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BellRing, MoreVertical, Trash2, Loader2, AlertTriangle, Edit, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getAnnouncementsAction, deleteAnnouncementAction } from "@/app/actions/announcement";
import { AnnouncementForm } from "./components/announcement-form";
import { Badge } from "@/components/ui/badge";

export default function AnnouncementsAdminPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        const result = await getAnnouncementsAction();

        if (result.success && result.data) {
            setAnnouncements(result.data);
        } else {
            toast.error("Error loading announcements: " + result.error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleDelete = async () => {
        if (!announcementToDelete) return;
        setIsDeleting(true);

        const result = await deleteAnnouncementAction(announcementToDelete);
        
        setIsDeleting(false);
        setAnnouncementToDelete(null);

        if (!result.success) {
            toast.error("Error deleting announcement: " + result.error);
        } else {
            toast.success("Announcement deleted successfully.");
            fetchAnnouncements();
        }
    };

    const handleOpenCreate = () => {
        setEditingAnnouncement(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (announcement: any) => {
        setEditingAnnouncement(announcement);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        fetchAnnouncements();
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
                    <p className="text-muted-foreground italic">Manage system announcements and alerts.</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-700 transition-all" onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Announcement
                </Button>
            </div>

            <div className="grid gap-6">
                {announcements && announcements.length > 0 ? (
                    announcements.map((announcement: any) => {
                        const createdDate = new Date(announcement.created_at);
                        return (
                            <Card key={announcement.id} className="overflow-hidden transition-all hover:shadow-md">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-zinc-800">
                                        {/* Content */}
                                        <div className="flex-1 p-6 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className={`rounded-full p-2 mt-1 ${announcement.is_active ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                                        <BellRing className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-lg">{announcement.title}</h3>
                                                            {announcement.is_active ? (
                                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-normal">Active</Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="font-normal text-zinc-500">Inactive</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{announcement.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground pl-14">
                                                <span>Created: {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 flex items-center justify-center gap-3 shrink-0">
                                            <Button variant="outline" size="sm" onClick={() => handleOpenEdit(announcement)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                onClick={() => setAnnouncementToDelete(announcement.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="py-20 text-center space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
                                <BellRing className="h-8 w-8 text-zinc-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold">No announcements</h3>
                                <p className="text-muted-foreground">Create an announcement to notify your users about updates or news.</p>
                            </div>
                            <Button className="bg-red-600 hover:bg-red-700" onClick={handleOpenCreate}>Create First Announcement</Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <AnnouncementForm 
                        initialData={editingAnnouncement} 
                        onSuccess={handleFormSuccess} 
                        onCancel={() => setIsFormOpen(false)} 
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Announcement
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this announcement? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setAnnouncementToDelete(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
