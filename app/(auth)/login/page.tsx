"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ShieldAlert,
    ArrowRight,
    User,
    ShieldCheck,
    Bus,
    QrCode,
    Sparkles,
    CheckCircle2,
    Calendar,
    ArrowLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Authenticate passenger
            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (signInErr) {
                if (signInErr.message?.toLowerCase().includes("email not confirmed")) {
                    setError("Your email has not been confirmed yet. Please check your inbox for the confirmation link.");
                } else {
                    setError(signInErr.message);
                }
                setIsLoading(false);
                return;
            }

            // Also synchronize with auth API cookies
            try {
                await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email.trim(), password }),
                });
            } catch {}

            router.refresh();
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Passenger Login Error:", err);
            setError(err?.message || "An unexpected error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (oauthError) {
                setError(oauthError.message);
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err?.message || "Failed to start Google sign in.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col justify-between">
            {/* Top Navigation Bar */}
            <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={38}
                            height={30}
                            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                            priority
                        />
                        <div className="flex flex-col">
                            <span className="text-base font-black tracking-tight text-red-600 uppercase leading-none">
                                Superlines
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                                Passenger Portal
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                        </Link>
                        <div className="h-4 w-[1px] bg-zinc-800" />
                        <Link
                            href="/admin/login"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-red-950/40 border border-red-800/40 px-3 py-1.5 rounded-lg"
                        >
                            <ShieldCheck className="h-3.5 w-3.5" /> Staff Portal
                        </Link>
                    </div>
                </div>
            </header>

            {/* Maximized Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* Left Column: Maximized Superlines Brand & Travel Highlights */}
                    <div className="lg:col-span-7 space-y-6 lg:pr-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-400 shadow-sm">
                                <Sparkles className="h-3.5 w-3.5 text-red-400" />
                                <span>Official Passenger Self-Service</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-tight">
                                Travel Comfortably with <span className="text-red-500">Superlines</span>
                            </h1>

                            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
                                Sign in to select your bus seats, download digital QR boarding passes, manage trip schedules, and enjoy safe Bicolandia express journeys.
                            </p>
                        </div>

                        {/* Feature Badges Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-1.5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Anti-Double Booking</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Real-time seat locking between online passengers and all terminal counter booths.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-1.5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                    <QrCode className="h-4 w-4" />
                                    <span>Instant QR Boarding Pass</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Present your digital ticket QR code directly to the conductor for fast express boarding.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-1.5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                                    <Bus className="h-4 w-4" />
                                    <span>Direct Bound Routes</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Turnaround scheduled departures connecting Cubao, Daet, and PITX Integrated Terminal.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-1.5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>GCash & Online Refunds</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Transparent refund stage tracker and supervisor-authorized trip rebooking options.
                                </p>
                            </div>
                        </div>

                        {/* Active Route Pill */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-zinc-400 font-medium">
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Serving Daily:</span>
                            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                                Cubao Terminal ⇄ Daet Central Terminal
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                                PITX Terminal ⇄ Daet Central Terminal
                            </span>
                        </div>
                    </div>

                    {/* Right Column: Maximized Passenger Sign-In Card */}
                    <div className="lg:col-span-5 w-full">
                        <Card className="w-full bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-md text-zinc-100 rounded-3xl overflow-hidden">
                            <CardHeader className="space-y-1 pb-4 p-6 sm:p-8 border-b border-zinc-800/60 bg-zinc-950/40">
                                <CardTitle className="text-2xl font-black flex items-center gap-2.5 text-white">
                                    <User className="h-6 w-6 text-red-500" />
                                    <span>Passenger Sign In</span>
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-xs">
                                    Enter your registered email and password to access your bookings and travel tickets.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 p-6 sm:p-8">
                                <form onSubmit={handleEmailLogin} className="space-y-4">
                                    {error && (
                                        <div className="rounded-xl bg-red-950/70 border border-red-800 p-3.5 text-xs text-red-200 flex items-start gap-2.5 shadow-inner">
                                            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{error}</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="passengerEmail" className="text-xs text-zinc-300 font-semibold">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="passengerEmail"
                                                type="email"
                                                placeholder="passenger@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="passengerPassword" className="text-xs text-zinc-300 font-semibold">
                                                Password
                                            </Label>
                                            <Link href="/forgot-password" className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="passengerPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-1">
                                        <Checkbox id="rememberPassenger" className="border-zinc-700 data-[state=checked]:bg-red-600 rounded" />
                                        <label htmlFor="rememberPassenger" className="text-xs text-zinc-400 font-medium cursor-pointer">
                                            Keep me logged in on this browser
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-12 shadow-lg shadow-red-600/30 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Signing In..." : (
                                            <>
                                                <span>Sign In to Account</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="bg-zinc-800" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-zinc-900 px-3 text-zinc-500 font-semibold tracking-wider">
                                            or continue with
                                        </span>
                                    </div>
                                </div>

                                {/* Google OAuth Login */}
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    className="w-full border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold h-11 rounded-xl transition-colors"
                                >
                                    <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Sign In with Google
                                </Button>

                                <div className="pt-2 text-center text-xs text-zinc-400">
                                    <span>Don&apos;t have a passenger account yet? </span>
                                    <Link href="/register" className="font-bold text-red-400 hover:text-red-300 transition-colors hover:underline">
                                        Create an Account
                                    </Link>
                                </div>

                                <div className="pt-3 text-center text-xs border-t border-zinc-800/80">
                                    <Link
                                        href="/admin/login"
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <ShieldCheck className="h-4 w-4 text-red-500" />
                                        <span>Authorized Superlines Staff & Admin Portal ➔</span>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-800/80 py-4 bg-zinc-950/80 text-center text-xs text-zinc-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© 2026 Superlines Transportation Co. Inc. All rights reserved.</p>
                    <p className="font-mono text-[11px] text-zinc-600">Daet • Cubao • PITX Integrated Terminal</p>
                </div>
            </footer>
        </div>
    );
}
