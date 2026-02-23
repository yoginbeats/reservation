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
        } catch (err) {
            setError("An unexpected error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
            });

            if (error) {
                setError(error.message);
                return;
            }

            setLoginStep("otp-input");
        } catch (err) {
            setError("Failed to send OTP.");
            console.error(err);
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
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
            <div className="w-full max-w-sm">
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl shadow-zinc-200 overflow-hidden border border-zinc-100 dark:shadow-none">
                        <img
                            src="/482809688_1079373070897719_6989867294877356725_n.jpg"
                            alt="Logo"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">
                        <span className="text-red-600">SUPER</span>
                        <span className="text-zinc-900 dark:text-zinc-50">LINES</span>
                    </h1>
                    <p className="mt-2 text-sm font-bold uppercase tracking-widest text-zinc-400">Premium Reservation</p>
                </div>

                <Card className="border-0 shadow-2xl shadow-zinc-200 dark:bg-zinc-900 dark:shadow-none">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                        <CardDescription className="text-base">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="email" onValueChange={(v) => setAuthMethod(v as "email" | "phone")}>
                            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">Email</TabsTrigger>
                                <TabsTrigger value="phone" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">SMS / Phone</TabsTrigger>
                            </TabsList>

                            {/* Email Login */}
                            <TabsContent value="email">
                                <form onSubmit={handleEmailLogin} className="space-y-5">
                                    {error && authMethod === 'email' && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 italic">
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-zinc-500">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-zinc-500">Password</Label>
                                            <Link href="/forgot-password" title="Forgot password" className="text-xs font-bold text-red-600 hover:text-red-700">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-12 pr-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="remember" className="rounded-md border-zinc-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
                                        <label htmlFor="remember" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                            Remember me for 30 days
                                        </label>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Signing in..." : (
                                            <span className="flex items-center gap-2">
                                                Sign In <ArrowRightIcon className="h-5 w-5" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Phone Login */}
                            <TabsContent value="phone">
                                <form onSubmit={loginStep === 'phone-input' ? handleSendOtp : handleVerifyOtp} className="space-y-5">
                                    {error && authMethod === 'phone' && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 italic">
                                            {error}
                                        </div>
                                    )}

                                    {loginStep === 'phone-input' ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-zinc-500">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="+1234567890"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                    required
                                                />
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                                Enter number with country code (e.g., +63 for PH).
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="otp" className="text-xs font-black uppercase tracking-wider text-zinc-500">Verification Code</Label>
                                            <div className="relative">
                                                <MessageSquare className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                                <Input
                                                    id="otp"
                                                    type="text"
                                                    placeholder="123456"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 text-center text-xl font-bold tracking-[1em] focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                    required
                                                />
                                            </div>
                                            <Button
                                                variant="link"
                                                type="button"
                                                onClick={() => setLoginStep("phone-input")}
                                                className="px-0 text-xs font-bold text-red-600"
                                            >
                                                Wrong number? Go back
                                            </Button>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Processing..." : (
                                            loginStep === 'phone-input' ? "Send Code" : "Verify & Login"
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        <div className="relative my-8 text-center">
                            <Separator />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:bg-zinc-900">
                                OR
                            </span>
                        </div>

                        <div className="grid gap-3">
                            <Button variant="outline" type="button" className="w-full h-12 rounded-xl border-zinc-200 font-bold hover:bg-zinc-50 active:scale-95">
                                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
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

                        <div className="mt-10 text-center text-sm">
                            <span className="text-zinc-500 font-medium">Don&apos;t have an account? </span>
                            <Link href="/register" className="font-black text-red-600 hover:text-red-700 hover:underline">
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
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
