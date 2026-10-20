"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
    RefreshCw,
    KeyRound,
    ArrowRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [hasValidSession, setHasValidSession] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                // 1. Check if Supabase client already has an active session
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    if (mounted) {
                        setHasValidSession(true);
                        setIsCheckingSession(false);
                    }
                    return;
                }

                // 2. Check if URL hash has access_token (hash-based recovery from email)
                if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
                    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
                    const accessToken = hashParams.get("access_token");
                    const refreshToken = hashParams.get("refresh_token");

                    if (accessToken) {
                        const { error: setSessionErr } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || "",
                        });
                        if (!setSessionErr && mounted) {
                            setHasValidSession(true);
                            setIsCheckingSession(false);
                            return;
                        }
                    }
                }

                // 3. Listen to auth state changes (e.g. PASSWORD_RECOVERY event)
                const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === "PASSWORD_RECOVERY" || session) {
                        if (mounted) {
                            setHasValidSession(true);
                            setIsCheckingSession(false);
                        }
                    }
                });

                // Short timeout to allow hash parsing
                setTimeout(() => {
                    if (mounted) {
                        setIsCheckingSession(false);
                    }
                }, 1500);

                return () => {
                    authListener?.subscription.unsubscribe();
                };
            } catch (err) {
                console.warn("Session check error in reset password:", err);
                if (mounted) setIsCheckingSession(false);
            }
        };

        checkSession();

        return () => {
            mounted = false;
        };
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!password) {
            setError("Please enter your new password.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match. Please re-type your new password.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Try updating via Supabase client directly
            const { error: updateErr } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateErr) {
                // Fallback to server API endpoint
                const res = await fetch("/api/auth/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    setError(updateErr.message || data.error || "Failed to update password. Your reset link may have expired.");
                    setIsLoading(false);
                    return;
                }
            }

            setIsSuccess(true);
        } catch (err: any) {
            console.error("Password update error:", err);
            setError(err?.message || "An unexpected error occurred while updating your password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-red-500 selection:text-white">
            {/* Top Bar Navigation */}
            <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={36}
                            height={28}
                            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                            priority
                        />
                        <span className="text-xl font-black uppercase tracking-tight text-red-500">
                            Superlines
                        </span>
                        <span className="hidden sm:inline text-xs font-bold text-zinc-400 border-l border-zinc-800 pl-2.5">
                            Set New Password
                        </span>
                    </Link>

                    <Link
                        href="/login"
                        className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </header>

            {/* Maximized Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 flex items-center justify-center">
                <div className="w-full max-w-lg">
                    <Card className="border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
                        <CardHeader className="space-y-1 pb-4 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-800/30 to-transparent">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-red-500" />
                                    <span>Set New Password</span>
                                </CardTitle>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                                    Verified Session
                                </span>
                            </div>
                            <CardDescription className="text-xs text-zinc-400">
                                Enter your new password below to secure your Superlines account.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-6 space-y-5">
                            {isCheckingSession ? (
                                <div className="py-12 text-center space-y-3 text-zinc-400">
                                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-500" />
                                    <p className="text-xs font-medium">Verifying your secure password reset token...</p>
                                </div>
                            ) : isSuccess ? (
                                <div className="py-4 space-y-5 text-center">
                                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                                        <CheckCircle2 className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-white">Password Updated! 🎉</h3>
                                        <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                                            Your Superlines account password has been successfully updated. You can now sign in with your new credentials.
                                        </p>
                                    </div>

                                    <Button
                                        asChild
                                        className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 text-sm"
                                    >
                                        <Link href="/login" className="flex items-center justify-center gap-2">
                                            <span>Sign In to Your Account</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleReset} className="space-y-4">
                                    {error && (
                                        <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/40 p-3.5 text-xs text-red-300 animate-in fade-in-50">
                                            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                                            <div className="leading-relaxed">{error}</div>
                                        </div>
                                    )}

                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs font-bold text-zinc-300">
                                            New Password
                                        </Label>
                                        <div className="relative flex items-center">
                                            <Lock className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                placeholder="At least 6 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 pr-10 h-11 bg-zinc-950/60 border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-100 placeholder:text-zinc-600 rounded-xl text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                                                aria-label="Toggle password visibility"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm New Password */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-300">
                                            Confirm New Password
                                        </Label>
                                        <div className="relative flex items-center">
                                            <Lock className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                required
                                                placeholder="Re-enter your new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pl-10 pr-10 h-11 bg-zinc-950/60 border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-100 placeholder:text-zinc-600 rounded-xl text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                                                aria-label="Toggle confirm password visibility"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password Criteria Checklist */}
                                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 space-y-1 text-xs text-zinc-400">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${password.length >= 6 ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                            <span className={password.length >= 6 ? "text-emerald-400 font-semibold" : ""}>
                                                Minimum of 6 characters
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${password && password === confirmPassword ? "bg-emerald-500" : "bg-zinc-600"}`} />
                                            <span className={password && password === confirmPassword ? "text-emerald-400 font-semibold" : ""}>
                                                Passwords match
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                <span>Updating Password...</span>
                                            </>
                                        ) : (
                                            <span>Update Password & Save</span>
                                        )}
                                    </Button>

                                    <div className="pt-2 text-center">
                                        <Link
                                            href="/login"
                                            className="text-xs text-zinc-400 hover:text-white transition-colors"
                                        >
                                            Cancel & Back to Sign In
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800/80 py-4 text-center text-xs text-zinc-500">
                <div className="w-full max-w-7xl mx-auto px-4">
                    &copy; 2026 Superlines Transportation Co. Inc. &bull; Official Online Reservation & Ticketing Portal
                </div>
            </footer>
        </div>
    );
}
