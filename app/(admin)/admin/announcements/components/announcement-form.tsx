"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addAnnouncementAction, updateAnnouncementAction } from "@/app/actions/announcement";

interface AnnouncementFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AnnouncementForm({ initialData, onSuccess, onCancel }: AnnouncementFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        is_active: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                content: initialData.content,
                is_active: initialData.is_active
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_active: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.content) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsLoading(true);

        try {
            if (initialData) {
                const result = await updateAnnouncementAction(initialData.id, formData);
                if (result.success) {
                    toast.success("Announcement updated successfully.");
                    onSuccess();
                } else {
                    toast.error("Failed to update announcement: " + result.error);
                }
            } else {
                const result = await addAnnouncementAction(formData);
                if (result.success) {
                    toast.success("Announcement created successfully.");
                    onSuccess();
                } else {
                    toast.error("Failed to create announcement: " + result.error);
                }
            }
        } catch (error: any) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>{initialData ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
                <DialogDescription>
                    {initialData ? "Make changes to the selected announcement." : "Add a new announcement to be displayed to users."}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                        id="title" 
                        name="title" 
                        placeholder="e.g., Holiday Schedule Update" 
                        value={formData.title} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <textarea 
                        id="content" 
                        name="content" 
                        placeholder="Enter the announcement details here..." 
                        rows={4}
                        value={formData.content} 
                        onChange={handleChange} 
                        required 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label>Active Status</Label>
                        <p className="text-[13px] text-muted-foreground">
                            When active, this announcement will be visible on the home page.
                        </p>
                    </div>
                    <Switch
                        checked={formData.is_active}
                        onCheckedChange={handleSwitchChange}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {initialData ? "Update Announcement" : "Publish Announcement"}
                </Button>
            </DialogFooter>
        </form>
    );
}
