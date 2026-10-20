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
    ShieldCheck,
    ShieldAlert,
    Lock,
    Mail,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Building2,
    Users,
    Bus,
    Ticket
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SYSTEM_CREDENTIALS, SystemCredential } from "@/lib/constants/credentials";

export default function AdminLoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [quickLoggingInId, setQuickLoggingInId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [authMethod, setAuthMethod] = useState<"credentials" | "directory">("credentials");

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
            // 1. Call system login API
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail, password: userPass }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || "Authentication failed. Invalid staff or admin credentials.");
                setIsLoading(false);
                setQuickLoggingInId(null);
                return;
            }

            // Verify role is staff/admin
            const role = data.role || data.user?.role;
            if (role === "PASSENGER" || role === "CLIENT") {
                setError("This portal is restricted to Superlines Administrators and Personnel. Please use the Passenger Portal.");
                setIsLoading(false);
                setQuickLoggingInId(null);
                return;
            }

            // Sync supabase client session if available
            try {
                await supabase.auth.signInWithPassword({
                    email: userEmail,
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

    const adminCreds = SYSTEM_CREDENTIALS.filter((c) => c.role === "ADMIN");
    const tellerCreds = SYSTEM_CREDENTIALS.filter((c) => c.role === "TELLER");
    const conductorCreds = SYSTEM_CREDENTIALS.filter((c) => c.role === "CONDUCTOR");

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black py-10 px-4 sm:px-6 flex flex-col justify-center items-center text-zinc-100">
            {/* Top Navigation Back to Customer Site */}
            <div className="w-full max-w-4xl mb-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Passenger Website
                </Link>

                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                    Passenger Sign In <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Header Brand */}
            <div className="mb-6 text-center max-w-lg">
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
                    <span>Operations & Administration</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                    Superlines <span className="text-red-500">Admin Portal</span>
                </h1>
                <p className="text-xs text-zinc-400 uppercase tracking-widest mt-1">
                    Centralized Fleet Management, Turnaround Manifests & Ticketing
                </p>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Staff Auth Form */}
                <Card className="lg:col-span-6 bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-md text-zinc-100">
                    <CardHeader className="space-y-1 pb-3">
                        <CardTitle className="text-xl font-black flex items-center gap-2 text-white">
                            <span>Staff Authentication</span>
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-xs">
                            Sign in with your authorized administrator, teller, or conductor credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-zinc-950 p-1 border border-zinc-800">
                                <TabsTrigger value="credentials" className="text-xs font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white">
                                    Email & Password
                                </TabsTrigger>
                                <TabsTrigger value="directory" className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                    ⚡ Quick Staff Switcher
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: EMAIL & PASSWORD */}
                            <TabsContent value="credentials" className="mt-4 space-y-4">
                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    {error && (
                                        <div className="rounded-lg bg-red-950/60 border border-red-800 p-3 text-xs text-red-200 flex items-start gap-2">
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
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
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
                            </TabsContent>

                            {/* TAB 2: ONE-CLICK QUICK ROLES */}
                            <TabsContent value="directory" className="mt-4 space-y-3">
                                <div className="rounded-xl bg-blue-950/40 border border-blue-800/40 p-3 text-xs text-blue-200 flex items-start gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Direct Role Access:</strong> Click any official staff account below to authenticate immediately into that operational portal.
                                    </span>
                                </div>

                                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                    {SYSTEM_CREDENTIALS.map((cred) => (
                                        <div
                                            key={cred.id}
                                            className="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-950 flex items-center justify-between gap-3"
                                        >
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${cred.badgeColor}`}>
                                                        {cred.role}
                                                    </span>
                                                    <span className="text-xs font-bold text-white truncate">
                                                        {cred.name}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5 font-mono">
                                                    <span>{cred.email}</span>
                                                    <span className="text-zinc-600">•</span>
                                                    <span className="text-zinc-500">{cred.password}</span>
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                onClick={() => handleQuickLogin(cred)}
                                                disabled={isLoading}
                                                className="shrink-0 bg-red-600 hover:bg-red-500 text-white font-bold text-xs h-8 px-3 shadow-md shadow-red-600/20"
                                            >
                                                {quickLoggingInId === cred.id ? (
                                                    "Entering..."
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        Enter <ArrowRight className="h-3 w-3" />
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800/80">
                            <span>Looking to book a trip or check your tickets? </span>
                            <Link href="/login" className="font-bold text-red-400 hover:text-red-300 hover:underline">
                                Go to Passenger Sign In
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Roles Directory Overview */}
                <div className="lg:col-span-6 space-y-4">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-md text-zinc-200">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                    Authorized Staff Portals
                                </h3>
                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                    Security clearance required for the following operations
                                </p>
                            </div>
                        </div>

                        {/* Administrator Section */}
                        <div className="mt-4 space-y-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" /> Central Administration ({adminCreds.length})
                            </span>
                            <div className="grid gap-2">
                                {adminCreds.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleQuickLogin(c)}
                                        className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3 hover:border-red-500/50 hover:bg-zinc-950 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">{c.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 font-bold border border-red-800">
                                                    ADMIN
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-mono text-zinc-400 truncate">{c.email}</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-red-400 group-hover:translate-x-0.5 transition-transform">
                                            Enter ➔
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terminal Teller Section */}
                        <div className="mt-4 space-y-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                <Ticket className="h-3.5 w-3.5" /> Terminal Counter Tellers ({tellerCreds.length})
                            </span>
                            <div className="grid gap-2">
                                {tellerCreds.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleQuickLogin(c)}
                                        className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3 hover:border-blue-500/50 hover:bg-zinc-950 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">{c.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800">
                                                    TELLER
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-mono text-zinc-400 truncate">{c.email}</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-blue-400">
                                            Enter ➔
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Conductor Section */}
                        <div className="mt-4 space-y-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                <Bus className="h-3.5 w-3.5" /> Fleet Conductors ({conductorCreds.length})
                            </span>
                            <div className="grid gap-2">
                                {conductorCreds.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleQuickLogin(c)}
                                        className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3 hover:border-amber-500/50 hover:bg-zinc-950 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">{c.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800">
                                                    CONDUCTOR
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-mono text-zinc-400 truncate">{c.email}</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-amber-400">
                                            Enter ➔
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
