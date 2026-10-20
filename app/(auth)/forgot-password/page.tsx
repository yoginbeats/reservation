"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Mail,
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    Clock,
    Sparkles,
    AlertCircle,
    RefreshCw,
    Lock,
    Send
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [sentEmail, setSentEmail] = useState<string>("");

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
            setError("Please enter your registered email address.");
            return;
        }

        setIsLoading(true);

        try {
            // First call our server-side forgot-password endpoint (which handles Supabase native + admin link + staff notice)
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: cleanEmail }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                // If API returned a custom error, fallback to direct client-side Supabase call
                const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
                const { error: clientErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
                    redirectTo,
                });

                if (clientErr) {
                    setError(clientErr.message || data.error || "Failed to send reset link. Please try again.");
                    setIsLoading(false);
                    return;
                }
            }

            setSentEmail(cleanEmail);
            setSuccessMessage(
                data.message ||
                `A secure password reset link has been sent to ${cleanEmail}. Please check your inbox and follow the instructions.`
            );
        } catch (err: any) {
            console.error("Forgot password submit error:", err);
            // Client-side fallback
            try {
                const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
                const { error: clientErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
                    redirectTo,
                });
                if (!clientErr) {
                    setSentEmail(cleanEmail);
                    setSuccessMessage(`A password reset link has been sent to ${cleanEmail}. Please check your inbox.`);
                    return;
                }
            } catch {}

            setError(err?.message || "An unexpected network error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = () => {
        setSuccessMessage(null);
        setError(null);
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
                            Account Recovery
                        </span>
                    </Link>

                    <Link
                        href="/login"
                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Sign In</span>
                    </Link>
                </div>
            </header>

            {/* Maximized Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 flex items-center">
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* Left Column: Security Guarantees & Superlines Identity */}
                    <div className="lg:col-span-7 space-y-6 lg:pr-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-400 shadow-sm">
                                <Sparkles className="h-3.5 w-3.5 text-red-400" />
                                <span>Automated Password Reset</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-tight">
                                Recover Your <span className="text-red-500">Account Access</span>
                            </h1>

                            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
                                Forgot your password? No problem. Enter your registered email address and our automated system will securely deliver a direct reset link straight to your inbox.
                            </p>
                        </div>

                        {/* Security Feature Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-1.5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Encrypted & Verified</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Password reset tokens are cryptographically signed and expire automatically after 1 hour for your protection.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-1.5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                    <Clock className="h-4 w-4" />
                                    <span>Instant Inbox Delivery</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Receive your recovery instructions within seconds. Click the button to immediately set your new password.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400 flex items-center gap-3">
                            <Lock className="h-5 w-5 text-amber-500 shrink-0" />
                            <span>
                                <strong>Staff or Counter Personnel?</strong> Teller and Conductor account credentials are administered centrally at the terminal dispatch office.
                            </span>
                        </div>
                    </div>

                    {/* Right Column: Interactive Reset Card */}
                    <div className="lg:col-span-5 w-full">
                        <Card className="border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
                            <CardHeader className="space-y-1 pb-4 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-800/30 to-transparent">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-black tracking-tight text-white uppercase">
                                        Forgot Password
                                    </CardTitle>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/50">
                                        Email Verification
                                    </span>
                                </div>
                                <CardDescription className="text-xs text-zinc-400">
                                    We will send a password reset link to your registered email address.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-6 space-y-5">
                                {error && (
                                    <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/40 p-3.5 text-xs text-red-300 animate-in fade-in-50">
                                        <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                                        <div className="leading-relaxed">{error}</div>
                                    </div>
                                )}

                                {successMessage ? (
                                    <div className="space-y-5 py-2">
                                        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 text-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                                                <CheckCircle2 className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base font-bold text-white">Reset Link Sent! ✉️</h3>
                                                <p className="text-xs text-zinc-300 leading-relaxed">
                                                    We sent a password reset link to:
                                                </p>
                                                <p className="text-xs font-mono font-bold text-emerald-400 break-all bg-zinc-950/60 py-1 px-3 rounded-lg border border-zinc-800 inline-block">
                                                    {sentEmail}
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                                                Please check your inbox or Spam/Junk folder and click the link to choose your new password. The link expires in 1 hour.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Button
                                                asChild
                                                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/25"
                                            >
                                                <Link href="/login">
                                                    Back to Sign In
                                                </Link>
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleResend}
                                                className="w-full h-10 border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs"
                                            >
                                                Send to another email address
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-xs font-bold text-zinc-300">
                                                Registered Email Address
                                            </Label>
                                            <div className="relative flex items-center">
                                                <Mail className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    autoFocus
                                                    placeholder="passenger@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="pl-10 h-11 bg-zinc-950/60 border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-100 placeholder:text-zinc-600 rounded-xl text-sm"
                                                />
                                            </div>
                                            <p className="text-[11px] text-zinc-500 pl-1">
                                                Enter the email associated with your Superlines ticket bookings.
                                            </p>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    <span>Sending Reset Link...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    <span>Send Password Reset Link</span>
                                                </>
                                            )}
                                        </Button>

                                        <div className="pt-2 text-center">
                                            <Link
                                                href="/login"
                                                className="text-xs text-zinc-400 hover:text-white transition-colors font-medium inline-flex items-center gap-1.5"
                                            >
                                                <ArrowLeft className="h-3 w-3" />
                                                <span>Remembered your password? Sign In</span>
                                            </Link>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
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
