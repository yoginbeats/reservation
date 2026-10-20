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
    ArrowRight,
    User,
    CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
    const [loginStep, setLoginStep] = useState<"phone-input" | "otp-input">("phone-input");

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");

    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Authenticate passenger
            const { data, error: signInErr } = await supabase.auth.signInWithPassword({
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
            let formattedPhone = phone.trim();
            if (formattedPhone.startsWith("09")) {
                formattedPhone = "+63" + formattedPhone.slice(1);
            } else if (!formattedPhone.startsWith("+")) {
                formattedPhone = "+" + formattedPhone;
            }

            const { error: verifyError } = await supabase.auth.verifyOtp({
                phone: formattedPhone,
                token: otp.trim(),
                type: "sms",
            });

            if (verifyError) {
                setError(verifyError.message);
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
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-12 px-4 sm:px-6 flex flex-col justify-center items-center text-zinc-100">
            {/* Header Brand */}
            <div className="mb-6 text-center max-w-md">
                <Link href="/" className="inline-block group">
                    <div className="mx-auto mb-3 flex items-center justify-center">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={72}
                            height={58}
                            className="h-16 w-auto object-contain drop-shadow-xl transition-transform group-hover:scale-105"
                            priority
                        />
                    </div>
                </Link>
                <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-2">
                    <span className="text-red-500">Superlines</span> Passenger Portal
                </h1>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mt-1">
                    Book Trips, View Digital Tickets & Manage Reservations
                </p>
            </div>

            {/* Centered Passenger Login Card */}
            <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-md text-zinc-100">
                <CardHeader className="space-y-1 pb-3 text-center">
                    <CardTitle className="text-xl font-black flex items-center justify-center gap-2 text-white">
                        <User className="h-5 w-5 text-red-500" />
                        <span>Passenger Sign In</span>
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">
                        Enter your account details to access your bookings and profile
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-950 p-1 border border-zinc-800">
                            <TabsTrigger value="email" className="text-xs font-bold data-[state=active]:bg-red-600 data-[state=active]:text-white">
                                Email / Password
                            </TabsTrigger>
                            <TabsTrigger value="phone" className="text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                SMS Mobile Number
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: EMAIL & PASSWORD */}
                        <TabsContent value="email" className="mt-4 space-y-4">
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                {error && (
                                    <div className="rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-200 flex items-start gap-2">
                                        <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="passengerEmail" className="text-xs text-zinc-300 font-semibold">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="passengerEmail"
                                            type="email"
                                            placeholder="passenger@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-9 bg-zinc-950 border-zinc-800 text-white text-xs h-10 placeholder:text-zinc-600 focus:border-red-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="passengerPassword" className="text-xs text-zinc-300 font-semibold">
                                            Password
                                        </Label>
                                        <Link href="/forgot-password" className="text-[11px] text-red-400 hover:underline">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="passengerPassword"
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
                                    <Checkbox id="rememberPassenger" className="border-zinc-700 data-[state=checked]:bg-red-600" />
                                    <label htmlFor="rememberPassenger" className="text-xs text-zinc-400 font-medium">
                                        Remember my login on this device
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-11 shadow-lg shadow-red-600/25 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Signing In..." : (
                                        <>
                                            <span>Sign In</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* TAB 2: PHONE OTP */}
                        <TabsContent value="phone" className="mt-4 space-y-4">
                            <form onSubmit={loginStep === "phone-input" ? handleSendOtp : handleVerifyOtp} className="space-y-4">
                                {error && (
                                    <div className="rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-200">
                                        {error}
                                    </div>
                                )}

                                {loginStep === "phone-input" ? (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phonePassenger" className="text-xs text-zinc-300 font-semibold">
                                            Mobile Phone Number
                                        </Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="phonePassenger"
                                                type="tel"
                                                placeholder="09171234567 or +639171234567"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="pl-9 bg-zinc-950 border-zinc-800 text-white text-xs h-10"
                                                required
                                            />
                                        </div>
                                        <p className="text-[11px] text-zinc-500">
                                            We will send a 6-digit one-time PIN via SMS to your phone.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="otpPassenger" className="text-xs text-zinc-300 font-semibold">
                                            Enter 6-Digit SMS Code
                                        </Label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <Input
                                                id="otpPassenger"
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
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-red-600/25 uppercase tracking-wider text-xs"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Verifying..." : loginStep === "phone-input" ? "Send SMS Code" : "Verify & Sign In"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <Separator className="bg-zinc-800 my-4" />

                    {/* Google OAuth Login */}
                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs h-10 rounded-xl"
                    >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="pt-2 text-center text-xs text-zinc-400">
                        <span>New passenger? </span>
                        <Link href="/register" className="font-bold text-red-400 hover:text-red-300 hover:underline">
                            Create an account
                        </Link>
                    </div>

                    {/* SEPARATION LINK TO ADMIN PORTAL */}
                    <div className="mt-4 pt-4 border-t border-zinc-800 text-center">
                        <Link
                            href="/admin/login"
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors group"
                        >
                            <span>Superlines Personnel or Administrator?</span>
                            <span className="font-bold text-red-400 group-hover:underline flex items-center">
                                Access Admin Portal <ArrowRight className="ml-1 h-3 w-3" />
                            </span>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
