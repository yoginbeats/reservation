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
    Phone,
    MessageSquare,
    ShieldAlert,
    ShieldCheck,
    Building2,
    Ticket,
    QrCode,
    Sparkles,
    Check,
    Copy,
    ArrowRight,
    Users,
    MapPin,
    Bus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SYSTEM_CREDENTIALS, SystemCredential } from "@/lib/constants/credentials";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [quickLoggingInId, setQuickLoggingInId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [authMethod, setAuthMethod] = useState<"quick" | "email" | "phone">("quick");
    const [loginStep, setLoginStep] = useState<"phone-input" | "otp-input">("phone-input");

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const executeLogin = async (userEmail: string, userPass: string) => {
        setError(null);
        setIsLoading(true);

        try {
            // 1. Call unified system login API
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail, password: userPass }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || "Authentication failed.");
                setIsLoading(false);
                setQuickLoggingInId(null);
                return;
            }

            // 2. Also attempt Supabase sign-in in background to keep Supabase client tokens in sync if available
            try {
                await supabase.auth.signInWithPassword({
                    email: userEmail,
                    password: userPass,
                });
            } catch {}

            // 3. Redirect to specific role portal
            const target = data.redirectUrl || "/";
            router.refresh();
            router.push(target);
        } catch (err: any) {
            console.error("Login Error:", err);
            setError(err?.message || "An unexpected error occurred during login.");
            setIsLoading(false);
            setQuickLoggingInId(null);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await executeLogin(email, password);
    };

    const handleQuickLogin = async (cred: SystemCredential) => {
        setQuickLoggingInId(cred.id);
        setEmail(cred.email);
        setPassword(cred.password);
        await executeLogin(cred.email, cred.password);
    };

    const handleCopyFill = (cred: SystemCredential) => {
        setEmail(cred.email);
        setPassword(cred.password);
        setAuthMethod("email");
        setCopiedEmail(cred.email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            let formattedPhone = phone.trim();
            if (formattedPhone.startsWith("09")) {
                formattedPhone = "+63" + formattedPhone.slice(1);
            } else if (!formattedPhone.startsWith("+")) {
                formattedPhone = "+" + formattedPhone;
            }

            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: formattedPhone,
            });

            if (otpError) {
                setError(otpError.message);
                return;
            }

            setLoginStep("otp-input");
        } catch (err: any) {
            setError(err?.message || "Failed to send SMS OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: phone,
                token: otp,
                type: "sms",
            });

            if (error) {
                setError(error.message);
                return;
            }

            router.refresh();
            router.push("/dashboard");
        } catch (err: any) {
            setError(err?.message || "Failed to verify OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) {
                setError(error.message);
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err?.message || "Failed to start Google sign in.");
            setIsLoading(false);
        }
    };

    const adminCreds = SYSTEM_CREDENTIALS.filter(c => c.role === "ADMIN");
    const tellerCreds = SYSTEM_CREDENTIALS.filter(c => c.role === "TELLER");
    const conductorCreds = SYSTEM_CREDENTIALS.filter(c => c.role === "CONDUCTOR");

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
            {/* Header Brand */}
            <div className="mb-6 text-center max-w-lg">
                <Link href="/" className="inline-block group">
                    <div className="mx-auto mb-3 flex items-center justify-center">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={72}
                            height={58}
                            className="h-16 w-auto object-contain drop-shadow-lg transition-transform group-hover:scale-105"
                            priority
                        />
                    </div>
                </Link>
                <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-2">
                    <span className="text-red-500">Superlines</span> Portals
                </h1>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mt-1">
                    Centralized Transportation & Ticketing System
                </p>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Auth Form Container */}
                <Card className="lg:col-span-6 bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-sm text-zinc-100">
                    <CardHeader className="space-y-1 pb-3">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <span>Sign In to Your Account</span>
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-xs">
                            Select your portal role or sign in with your email and password
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-zinc-950 p-1 border border-zinc-800">
                                <TabsTrigger value="quick" className="text-xs font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white">
                                    ⚡ One-Click
                                </TabsTrigger>
                                <TabsTrigger value="email" className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                    Email / Pass
                                </TabsTrigger>
                                <TabsTrigger value="phone" className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                    SMS Phone
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: ONE-CLICK QUICK SWITCHER (Mobile / Inline) */}
                            <TabsContent value="quick" className="mt-4 space-y-3">
                                <div className="rounded-xl bg-blue-950/40 border border-blue-800/40 p-3 text-xs text-blue-200 flex items-start gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Direct Access Mode:</strong> Click any of the 6 official staff accounts below or in the side panel to sign in and jump directly into that role’s dashboard!
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

                            {/* TAB 2: MANUAL EMAIL & PASSWORD */}
                            <TabsContent value="email" className="mt-4 space-y-4">
                                <form onSubmit={handleEmailLogin} className="space-y-4">
                                    {error && (
                                        <div className="rounded-lg bg-red-950/60 border border-red-800 p-3 text-xs text-red-200 flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs text-zinc-300 font-semibold">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="e.g. admin@superlines.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-9 bg-zinc-950 border-zinc-800 text-white text-xs h-10 placeholder:text-zinc-600 focus:border-red-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-xs text-zinc-300 font-semibold">
                                                Password
                                            </Label>
                                            <Link href="/forgot-password" className="text-[11px] text-red-400 hover:underline">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-9 pr-9 bg-zinc-950 border-zinc-800 text-white text-xs h-10 placeholder:text-zinc-600 focus:border-red-500"
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

                                    <div className="flex items-center space-x-2 pt-1">
                                        <Checkbox id="remember" className="border-zinc-700 data-[state=checked]:bg-red-600" />
                                        <label htmlFor="remember" className="text-xs text-zinc-400 font-medium">
                                            Remember my login on this device
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-10 shadow-lg shadow-red-600/20"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Signing in..." : (
                                            <span className="flex items-center gap-2">
                                                Sign In to Portal <ArrowRight className="h-4 w-4" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* TAB 3: PHONE OTP */}
                            <TabsContent value="phone" className="mt-4 space-y-4">
                                <form onSubmit={loginStep === "phone-input" ? handleSendOtp : handleVerifyOtp} className="space-y-4">
                                    {error && (
                                        <div className="rounded-lg bg-red-950/60 border border-red-800 p-3 text-xs text-red-200">
                                            {error}
                                        </div>
                                    )}

                                    {loginStep === "phone-input" ? (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="phone" className="text-xs text-zinc-300 font-semibold">
                                                Mobile Phone Number
                                            </Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="09171234567 or +639171234567"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="pl-9 bg-zinc-950 border-zinc-800 text-white text-xs h-10"
                                                    required
                                                />
                                            </div>
                                            <p className="text-[11px] text-zinc-500">
                                                We will send a 6-digit one-time PIN via SMS for passenger login.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="otp" className="text-xs text-zinc-300 font-semibold">
                                                Enter 6-Digit SMS Code
                                            </Label>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                                <Input
                                                    id="otp"
                                                    type="text"
                                                    placeholder="123456"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="pl-9 tracking-widest bg-zinc-950 border-zinc-800 text-white font-mono text-sm h-10"
                                                    required
                                                />
                                            </div>
                                            <Button
                                                variant="link"
                                                type="button"
                                                onClick={() => setLoginStep("phone-input")}
                                                className="px-0 text-[11px] text-zinc-400 hover:text-white"
                                            >
                                                Wrong number? Change phone
                                            </Button>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-10"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Verifying..." : loginStep === "phone-input" ? "Send SMS Code" : "Verify & Sign In"}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        <Separator className="bg-zinc-800 my-4" />

                        <div className="grid gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs h-9"
                            >
                                <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Passenger Sign In with Google
                            </Button>
                        </div>

                        <div className="pt-2 text-center text-xs text-zinc-400">
                            <span>Passenger without an account? </span>
                            <Link href="/register" className="font-bold text-red-400 hover:text-red-300 hover:underline">
                                Create an account
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Detailed Credential Directory & Role Showcase */}
                <div className="lg:col-span-6 space-y-4">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-sm text-zinc-200">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                    Active System Credentials
                                </h3>
                                <p className="text-[11px] text-zinc-400">
                                    6 Configured Roles (1 Admin, 3 Tellers, 2 Conductors)
                                </p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Ready for Testing
                            </span>
                        </div>

                        {/* Category 1: Main Admin */}
                        <div className="mt-4 space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                1. Main Admin (Headquarters)
                            </div>
                            {adminCreds.map((cred) => (
                                <div key={cred.id} className="rounded-xl border border-red-900/40 bg-zinc-950/70 p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-bold text-white">{cred.name}</p>
                                            <p className="text-[11px] text-zinc-400">{cred.description}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleQuickLogin(cred)}
                                            disabled={isLoading}
                                            className="bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold h-7 px-2.5"
                                        >
                                            Login as Admin
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                                        <span>User: <strong>{cred.email}</strong></span>
                                        <span className="text-zinc-600">•</span>
                                        <span>Pass: <strong>{cred.password}</strong></span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyFill(cred)}
                                            className="ml-auto text-zinc-400 hover:text-white flex items-center gap-1 text-[10px]"
                                        >
                                            {copiedEmail === cred.email ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                            {copiedEmail === cred.email ? "Copied" : "Fill"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Category 2: 3 Terminal Tellers */}
                        <div className="mt-5 space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                <Ticket className="h-3.5 w-3.5" />
                                2. Terminal Tellers (Cubao, Daet, PITX)
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {tellerCreds.map((cred) => (
                                    <div key={cred.id} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white">{cred.name}</span>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                                        {cred.terminal?.name}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-zinc-400 mt-0.5">{cred.terminal?.location}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleQuickLogin(cred)}
                                                disabled={isLoading}
                                                className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold h-7 px-2.5 shrink-0"
                                            >
                                                Login Teller
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                                            <div className="truncate">
                                                <span>{cred.email}</span>
                                                <span className="text-zinc-600 mx-1.5">•</span>
                                                <span>{cred.password}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyFill(cred)}
                                                className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px] shrink-0 ml-2"
                                            >
                                                {copiedEmail === cred.email ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                                {copiedEmail === cred.email ? "Copied" : "Fill"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category 3: 2 Bus Conductors */}
                        <div className="mt-5 space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                <Bus className="h-3.5 w-3.5" />
                                3. Bus Conductors (SL-401 & SL-212)
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {conductorCreds.map((cred) => (
                                    <div key={cred.id} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white">{cred.name}</span>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                                        {cred.busAssignment?.split(" ")[0]}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-zinc-400 mt-0.5">Route: {cred.routeAssignment} ({cred.busAssignment})</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleQuickLogin(cred)}
                                                disabled={isLoading}
                                                className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold h-7 px-2.5 shrink-0"
                                            >
                                                Login Conductor
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                                            <div className="truncate">
                                                <span>{cred.email}</span>
                                                <span className="text-zinc-600 mx-1.5">•</span>
                                                <span>{cred.password}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyFill(cred)}
                                                className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px] shrink-0 ml-2"
                                            >
                                                {copiedEmail === cred.email ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                                {copiedEmail === cred.email ? "Copied" : "Fill"}
                                            </button>
                                        </div>
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
