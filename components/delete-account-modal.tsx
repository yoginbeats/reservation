"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertTriangle,
    Trash2,
    X,
    Loader2,
    ShieldAlert,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userEmail?: string;
    userName?: string;
}

export function DeleteAccountModal({
    isOpen,
    onClose,
    userId,
    userEmail = "",
    userName = "",
}: DeleteAccountModalProps) {
    const router = useRouter();
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const isConfirmed = confirmText.trim().toUpperCase() === "DELETE" || confirmText.trim().toUpperCase() === "BURAHIN";

    const handleDelete = async () => {
        if (!isConfirmed) return;
        setError(null);
        setIsDeleting(true);

        try {
            const res = await fetch("/api/profile/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to delete account. Please try again.");
            }

            // Clean up all local cache
            if (typeof window !== "undefined") {
                try {
                    localStorage.removeItem(`superlines_avatar_${userId}`);
                    localStorage.removeItem(`superlines_first_name_${userId}`);
                    document.cookie = "superlines_auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                    document.cookie = "superlines_user_role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                    document.cookie = "superlines_user_terminal=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                } catch {}
            }

            setSuccess(true);

            // Redirect to login page with notice parameter
            setTimeout(() => {
                window.location.href = "/login?notice=account_deleted";
            }, 1200);

        } catch (err: any) {
            console.error("Account deletion failed:", err);
            setError(err.message || "An unexpected error occurred while deleting your account.");
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 shadow-2xl p-6 overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                {/* Header Icon + Close */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                                Delete Passenger Account
                            </h3>
                            <p className="text-xs text-red-600 dark:text-red-400 font-bold">
                                Permanent & Irreversible Action
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting || success}
                        className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Account info snippet */}
                <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {userName || "Passenger Account"}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        {userEmail}
                    </p>
                </div>

                {/* Warnings List */}
                <div className="mt-4 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>
                            <strong>Personal Data:</strong> Your name, phone number, address, and profile picture will be permanently deleted.
                        </span>
                    </div>
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            <strong>Digital Tickets:</strong> You will no longer be able to log in to access your digital tickets or view QR codes.
                        </span>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Success Banner */}
                {success && (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Account deleted successfully. Redirecting you to login...</span>
                    </div>
                )}

                {/* Confirmation Input Safeguard */}
                {!success && (
                    <div className="mt-5 space-y-2">
                        <Label htmlFor="delete_confirm_input" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            Type <span className="font-mono text-red-600 font-extrabold">DELETE</span> or <span className="font-mono text-red-600 font-extrabold">BURAHIN</span> to confirm:
                        </Label>
                        <Input
                            id="delete_confirm_input"
                            type="text"
                            disabled={isDeleting}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="h-10 text-sm font-semibold border-red-200 focus:border-red-500 focus:ring-red-500"
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDeleting || success}
                        onClick={onClose}
                        className="text-xs font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={!isConfirmed || isDeleting || success}
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 h-9 shadow-sm"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                Deleting Account...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Permanently Delete Account
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
