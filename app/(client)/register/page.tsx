"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Check, Phone, MessageSquare, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
    const [registerStep, setRegisterStep] = useState<"input" | "otp">("input");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [canResend, setCanResend] = useState(true);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const passwordStrength = () => {
        const { password } = formData;
        if (password.length === 0) return { strength: 0, label: "" };
        if (password.length < 6) return { strength: 1, label: "Weak", color: "bg-red-500" };
        if (password.length < 10) return { strength: 2, label: "Medium", color: "bg-yellow-500" };
        return { strength: 3, label: "Strong", color: "bg-green-500" };
    };

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            setIsLoading(false);
            return;
        }
        if (!acceptTerms) {
            setError("Please accept the terms and conditions.");
            setIsLoading(false);
            return;
        }

        try {
            const { error: signUpError, data } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/reservations`,
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role: 'client'
                    }
                }
            });

            if (signUpError) {
                setError(signUpError.message);
                return;
            }

            if (data.session) {
                router.refresh();
                router.push("/reservations");
            } else {
                alert("Account created! Please check your email to confirm your account.");
                router.push("/login");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendPhoneOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);

        if (!formData.firstName || !formData.lastName) {
            setError("Please enter your name first.");
            return;
        }

        // PH mobile number should be 10 digits (after +63)
        if (phone.length < 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: `+63${phone}`,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        role: 'client'
                    }
                }
            });

            if (error) {
                if (error.message.includes("Unsupported phone provider")) {
                    setError("SMS service not configured. Please set up an SMS provider (like Twilio) in your Supabase Dashboard to support Philippines SIM cards.");
                } else {
                    setError(error.message);
                }
                return;
            }

            setRegisterStep("otp");
            setCountdown(60);
            setCanResend(false);
        } catch (err) {
            setError("Failed to send code.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: `+63${phone}`,
                token: otp,
                type: 'sms',
            });

            if (error) {
                setError(error.message);
                return;
            }

            router.refresh();
            router.push("/reservations");
        } catch (err) {
            setError("Failed to verify code.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Failed to initialize Google login.");
            console.error(err);
        }
    };

    const { strength, label, color } = passwordStrength();

    return (
        <div className="relative flex min-h-screen items-center justify-center px-6 py-12 overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                style={{
                    backgroundImage: 'url("/hero-bg.jpg")',
                }}
            />
            <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo/Branding */}
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl shadow-zinc-200 overflow-hidden border border-zinc-100 dark:shadow-none">
                        { }
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
                    <p className="mt-2 text-sm font-bold uppercase tracking-widest text-zinc-400">Join our premium fleet</p>
                </div>

                <Card className="border-0 shadow-2xl shadow-zinc-200 dark:bg-zinc-900 dark:shadow-none">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                        <CardDescription className="text-base">
                            Enter your details to register for a new account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="email" onValueChange={(v) => setAuthMethod(v as "email" | "phone")}>
                            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">Email</TabsTrigger>
                                <TabsTrigger value="phone" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">SMS / Phone</TabsTrigger>
                            </TabsList>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 italic mb-5">
                                    {error}
                                </div>
                            )}

                            {/* Email Registration */}
                            <TabsContent value="email">
                                <form onSubmit={handleEmailRegister} className="space-y-5">
                                    {/* Name Fields (Same for both) */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-xs font-black uppercase tracking-wider text-zinc-500">First Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                                <Input
                                                    id="firstName"
                                                    placeholder="Eugene"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-xs font-black uppercase tracking-wider text-zinc-500">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Rasco"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className="h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-zinc-500">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@gmail.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-zinc-500">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a strong password"
                                                value={formData.password}
                                                onChange={handleChange}
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
                                        {formData.password && (
                                            <div className="space-y-1 px-1">
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`h-1.5 flex-1 rounded-full ${strength >= level ? color : "bg-zinc-200 dark:bg-zinc-700"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-400">Security Level: {label}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-wider text-zinc-500">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Terms Checkbox */}
                                    <div className="flex items-start space-x-3 pt-2">
                                        <Checkbox
                                            id="terms"
                                            checked={acceptTerms}
                                            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                                            className="rounded-md border-zinc-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-1"
                                        />
                                        <label htmlFor="terms" className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            I agree to the{" "}
                                            <Link href="/terms" className="font-bold text-red-600 hover:underline">
                                                Terms of Service
                                            </Link>{" "}
                                            and{" "}
                                            <Link href="/privacy" className="font-bold text-red-600 hover:underline">
                                                Privacy Policy
                                            </Link>
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95 mt-4"
                                        disabled={isLoading || !acceptTerms}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Creating account...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <UserPlus className="h-5 w-5" />
                                                Create Account
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Phone Registration */}
                            <TabsContent value="phone">
                                <form onSubmit={registerStep === 'input' ? handleSendPhoneOtp : handleVerifyPhoneOtp} className="space-y-5">
                                    {registerStep === 'input' ? (
                                        <>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="firstName" className="text-xs font-black uppercase tracking-wider text-zinc-500">First Name</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                                        <Input
                                                            id="firstName"
                                                            placeholder="Eugene"
                                                            value={formData.firstName}
                                                            onChange={handleChange}
                                                            className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="lastName" className="text-xs font-black uppercase tracking-wider text-zinc-500">Last Name</Label>
                                                    <Input
                                                        id="lastName"
                                                        placeholder="Rasco"
                                                        value={formData.lastName}
                                                        onChange={handleChange}
                                                        className="h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-zinc-500">Phone Number (Philippines)</Label>
                                                <div className="flex gap-2">
                                                    <div className="flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 px-4 text-sm font-bold text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
                                                        +63
                                                    </div>
                                                    <div className="relative flex-1">
                                                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                                        <Input
                                                            id="phone"
                                                            type="tel"
                                                            placeholder="912 345 6789"
                                                            value={phone}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                setPhone(val);
                                                            }}
                                                            className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                                    Enter your 10-digit mobile number (e.g., 9123456789).
                                                </p>
                                            </div>

                                            {/* Terms Checkbox */}
                                            <div className="flex items-start space-x-3 pt-2">
                                                <Checkbox
                                                    id="terms-phone"
                                                    checked={acceptTerms}
                                                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                                                    className="rounded-md border-zinc-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 mt-1"
                                                />
                                                <label htmlFor="terms-phone" className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
                                                    I agree to the{" "}
                                                    <Link href="/terms" className="font-bold text-red-600 hover:underline">
                                                        Terms of Service
                                                    </Link>
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
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
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Button
                                                    variant="link"
                                                    type="button"
                                                    onClick={() => setRegisterStep("input")}
                                                    className="px-0 h-auto text-xs font-bold text-zinc-500"
                                                >
                                                    Change details? Go back
                                                </Button>

                                                {canResend ? (
                                                    <Button
                                                        variant="link"
                                                        type="button"
                                                        onClick={() => handleSendPhoneOtp()}
                                                        className="px-0 h-auto text-xs font-bold text-red-600"
                                                    >
                                                        Resend Code
                                                    </Button>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                                        Resend in {countdown}s
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-12 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95 mt-4"
                                        disabled={isLoading || (registerStep === 'input' && !acceptTerms)}
                                    >
                                        {isLoading ? "Processing..." : (
                                            registerStep === 'input' ? (
                                                <span className="flex items-center gap-2">
                                                    Send Verification Code <ArrowRight className="h-5 w-5" />
                                                </span>
                                            ) : "Verify & Create Account"
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

                            {/* Social Login Placeholder */}
                            <div className="grid gap-3">
                                <Button 
                                    variant="outline" 
                                    type="button" 
                                    onClick={handleGoogleLogin}
                                    className="w-full h-12 rounded-xl border-zinc-200 font-bold hover:bg-zinc-50 active:scale-95"
                                >
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

                        {/* Login Link */}
                        <div className="mt-10 text-center text-sm">
                            <span className="text-zinc-500 font-medium">Already have an account? </span>
                            <Link href="/login" className="font-black text-red-600 hover:text-red-700 hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
