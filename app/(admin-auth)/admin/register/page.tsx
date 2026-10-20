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
    User,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    AlertOctagon,
    KeyRound,
    Building2,
    CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminRegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form States
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("ADMIN");
    const [terminal, setTerminal] = useState("Cubao Central Terminal");
    const [adminKey, setAdminKey] = useState("SUPERLINES2026");

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const handleAdminRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!firstName.trim() || !lastName.trim()) {
            setError("Please enter your complete first and last name.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match. Please re-enter your password.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/admin-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    role,
                    terminal,
                    adminKey: adminKey.trim().toUpperCase(),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || "Failed to create administrator account.");
                setIsLoading(false);
                return;
            }

            // Also synchronize client supabase session if available
            try {
                await supabase.auth.signInWithPassword({
                    email: email.trim().toLowerCase(),
                    password,
                });
            } catch {}

            setSuccessMessage("Administrator account created successfully! Redirecting to Admin Portal...");

            setTimeout(() => {
                router.refresh();
                router.push(data.redirectUrl || "/admin");
            }, 1200);
        } catch (err: any) {
            console.error("Admin Registration Error:", err);
            setError(err?.message || "An unexpected error occurred during administrator registration.");
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
                            href="/admin/login"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg"
                        >
                            Sign In to Admin
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Form Container */}
            <main className="flex-1 w-full max-w-xl mx-auto px-4 py-10 flex flex-col items-center justify-center">
                {/* Header Brand */}
                <div className="mb-6 text-center w-full">
                    <div className="mx-auto mb-3 flex items-center justify-center">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={68}
                            height={54}
                            className="h-14 w-auto object-contain drop-shadow-xl"
                            priority
                        />
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/50 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-red-400 shadow-sm mb-2">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Personnel Registration</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                        Create <span className="text-red-500">Admin Account</span>
                    </h1>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mt-1">
                        Register authorized administrator or dispatch personnel
                    </p>
                </div>

                {/* Registration Card */}
                <Card className="w-full bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-md text-zinc-100 rounded-3xl overflow-hidden">
                    <CardHeader className="space-y-1 pb-4 p-6 sm:p-8 border-b border-zinc-800/60 bg-zinc-950/40">
                        <CardTitle className="text-xl font-black flex items-center gap-2.5 text-white">
                            <KeyRound className="h-5 w-5 text-red-500" />
                            <span>Administrator Sign Up</span>
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-xs leading-relaxed">
                            Create your credentials for centralized fleet control, schedules, and operations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6 sm:p-8">
                        <form onSubmit={handleAdminRegister} className="space-y-4">
                            {error && (
                                <div className="rounded-xl bg-red-950/70 border border-red-800 p-3.5 text-xs text-red-200 flex items-start gap-2.5 shadow-inner">
                                    <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{error}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="rounded-xl bg-emerald-950/70 border border-emerald-800 p-3.5 text-xs text-emerald-200 flex items-center gap-2.5 shadow-inner">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                    <span className="leading-relaxed font-semibold">{successMessage}</span>
                                </div>
                            )}

                            {/* Name Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="adminFirstName" className="text-xs text-zinc-300 font-semibold">
                                        First Name
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="adminFirstName"
                                            type="text"
                                            placeholder="Juan"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="pl-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="adminLastName" className="text-xs text-zinc-300 font-semibold">
                                        Last Name
                                    </Label>
                                    <Input
                                        id="adminLastName"
                                        type="text"
                                        placeholder="Dela Cruz"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email Address */}
                            <div className="space-y-1.5">
                                <Label htmlFor="adminEmail" className="text-xs text-zinc-300 font-semibold">
                                    Official Admin Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="adminEmail"
                                        type="email"
                                        placeholder="admin.juandelacruz@superlines.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl"
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Role and Terminal Assignment */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="adminRole" className="text-xs text-zinc-300 font-semibold">
                                        Administrative Role
                                    </Label>
                                    <select
                                        id="adminRole"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="ADMIN">System Administrator</option>
                                        <option value="OPERATIONS_DISPATCHER">Operations Dispatcher</option>
                                        <option value="TERMINAL_SUPERVISOR">Terminal Supervisor</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="adminTerminal" className="text-xs text-zinc-300 font-semibold">
                                        Assigned Terminal
                                    </Label>
                                    <div className="relative">
                                        <select
                                            id="adminTerminal"
                                            value={terminal}
                                            onChange={(e) => setTerminal(e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="Cubao Central Terminal">Cubao Central Terminal (EDSA)</option>
                                            <option value="PITX Integrated Terminal Exchange">PITX Central Terminal</option>
                                            <option value="Daet Central Bus Terminal">Daet Central Terminal</option>
                                            <option value="Atimonan Head Office">Atimonan Head Office</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Passwords */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="regPassword" className="text-xs text-zinc-300 font-semibold">
                                        Password (min 6 chars)
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="regPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl font-mono"
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirmPassword" className="text-xs text-zinc-300 font-semibold">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 pr-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl font-mono"
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Authorization Key */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="adminKey" className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                                        <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                                        <span>Security Authorization Passcode</span>
                                    </Label>
                                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded">
                                        Default: SUPERLINES2026
                                    </span>
                                </div>
                                <Input
                                    id="adminKey"
                                    type="text"
                                    placeholder="SUPERLINES2026"
                                    value={adminKey}
                                    onChange={(e) => setAdminKey(e.target.value.toUpperCase())}
                                    className="bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl font-mono uppercase"
                                    required
                                />
                                <p className="text-[11px] text-zinc-500">
                                    Required to prevent unauthorized registration of administrative credentials.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-12 shadow-lg shadow-red-600/30 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating Admin Account..." : (
                                    <>
                                        <span>Create Administrator Account</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Security Notice */}
                        <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4 text-xs text-zinc-400 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                                <AlertOctagon className="h-4 w-4 shrink-0" />
                                <span>Official Staff Registration</span>
                            </div>
                            <p className="leading-relaxed text-[11px] text-zinc-400">
                                This portal is strictly for Superlines management, operations dispatchers, and terminal supervisors. All registrations and IP addresses are audited.
                            </p>
                        </div>

                        <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800/80 flex flex-col gap-1.5">
                            <div>
                                <span>Already have an administrator account? </span>
                                <Link href="/admin/login" className="font-bold text-red-400 hover:text-red-300 transition-colors hover:underline">
                                    Sign In to Admin Portal
                                </Link>
                            </div>
                            <div>
                                <span>Are you a passenger booking a bus? </span>
                                <Link href="/register" className="font-semibold text-zinc-400 hover:text-white transition-colors hover:underline">
                                    Passenger Registration
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-800/80 py-4 bg-zinc-950/80 text-center text-xs text-zinc-500">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© 2026 Superlines Transportation Co. Inc. All rights reserved.</p>
                    <p className="font-mono text-[11px] text-zinc-600">Central Fleet Management System</p>
                </div>
            </footer>
        </div>
    );
}
