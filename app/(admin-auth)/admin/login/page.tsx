"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const executeAdminLogin = async (userEmail: string, userPass: string) => {
        setError(null);
        setIsLoading(true);

        try {
            // 1. Call system login API with explicit portal: "admin"
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: userEmail.trim(), 
                    password: userPass,
                    portal: "admin" 
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || "Authentication failed. Invalid staff or admin credentials.");
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
                    email: userEmail.trim(),
                    password: userPass,
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
            setError(err?.message || "An unexpected error occurred during admin authentication.");
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await executeAdminLogin(email, password);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black py-10 px-4 sm:px-6 flex flex-col justify-center items-center text-zinc-100">
            {/* Top Navigation Back to Passenger Site */}
            <div className="w-full max-w-md mb-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                </Link>

                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                    Passenger Sign In <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Header Brand */}
            <div className="mb-6 text-center max-w-md">
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
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-red-400 shadow-sm mb-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Authorized Operations Only</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                    Superlines <span className="text-red-500">Admin Portal</span>
                </h1>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mt-1">
                    Centralized Fleet Management, Manifests & Dispatch
                </p>
            </div>

            <div className="w-full max-w-md">
                {/* Main Staff Auth Form */}
                <Card className="bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-md text-zinc-100">
                    <CardHeader className="space-y-1 pb-3">
                        <CardTitle className="text-lg font-black flex items-center gap-2 text-white">
                            <Lock className="h-4 w-4 text-red-500" />
                            <span>Staff Security Gateway</span>
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-xs">
                            Please provide your official Superlines personnel credentials to gain access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-red-950/80 border border-red-800 p-3 text-xs text-red-200 flex items-start gap-2 shadow-inner">
                                    <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="adminEmail" className="text-xs text-zinc-300 font-semibold">
                                    Staff Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="adminEmail"
                                        type="email"
                                        placeholder="admin@superlines.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9 bg-zinc-950 border-zinc-800 text-white text-xs h-10 placeholder:text-zinc-600 focus:border-red-500"
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="adminPassword" className="text-xs text-zinc-300 font-semibold">
                                        Staff Security Password
                                    </Label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="adminPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-9 pr-9 bg-zinc-950 border-zinc-800 text-white text-xs h-10 placeholder:text-zinc-600 focus:border-red-500 font-mono"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-11 shadow-lg shadow-red-600/25 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2"
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

                        {/* Security Warning Notice */}
                        <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 text-[11px] text-zinc-400 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                                <AlertOctagon className="h-3.5 w-3.5" />
                                <span>Restricted System</span>
                            </div>
                            <p className="leading-relaxed">
                                Passengers and unauthorized personnel are strictly forbidden from accessing this portal. All session activities and IP addresses are tracked and audited.
                            </p>
                        </div>

                        <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800/80">
                            <span>Looking to book a trip or check your tickets? </span>
                            <Link href="/login" className="font-bold text-red-400 hover:text-red-300 hover:underline">
                                Go to Passenger Sign In
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
