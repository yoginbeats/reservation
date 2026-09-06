"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Ticket, Phone, MessageSquare } from "lucide-react";
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
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                return;
            }

            router.refresh();
            router.push("/");
        } catch (err: any) {
            console.error("Email Login Error:", err);
            const errMsg = err?.message || String(err);
            if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
                setError("Unable to connect to Supabase backend server. Please verify your Supabase project is active and unpaused in your Supabase Dashboard, or update NEXT_PUBLIC_SUPABASE_URL in .env.local.");
            } else {
                setError(errMsg || "An unexpected error occurred during login.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // E.164 formatting helper for Philippines numbers
            let formattedPhone = phone.trim();
            if (formattedPhone.startsWith('09')) {
                formattedPhone = '+63' + formattedPhone.slice(1);
            } else if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+' + formattedPhone;
            }

            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: formattedPhone,
            });

            if (otpError) {
                if (otpError.message?.toLowerCase().includes('provider') || otpError.message?.toLowerCase().includes('disabled') || otpError.message?.toLowerCase().includes('fetch')) {
                    setError("SMS Phone Auth provider is not enabled in your Supabase project. Please sign in using Email & Password or enable Phone Provider in Supabase Dashboard.");
                } else {
                    setError(otpError.message);
                }
                return;
            }

            setLoginStep("otp-input");
        } catch (err: any) {
            console.error("Phone OTP Login Error:", err);
            const errMsg = err?.message || String(err);
            if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
                setError("SMS Phone Auth is not enabled in your Supabase project (or network request failed). Please sign in using Email & Password or enable Phone Provider in Supabase Dashboard.");
            } else {
                setError(errMsg || "Failed to send SMS OTP. Please check phone provider settings in Supabase.");
            }
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
                type: 'sms',
            });

            if (error) {
                setError(error.message);
                return;
            }

            router.refresh();
            router.push("/");
        } catch (err) {
            setError("Failed to verify OTP.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                        <Ticket className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">TicketSys</h1>
                    <p className="text-sm text-muted-foreground">Reservation & Ticketing System</p>
                </div>

                <Card className="border-0 shadow-xl">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">Welcome back</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="email" onValueChange={(v) => setAuthMethod(v as "email" | "phone")}>
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="email">Email</TabsTrigger>
                                <TabsTrigger value="phone">SMS / Phone</TabsTrigger>
                            </TabsList>

                            {/* Email Login */}
                            <TabsContent value="email">
                                <form onSubmit={handleEmailLogin} className="space-y-4">
                                    {error && authMethod === 'email' && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm dark:bg-red-900/20 dark:text-red-400">
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="remember" />
                                        <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Remember me for 30 days
                                        </label>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Signing in..." : (
                                            <span className="flex items-center gap-2">
                                                Sign In <ArrowRightIcon className="h-4 w-4" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Phone Login */}
                            <TabsContent value="phone">
                                <form onSubmit={loginStep === 'phone-input' ? handleSendOtp : handleVerifyOtp} className="space-y-4">
                                    {error && authMethod === 'phone' && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm dark:bg-red-900/20 dark:text-red-400">
                                            {error}
                                        </div>
                                    )}

                                    {loginStep === 'phone-input' ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="+1234567890"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Enter number with country code (e.g., +1 for US).
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="otp">Enter Verification Code</Label>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="otp"
                                                    type="text"
                                                    placeholder="123456"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="pl-10 tracking-widest"
                                                    required
                                                />
                                            </div>
                                            <Button
                                                variant="link"
                                                type="button"
                                                onClick={() => setLoginStep("phone-input")}
                                                className="px-0 text-xs"
                                            >
                                                Wrong number? Go back
                                            </Button>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Processing..." : (
                                            loginStep === 'phone-input' ? "Send Code" : "Verify & Login"
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        <Separator className="my-4" />

                        <div className="grid gap-2">
                            <Button variant="outline" type="button" className="w-full">
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </Button>
                        </div>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">Don&apos;t have an account? </span>
                            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                                Create one
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ArrowRightIcon(props: React.ComponentProps<'svg'>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
