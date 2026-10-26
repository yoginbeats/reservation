"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Camera,
    Edit,
    ShieldCheck,
    CheckCircle2,
    Mail,
    Phone,
    Calendar,
    MapPin,
    User,
    Sparkles,
    Check,
    Upload,
    X,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";

interface FacebookProfileCardProps {
    userId: string;
    fullName: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string | null;
    birthdate?: string | null;
    age?: number | string | null;
    address?: string | null;
    initialAvatarUrl?: string | null;
    isProfileComplete?: boolean;
    role?: string | null;
}

export function FacebookProfileCard({
    userId,
    fullName,
    firstName = "",
    middleName = "",
    lastName = "",
    email = "",
    phoneNumber = null,
    birthdate = null,
    age = null,
    address = null,
    initialAvatarUrl,
    isProfileComplete,
    role
}: FacebookProfileCardProps) {
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Avatar state
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Live display state (instantly reflects edits without page reload)
    const [currentFirstName, setCurrentFirstName] = useState(firstName || "");
    const [currentMiddleName, setCurrentMiddleName] = useState(middleName || "");
    const [currentLastName, setCurrentLastName] = useState(lastName || "");
    const [currentFullName, setCurrentFullName] = useState(fullName || "");
    const [currentPhoneNumber, setCurrentPhoneNumber] = useState(phoneNumber || "");
    const [currentBirthdate, setCurrentBirthdate] = useState(birthdate || "");
    const [currentAge, setCurrentAge] = useState<string | number>(age ? String(age) : "");
    const [currentAddress, setCurrentAddress] = useState(address || "");

    // Edit Profile Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFirstName, setEditFirstName] = useState(firstName || "");
    const [editMiddleName, setEditMiddleName] = useState(middleName || "");
    const [editLastName, setEditLastName] = useState(lastName || "");
    const [editPhoneNumber, setEditPhoneNumber] = useState(phoneNumber || "");
    const [editBirthdate, setEditBirthdate] = useState(birthdate || "");
    const [editAge, setEditAge] = useState<string>(age ? String(age) : "");
    const [editAddress, setEditAddress] = useState(address || "");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Sync state when props change
    useEffect(() => {
        setCurrentFirstName(firstName || "");
        setCurrentMiddleName(middleName || "");
        setCurrentLastName(lastName || "");
        setCurrentFullName(fullName || "");
        setCurrentPhoneNumber(phoneNumber || "");
        setCurrentBirthdate(birthdate || "");
        setCurrentAge(age ? String(age) : "");
        setCurrentAddress(address || "");
    }, [firstName, middleName, lastName, fullName, phoneNumber, birthdate, age, address]);

    // Check localStorage on mount and sanitize any legacy bloated auth user_metadata
    useEffect(() => {
        if (typeof window !== "undefined" && userId) {
            const localAvatar = localStorage.getItem(`superlines_avatar_${userId}`);
            if (localAvatar) {
                setAvatarUrl(localAvatar);
            }
        }

        const sanitizeAuthCookies = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.user_metadata?.avatar_url && String(user.user_metadata.avatar_url).startsWith("data:")) {
                    await supabase.auth.updateUser({
                        data: { avatar_url: null }
                    });
                }
            } catch (err) {
                // Ignore silent cleanup errors
            }
        };
        sanitizeAuthCookies();
    }, [userId]);

    useEffect(() => {
        const handleOpenEdit = () => {
            handleOpenEditModal();
        };
        window.addEventListener("superlines_open_profile_edit", handleOpenEdit);
        return () => window.removeEventListener("superlines_open_profile_edit", handleOpenEdit);
    }, [currentFirstName, currentMiddleName, currentLastName, currentPhoneNumber, currentBirthdate, currentAge, currentAddress]);

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Compress and resize image using HTML5 canvas to max 160x160 (under 12KB)
        const img = document.createElement("img");
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;

        img.onload = async () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement("canvas");
            const maxDim = 160;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDim) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);

            setAvatarUrl(compressedBase64);
            setUploading(true);

            // 1. Persist to localStorage for immediate client-side instant load
            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem(`superlines_avatar_${userId}`, compressedBase64);
                    window.dispatchEvent(new CustomEvent("superlines_profile_updated", { detail: { avatarUrl: compressedBase64 } }));
                } catch (storageErr) {
                    console.warn("Storage quota warning:", storageErr);
                }
            }

            // 2. Persist to database profiles table ONLY (NEVER in auth user_metadata cookies)
            try {
                await supabase.from("profiles").upsert({
                    id: userId,
                    avatar_url: compressedBase64,
                    updated_at: new Date().toISOString()
                });

                await supabase.auth.updateUser({
                    data: { avatar_url: null }
                });
            } catch (err) {
                console.warn("Could not sync avatar to profiles table:", err);
            } finally {
                setUploading(false);
                setUploadSuccess(true);
                setTimeout(() => setUploadSuccess(false), 2500);
            }
        };
    };

    // Auto calculate age when birthdate changes in modal
    const handleBirthdateChange = (newDateStr: string) => {
        setEditBirthdate(newDateStr);
        if (newDateStr) {
            const birth = new Date(newDateStr);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                calculatedAge--;
            }
            if (calculatedAge >= 0) {
                setEditAge(String(calculatedAge));
            }
        }
    };

    const handleOpenEditModal = () => {
        setEditFirstName(currentFirstName);
        setEditMiddleName(currentMiddleName);
        setEditLastName(currentLastName);
        setEditPhoneNumber(currentPhoneNumber);
        setEditBirthdate(currentBirthdate);
        setEditAge(currentAge ? String(currentAge) : "");
        setEditAddress(currentAddress);
        setSaveError(null);
        setSaveSuccess(false);
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);

        if (!editFirstName.trim() || !editLastName.trim()) {
            setSaveError("First Name and Last Name are required.");
            return;
        }
        if (!editPhoneNumber.trim()) {
            setSaveError("Please provide your phone number or email address.");
            return;
        }
        if (!editAddress.trim()) {
            setSaveError("Complete home / travel address is required for passenger manifests.");
            return;
        }

        setSaving(true);
        try {
            const newFullName = `${editFirstName.trim()} ${editMiddleName.trim() ? editMiddleName.trim() + " " : ""}${editLastName.trim()}`;
            const parsedAge = editAge ? parseInt(editAge, 10) : null;

            // Call server-side profile update API which guarantees database upsert and Auth sync
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: editFirstName.trim(),
                    middleName: editMiddleName.trim(),
                    lastName: editLastName.trim(),
                    birthdate: editBirthdate || null,
                    age: parsedAge,
                    phoneNumber: editPhoneNumber.trim(),
                    address: editAddress.trim(),
                }),
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || "Failed to update profile record in database.");
            }

            // 3. Immediately update local state for real-time reactivity
            setCurrentFirstName(editFirstName.trim());
            setCurrentMiddleName(editMiddleName.trim());
            setCurrentLastName(editLastName.trim());
            setCurrentFullName(newFullName);
            setCurrentPhoneNumber(editPhoneNumber.trim());
            setCurrentBirthdate(editBirthdate);
            setCurrentAge(parsedAge ? String(parsedAge) : "");
            setCurrentAddress(editAddress.trim());

            if (typeof window !== "undefined") {
                localStorage.setItem(`superlines_first_name_${userId}`, editFirstName.trim());
                window.dispatchEvent(new CustomEvent("superlines_profile_updated", { detail: { firstName: editFirstName.trim(), fullName: newFullName } }));
            }

            setSaveSuccess(true);
            setTimeout(() => {
                setIsEditModalOpen(false);
                setSaveSuccess(false);
                router.refresh();
            }, 900);
        } catch (err: any) {
            console.error("Save profile error:", err);
            setSaveError(err.message || "Failed to save profile changes.");
        } finally {
            setSaving(false);
        }
    };

    // Calculate user initials for fallback avatar
    const initials = currentFullName
        ? currentFullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0].toUpperCase())
              .join("")
        : "U";

    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all">
            {/* Facebook Profile Header (Profile Picture Only - No Cover Photo) */}
            <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                    {/* Left: Facebook Circular Profile Picture + Identity */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                        {/* Circular Profile Picture with Facebook Camera Overlay */}
                        <div className="relative group shrink-0">
                            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full ring-4 ring-zinc-100 dark:ring-zinc-800 shadow-md overflow-hidden bg-gradient-to-tr from-zinc-200 via-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={currentFullName}
                                        className="h-full w-full object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
                                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                            {initials}
                                        </span>
                                    </div>
                                )}

                                {/* Loading Overlay */}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                                        <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Facebook Camera Action Button */}
                            <button
                                type="button"
                                onClick={handleCameraClick}
                                title="Update profile picture"
                                aria-label="Update profile picture"
                                className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 h-9 w-9 rounded-full bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900 transition-transform active:scale-90 cursor-pointer"
                            >
                                <Camera className="h-4 w-4" />
                            </button>

                            {/* Hidden native file input for camera / file upload */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Name, Badges & Verification Status */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    {currentFullName}
                                </h2>

                                {/* Facebook Blue Verified Checkmark Badge */}
                                <span
                                    className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#1877F2] text-white shadow-xs shrink-0"
                                    title="Verified Passenger Identity"
                                >
                                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                </span>
                            </div>

                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                {email}
                            </p>

                            {/* Facebook-style Pill Badges */}
                            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Verified Passenger
                                </span>

                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full">
                                    <ShieldCheck className="h-3 w-3" />
                                    Bus Manifest Active
                                </span>

                                {role && role !== "PASSENGER" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full">
                                        Role: {role}
                                    </span>
                                )}

                                {uploadSuccess && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full animate-in fade-in duration-200">
                                        <Check className="h-3 w-3" />
                                        Photo updated!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Facebook-style Edit Profile Action Button */}
                    <div className="shrink-0 self-center sm:self-start">
                        <Button
                            type="button"
                            onClick={handleOpenEditModal}
                            variant="outline"
                            className="h-10 px-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-sm shadow-xs transition-all active:scale-95"
                        >
                            <Edit className="h-4 w-4 text-zinc-600 dark:text-zinc-300 mr-2" />
                            <span>Edit Profile</span>
                        </Button>
                    </div>
                </div>

                {/* Facebook-style Divider */}
                <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

                {/* Facebook "Intro" / Passenger Manifest Details Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-red-600" />
                                Passenger Account Details
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Verified details used for your bus tickets and passenger manifests
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                        {/* 1. Full Name */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80">
                            <div className="h-9 w-9 rounded-full bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Full Name
                                </p>
                                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                    {currentFullName}
                                </p>
                                {(currentFirstName || currentLastName) && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                        {currentFirstName} {currentMiddleName ? `${currentMiddleName} ` : ""}{currentLastName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 2. Email Address */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80">
                            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Email Address
                                </p>
                                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                    {email}
                                </p>
                                <span className="inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    Verified Account
                                </span>
                            </div>
                        </div>

                        {/* 3. Mobile Phone / Contact */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80">
                            <div className={`h-9 w-9 rounded-full ${currentPhoneNumber?.includes("@") ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"} flex items-center justify-center shrink-0`}>
                                {currentPhoneNumber?.includes("@") ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    {currentPhoneNumber?.includes("@") ? "Contact Phone / Email" : "Mobile Phone"}
                                </p>
                                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                    {currentPhoneNumber || "Not provided yet"}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {currentPhoneNumber?.includes("@") ? "For booking updates & tickets" : "For ticket & SMS alerts"}
                                </p>
                            </div>
                        </div>

                        {/* 4. Age & Birthdate */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80">
                            <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Age & Birthdate
                                </p>
                                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    {currentAge ? `${currentAge} years old` : "Age not set"}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {currentBirthdate
                                        ? new Date(currentBirthdate).toLocaleDateString(undefined, {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                          })
                                        : "Birthdate not set"}
                                </p>
                            </div>
                        </div>

                        {/* 5. Residential / Travel Address */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 sm:col-span-2">
                            <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Residential / Travel Address
                                </p>
                                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                    {currentAddress || "Not provided yet"}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Registered home terminal / destination
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal Dialog */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div 
                        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    <Edit className="h-5 w-5 text-red-600" />
                                    Edit Passenger Profile
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Update your details used for bus tickets and passenger manifests
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {saveError && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-xs text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{saveError}</span>
                            </div>
                        )}

                        {saveSuccess && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>Profile updated successfully! Refreshing details...</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                            {/* 1. Personal Information */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                                    1. Personal Information
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="modal_first_name" className="text-xs font-bold">First Name *</Label>
                                        <Input
                                            id="modal_first_name"
                                            required
                                            value={editFirstName}
                                            onChange={(e) => setEditFirstName(e.target.value)}
                                            placeholder="Eugene"
                                            className="h-9 text-xs font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="modal_middle_name" className="text-xs font-bold">Middle Name</Label>
                                        <Input
                                            id="modal_middle_name"
                                            value={editMiddleName}
                                            onChange={(e) => setEditMiddleName(e.target.value)}
                                            placeholder="San Andres"
                                            className="h-9 text-xs font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="modal_last_name" className="text-xs font-bold">Last Name *</Label>
                                        <Input
                                            id="modal_last_name"
                                            required
                                            value={editLastName}
                                            onChange={(e) => setEditLastName(e.target.value)}
                                            placeholder="Rasco"
                                            className="h-9 text-xs font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <Label htmlFor="modal_birthdate" className="text-xs font-bold">Date of Birth *</Label>
                                        <ModernDatePicker
                                            id="modal_birthdate"
                                            value={editBirthdate}
                                            onChange={handleBirthdateChange}
                                            minYear={1850}
                                            maxDate={new Date().toISOString().split("T")[0]}
                                            placeholder="Select date of birth"
                                            showShortcuts={false}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="modal_age" className="text-xs font-bold">Age (Auto-calculated)</Label>
                                        <Input
                                            id="modal_age"
                                            type="number"
                                            value={editAge}
                                            onChange={(e) => setEditAge(e.target.value)}
                                            placeholder="22"
                                            className="h-9 text-xs font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Contact & Address */}
                            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                                        2. Contact & Residential Address
                                    </h4>
                                    {email && editPhoneNumber !== email && (
                                        <button
                                            type="button"
                                            onClick={() => setEditPhoneNumber(email)}
                                            className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded transition-colors"
                                        >
                                            Use {email}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="modal_phone" className="text-xs font-bold">Phone Number or Email Address *</Label>
                                    <div className="relative">
                                        {editPhoneNumber.includes("@") ? (
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600 transition-colors" />
                                        ) : (
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 transition-colors" />
                                        )}
                                        <Input
                                            id="modal_phone"
                                            required
                                            type="text"
                                            value={editPhoneNumber}
                                            onChange={(e) => setEditPhoneNumber(e.target.value)}
                                            placeholder="0917 123 4567 or yourname@gmail.com"
                                            className="pl-9 h-9 text-xs font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="modal_address" className="text-xs font-bold">Complete Home / Travel Address *</Label>
                                    <Textarea
                                        id="modal_address"
                                        required
                                        rows={2}
                                        value={editAddress}
                                        onChange={(e) => setEditAddress(e.target.value)}
                                        placeholder="House / Unit No., Street, Barangay, Municipality, Province"
                                        className="text-xs font-medium"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <Link
                                    href="/complete-profile"
                                    className="text-[11px] font-bold text-zinc-500 hover:text-red-600 underline"
                                >
                                    Open Full Page Editor &rarr;
                                </Link>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={saving}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4"
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
