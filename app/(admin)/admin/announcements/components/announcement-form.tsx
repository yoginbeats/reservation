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
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/supabase/client";
import { ImagePlus, X } from "lucide-react";

interface AnnouncementFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AnnouncementForm({ initialData, onSuccess, onCancel }: AnnouncementFormProps) {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        is_active: true,
        image_url: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                content: initialData.content,
                is_active: initialData.is_active,
                image_url: initialData.image_url || ""
            });
            if (initialData.image_url) {
                setImagePreview(initialData.image_url);
            }
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_active: checked }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image_url: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.content) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsLoading(true);

        try {
            let finalImageUrl = formData.image_url;

            // Upload image if a new file was selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('announcements')
                    .upload(fileName, imageFile);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    toast.error("Failed to upload image. Please check bucket permissions.");
                    setIsLoading(false);
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('announcements')
                    .getPublicUrl(fileName);
                
                finalImageUrl = publicUrl;
            }

            const payload = {
                ...formData,
                image_url: finalImageUrl
            };

            if (initialData) {
                const result = await updateAnnouncementAction(initialData.id, payload);
                if (result.success) {
                    toast.success("Announcement updated successfully.");
                    onSuccess();
                } else {
                    toast.error("Failed to update announcement: " + result.error);
                }
            } else {
                const result = await addAnnouncementAction(payload);
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
                
                {/* Image Upload Section */}
                <div className="space-y-2">
                    <Label>Cover Media (Optional)</Label>
                    <div 
                        className={cn(
                            "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md relative overflow-hidden group transition-colors",
                            isDragging ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-zinc-300 dark:border-zinc-700"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {imagePreview ? (
                            <div className="relative w-full h-40">
                                {(imageFile && imageFile.type.startsWith('video/')) || (!imageFile && imagePreview.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) ? (
                                    <video src={imagePreview} className="w-full h-full object-cover rounded-md" controls autoPlay playsInline />
                                ) : (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button type="button" variant="destructive" size="sm" onClick={removeImage} className="gap-2">
                                        <X className="w-4 h-4" /> Remove Media
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1 text-center">
                                <ImagePlus className="mx-auto h-12 w-12 text-zinc-400" />
                                <div className="flex text-sm text-zinc-600 dark:text-zinc-400 justify-center">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,video/mp4,video/webm" onChange={handleImageChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-zinc-500">PNG, JPG, GIF, MP4, WEBM up to 20MB</p>
                            </div>
                        )}
                    </div>
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
