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
import {
    ShieldCheck,
    ShieldAlert,
    Lock,
    Mail,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    AlertOctagon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Staff Portal Security Gate States
    const [isGateUnlocked, setIsGateUnlocked] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return (
                sessionStorage.getItem("superlines_staff_gate_unlocked") === "true" ||
                document.cookie.includes("superlines_staff_gate=unlocked")
            );
        }
        return false;
    });
    const [staffGatePasscode, setStaffGatePasscode] = useState("");
    const [showStaffGatePasscode, setShowStaffGatePasscode] = useState(false);
    const [staffGateError, setStaffGateError] = useState<string | null>(null);

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const handleUnlockStaffGate = (e: React.FormEvent) => {
        e.preventDefault();
        setStaffGateError(null);

        const clean = staffGatePasscode.trim().toLowerCase();
        const validPasscodes = [
            "staff123",
            "admin123",
            "teller123",
            "conductor123",
            "superlines2026",
            "superlines",
        ];

        if (validPasscodes.includes(clean)) {
            if (typeof window !== "undefined") {
                sessionStorage.setItem("superlines_staff_gate_unlocked", "true");
                document.cookie = "superlines_staff_gate=unlocked; path=/; max-age=3600; SameSite=Lax";
            }
            setIsGateUnlocked(true);
        } else {
            setStaffGateError("Access Denied: Invalid staff security passcode. Unauthorized passenger entry is strictly prohibited.");
        }
    };

    const executeAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Call system login API with explicit portal: "admin"
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: email.trim(), 
                    password: password,
                    portal: "admin" 
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || "Authentication failed. Invalid administrator credentials.");
                setIsLoading(false);
                return;
            }

            // Verify role is strictly staff or admin
            const role = (data.role || data.user?.role || "").toUpperCase();
            if (role === "PASSENGER" || role === "CLIENT") {
                setError("Access Denied: Passengers are strictly prohibited from accessing the Superlines Admin Portal.");
                setIsLoading(false);
                return;
            }

            // Sync supabase client session if available
            try {
                await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password,
                });
            } catch {}

            // Redirect to appropriate operational dashboard
            let target = data.redirectUrl || "/admin";
            if (role === "ADMIN") target = "/admin";
            else if (role === "TELLER") target = "/teller/walk-in";
            else if (role === "CONDUCTOR") target = "/conductor";

            router.refresh();
            router.push(target);
        } catch (err: any) {
            console.error("Admin Login Error:", err);
            setError(err?.message || "An unexpected error occurred during administrator authentication.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100 flex flex-col justify-between">
            {/* Top Navigation Bar */}
            <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
                                Administrator Portal
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
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-red-950/40 border border-red-800/40 px-3 py-1.5 rounded-lg"
                        >
                            Passenger Portal <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Centered Admin Login Form Only */}
            <main className="flex-1 w-full max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center">
                {/* Header Brand */}
                <div className="mb-6 text-center w-full">
                    <div className="mx-auto mb-3 flex items-center justify-center">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={72}
                            height={58}
                            className="h-16 w-auto object-contain drop-shadow-xl"
                            priority
                        />
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/50 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-red-400 shadow-sm mb-2">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Authorized Personnel Only</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                        Superlines <span className="text-red-500">Admin Portal</span>
                    </h1>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mt-1">
                        Centralized Fleet Management, Turnarounds & Ticketing
                    </p>
                </div>

                {/* Conditional Gate Check: Personnel Verification Card or Admin Sign In Form */}
                {!isGateUnlocked ? (
                    <Card className="w-full bg-zinc-900/90 border-2 border-red-600/50 shadow-2xl backdrop-blur-md text-zinc-100 rounded-3xl overflow-hidden">
                        <CardHeader className="space-y-1 pb-4 p-6 sm:p-8 border-b border-zinc-800/60 bg-zinc-950/40 text-center">
                            <div className="h-12 w-12 rounded-2xl bg-red-950/80 border border-red-600/40 text-red-500 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-red-900/30">
                                <Lock className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tight">
                                Staff Passcode Required
                            </CardTitle>
                            <CardDescription className="text-zinc-400 text-xs leading-relaxed">
                                Enter the personnel authorization passcode to access the Superlines staff and administrator portal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6 sm:p-8">
                            <form onSubmit={handleUnlockStaffGate} className="space-y-4">
                                {staffGateError && (
                                    <div className="rounded-xl bg-red-950/80 border border-red-800 p-3.5 text-xs text-red-200 flex items-start gap-2.5 shadow-inner">
                                        <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{staffGateError}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="gatePasscode" className="text-xs text-zinc-300 font-semibold">
                                        Staff Passcode
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="gatePasscode"
                                            type={showStaffGatePasscode ? "text" : "password"}
                                            placeholder="Enter staff security passcode..."
                                            value={staffGatePasscode}
                                            onChange={(e) => setStaffGatePasscode(e.target.value)}
                                            className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl font-mono"
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowStaffGatePasscode(!showStaffGatePasscode)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {showStaffGatePasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-12 shadow-lg shadow-red-600/30 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                                >
                                    <span>Verify & Unlock Portal</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </form>

                            <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800/80">
                                <span>Are you a passenger? </span>
                                <Link href="/login" className="font-bold text-red-400 hover:text-red-300 transition-colors hover:underline">
                                    Return to Passenger Portal
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Administrator Sign In Form */
                    <Card className="w-full bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-md text-zinc-100 rounded-3xl overflow-hidden">
                        <CardHeader className="space-y-1 pb-4 p-6 sm:p-8 border-b border-zinc-800/60 bg-zinc-950/40">
                            <CardTitle className="text-xl font-black flex items-center gap-2.5 text-white">
                                <Lock className="h-5 w-5 text-red-500" />
                                <span>Administrator Sign In</span>
                            </CardTitle>
                            <CardDescription className="text-zinc-400 text-xs leading-relaxed">
                                Sign in with your authorized Superlines administrator credentials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6 sm:p-8">
                            <form onSubmit={executeAdminLogin} className="space-y-4">
                                {error && (
                                    <div className="rounded-xl bg-red-950/70 border border-red-800 p-3.5 text-xs text-red-200 flex items-start gap-2.5 shadow-inner">
                                        <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="adminEmail" className="text-xs text-zinc-300 font-semibold">
                                        Admin Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="adminEmail"
                                            type="email"
                                            placeholder="admin@superlines.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl"
                                            required
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="adminPassword" className="text-xs text-zinc-300 font-semibold">
                                            Password
                                        </Label>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="adminPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl font-mono"
                                            required
                                            autoComplete="current-password"
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
                                    <Checkbox id="rememberAdmin" className="border-zinc-700 data-[state=checked]:bg-red-600 rounded" />
                                    <label htmlFor="rememberAdmin" className="text-xs text-zinc-400 font-medium cursor-pointer">
                                        Remember my admin login on this device
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-12 shadow-lg shadow-red-600/30 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Verifying Authorization..." : (
                                        <>
                                            <span>Sign In to Admin Portal</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Security Notice */}
                            <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4 text-xs text-zinc-400 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                                    <AlertOctagon className="h-4 w-4 shrink-0" />
                                    <span>Restricted System</span>
                                </div>
                                <p className="leading-relaxed text-[11px] text-zinc-400">
                                    Passengers and unauthorized personnel are strictly forbidden from accessing this portal. All session activities and IP addresses are audited.
                                </p>
                            </div>

                            <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800/80">
                                <span>Looking to book a trip or check your tickets? </span>
                                <Link href="/login" className="font-bold text-red-400 hover:text-red-300 transition-colors hover:underline">
                                    Go to Passenger Sign In
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-800/80 py-4 bg-zinc-950/80 text-center text-xs text-zinc-500">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© 2026 Superlines Transportation Co. Inc. All rights reserved.</p>
                    <p className="font-mono text-[11px] text-zinc-600">Administrative & Operational Network</p>
                </div>
            </footer>
        </div>
    );
}
