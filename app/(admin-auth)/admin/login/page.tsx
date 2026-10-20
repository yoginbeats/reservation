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
    AlertOctagon,
    Building2,
    Ticket,
    Bus,
    Check,
    Copy,
    Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SYSTEM_CREDENTIALS, SystemCredential } from "@/lib/constants/credentials";

export default function AdminLoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [quickLoggingInId, setQuickLoggingInId] = useState<string | null>(null);

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
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
                setQuickLoggingInId(null);
                return;
            }

            // Verify role is strictly staff or admin
            const role = (data.role || data.user?.role || "").toUpperCase();
            if (role === "PASSENGER" || role === "CLIENT") {
                setError("Access Denied: Passengers are strictly prohibited from accessing the Superlines Admin Portal.");
                setIsLoading(false);
                setQuickLoggingInId(null);
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
            setQuickLoggingInId(null);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await executeAdminLogin(email, password);
    };

    const handleQuickLogin = async (cred: SystemCredential) => {
        setQuickLoggingInId(cred.id);
        setEmail(cred.email);
        setPassword(cred.password);
        await executeAdminLogin(cred.email, cred.password);
    };

    const handleCopyFill = (cred: SystemCredential) => {
        setEmail(cred.email);
        setPassword(cred.password);
        setCopiedEmail(cred.email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const adminCreds = SYSTEM_CREDENTIALS.filter(c => c.role === "ADMIN");
    const tellerCreds = SYSTEM_CREDENTIALS.filter(c => c.role === "TELLER");
    const conductorCreds = SYSTEM_CREDENTIALS.filter(c => c.role === "CONDUCTOR");

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100 flex flex-col justify-between">
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
                                Operations & Staff Gateway
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

            {/* Maximized Main Layout */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    
                    {/* Left Column: Command Center & Active Personnel Directory */}
                    <div className="lg:col-span-7 space-y-6 lg:pr-4">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-400 shadow-sm">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Restricted Operational Network</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-tight">
                                Superlines <span className="text-red-500">Command Center</span>
                            </h1>

                            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
                                Centralized administration, live dual-manifest turnaround monitoring, counter Z-Reading cash remittance, and bus fleet dispatch.
                            </p>
                        </div>

                        {/* Active Personnel Roster & Quick Sign-In */}
                        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-md shadow-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-emerald-400" />
                                        <span>Personnel Directory & Quick Sign In</span>
                                    </h3>
                                    <p className="text-[11px] text-zinc-400">
                                        Click &apos;Enter&apos; to immediately sign in as that role or click &apos;Fill&apos; to populate the login form.
                                    </p>
                                </div>
                                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-bold">
                                    6 Accounts Active
                                </span>
                            </div>

                            {/* Section A: Main Admin */}
                            <div className="space-y-2">
                                <div className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>Headquarters Master Administrator</span>
                                </div>
                                {adminCreds.map((cred) => (
                                    <div key={cred.id} className="rounded-2xl border border-red-900/50 bg-zinc-950/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">{cred.name}</span>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                                                    MASTER ADMIN
                                                </span>
                                            </div>
                                            <p className="text-xs font-mono text-zinc-400">{cred.email} • {cred.password}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCopyFill(cred)}
                                                className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs h-8 px-2.5"
                                            >
                                                {copiedEmail === cred.email ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                                <span className="ml-1">{copiedEmail === cred.email ? "Filled" : "Fill"}</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleQuickLogin(cred)}
                                                disabled={isLoading}
                                                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs h-8 px-3 shadow-md shadow-red-600/30"
                                            >
                                                {quickLoggingInId === cred.id ? "Entering..." : "Enter ➔"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Section B: 3 Counter Tellers */}
                            <div className="space-y-2 pt-1">
                                <div className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                    <Ticket className="h-3.5 w-3.5" />
                                    <span>Station Tellers (Cubao • Daet • PITX)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {tellerCreds.map((cred) => (
                                        <div key={cred.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 space-y-2 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                                                        {cred.terminal?.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyFill(cred)}
                                                        className="text-[10px] text-zinc-400 hover:text-white"
                                                    >
                                                        {copiedEmail === cred.email ? "✓" : "Fill"}
                                                    </button>
                                                </div>
                                                <p className="text-xs font-bold text-white mt-1.5 truncate">{cred.name.split(" ")[0]} {cred.name.split(" ")[1]}</p>
                                                <p className="text-[10px] font-mono text-zinc-400 truncate">{cred.email}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleQuickLogin(cred)}
                                                disabled={isLoading}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-7 shadow-sm"
                                            >
                                                {quickLoggingInId === cred.id ? "Entering..." : "Enter Portal"}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section C: 2 Bus Conductors */}
                            <div className="space-y-2 pt-1">
                                <div className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                    <Bus className="h-3.5 w-3.5" />
                                    <span>Bus Conductors (SL-401 & SL-212)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {conductorCreds.map((cred) => (
                                        <div key={cred.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 space-y-2 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                                                        {cred.busAssignment?.split(" ")[0]}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyFill(cred)}
                                                        className="text-[10px] text-zinc-400 hover:text-white"
                                                    >
                                                        {copiedEmail === cred.email ? "✓" : "Fill"}
                                                    </button>
                                                </div>
                                                <p className="text-xs font-bold text-white mt-1.5 truncate">{cred.name}</p>
                                                <p className="text-[10px] text-zinc-400 truncate font-mono">{cred.routeAssignment} ({cred.email})</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleQuickLogin(cred)}
                                                disabled={isLoading}
                                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-7 shadow-sm"
                                            >
                                                {quickLoggingInId === cred.id ? "Entering..." : "Open Scanner"}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Maximized Staff Security Gateway Form */}
                    <div className="lg:col-span-5 w-full">
                        <Card className="w-full bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-md text-zinc-100 rounded-3xl overflow-hidden">
                            <CardHeader className="space-y-1 pb-4 p-6 sm:p-8 border-b border-zinc-800/60 bg-zinc-950/40">
                                <CardTitle className="text-2xl font-black flex items-center gap-2.5 text-white">
                                    <Lock className="h-6 w-6 text-red-500" />
                                    <span>Staff Security Gateway</span>
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-xs leading-relaxed">
                                    Please provide your official Superlines personnel credentials to gain access to dispatch, cashier, or admin tools.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 p-6 sm:p-8">
                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    {error && (
                                        <div className="rounded-xl bg-red-950/70 border border-red-800 p-3.5 text-xs text-red-200 flex items-start gap-2.5 shadow-inner">
                                            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{error}</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="adminEmail" className="text-xs text-zinc-300 font-semibold">
                                            Staff Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="adminEmail"
                                                type="email"
                                                placeholder="admin@superlines.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 bg-zinc-950 border-zinc-800 text-white text-sm h-11 placeholder:text-zinc-600 focus:border-red-500 rounded-xl font-mono"
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

                                    <Button
                                        type="submit"
                                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-12 shadow-lg shadow-red-600/30 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Verifying Authorization..." : (
                                            <>
                                                <span>Authorize & Enter Portal</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>

                                {/* Security Warning Notice */}
                                <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4 text-xs text-zinc-400 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                                        <AlertOctagon className="h-4 w-4 shrink-0" />
                                        <span>Restricted Operational System</span>
                                    </div>
                                    <p className="leading-relaxed text-[11px] text-zinc-400">
                                        Passengers and unauthorized personnel are strictly forbidden from accessing this portal. All session activities and counter transactions are logged and audited.
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
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="w-full border-t border-zinc-800/80 py-4 bg-zinc-950/80 text-center text-xs text-zinc-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© 2026 Superlines Transportation Co. Inc. Internal Operational System.</p>
                    <p className="font-mono text-[11px] text-zinc-600">Secure Dispatch & Counter Management</p>
                </div>
            </footer>
        </div>
    );
}
