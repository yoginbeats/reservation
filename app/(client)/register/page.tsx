"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    UserPlus,
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    Check,
    Calendar,
    Phone,
    MapPin,
    ShieldCheck,
    BellRing,
    KeyRound,
    RefreshCw,
    Sparkles,
    ArrowLeft,
    AlertCircle,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        secondaryEmail: "",
        birthdate: "",
        age: "",
        phoneNumber: "",
        address: "",
        password: "",
        confirmPassword: "",
    });

    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 🔒 OTP & Dual Email Verification Gate States
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpSentSuccess, setOtpSentSuccess] = useState<string | null>(null);
    const [activeDemoOtp, setActiveDemoOtp] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [showDemoInspector, setShowDemoInspector] = useState(true);

    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();
    const supabase = createClient();

    // Resend countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown((p) => p - 1), 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [id]: value };
            if (id === "birthdate" && value) {
                const birth = new Date(value);
                const today = new Date();
                let calcAge = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    calcAge--;
                }
                if (calcAge >= 0) {
                    updated.age = String(calcAge);
                }
            }
            return updated;
        });
    };

    const passwordStrength = () => {
        const { password } = formData;
        if (password.length === 0) return { strength: 0, label: "" };
        if (password.length < 6) return { strength: 1, label: "Weak", color: "bg-red-500" };
        if (password.length < 10) return { strength: 2, label: "Medium", color: "bg-yellow-500" };
        return { strength: 3, label: "Strong", color: "bg-green-500" };
    };

    // Step 1: Validate Registration Form & Dispatch OTP + Secondary Security Alert
    const handleInitiateRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (!formData.birthdate) {
            setError("Please provide your date of birth.");
            return;
        }
        if (!formData.phoneNumber) {
            setError("Please provide your mobile phone number.");
            return;
        }
        if (!formData.address) {
            setError("Please provide your complete address.");
            return;
        }
        if (!acceptTerms) {
            setError("Please accept the terms and conditions.");
            return;
        }

        setIsSendingOtp(true);

        try {
            // Dispatch 6-digit OTP to primary email and security alert to secondary email
            const res = await fetch("/api/auth/send-security-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    secondaryEmail: formData.secondaryEmail.trim() || undefined,
                    action: "GOOGLE_SIGNUP",
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to dispatch verification code.");
            }

            setActiveDemoOtp(data.otpPreview);
            setIsOtpStep(true);
            setResendCooldown(60);
            setOtpSentSuccess(
                formData.secondaryEmail.trim()
                    ? `Verification code sent to ${formData.email}. Security alert dispatched to ${formData.secondaryEmail}.`
                    : `Verification code sent to ${formData.email}.`
            );

            // Focus on first OTP input
            setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 300);
        } catch (err: any) {
            setError(err.message || "Failed to start email verification.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    // Handle OTP Box Input
    const handleDigitChange = (index: number, val: string) => {
        const clean = val.replace(/\D/g, "");
        const newDigits = [...otpDigits];

        if (clean.length > 1) {
            const pasted = clean.slice(0, 6).split("");
            pasted.forEach((d, i) => {
                if (i < 6) newDigits[i] = d;
            });
            setOtpDigits(newDigits);
            const nextIdx = Math.min(pasted.length, 5);
            otpInputRefs.current[nextIdx]?.focus();
            return;
        }

        newDigits[index] = clean;
        setOtpDigits(newDigits);

        if (clean && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    // Step 2: Verify OTP and finalize Supabase Account Registration
    const handleVerifyAndFinalize = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otpDigits.join("");
        if (code.length < 6) {
            setError("Please enter the complete 6-digit OTP code.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Verify OTP with backend
            const verifyRes = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    otp: code,
                    next: "/dashboard",
                }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Invalid OTP code. Please check your inbox or demo inspector.");
            }

            // 2. Complete actual Supabase Registration
            const fullName = `${formData.firstName.trim()} ${formData.middleName.trim() ? formData.middleName.trim() + " " : ""}${formData.lastName.trim()}`;
            const parsedAge = formData.age ? parseInt(formData.age, 10) : null;

            const { error: signUpError, data } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                    data: {
                        first_name: formData.firstName.trim(),
                        middle_name: formData.middleName.trim(),
                        last_name: formData.lastName.trim(),
                        full_name: fullName,
                        birthdate: formData.birthdate,
                        age: parsedAge,
                        phone_number: formData.phoneNumber.trim(),
                        address: formData.address.trim(),
                        secondary_email: formData.secondaryEmail.trim() || null,
                        profile_completed: true,
                        role: "PASSENGER",
                    },
                },
            });

            if (signUpError) {
                if (signUpError.message?.toLowerCase().includes("already registered")) {
                    throw new Error("This email address is already registered. Please proceed to the Login page.");
                }
                throw signUpError;
            }

            // 3. Upsert profiles table
            if (data.user) {
                try {
                    await supabase.from("profiles").upsert({
                        id: data.user.id,
                        email: formData.email.trim(),
                        first_name: formData.firstName.trim(),
                        middle_name: formData.middleName.trim(),
                        last_name: formData.lastName.trim(),
                        full_name: fullName,
                        birthdate: formData.birthdate,
                        age: parsedAge,
                        phone_number: formData.phoneNumber.trim(),
                        address: formData.address.trim(),
                        secondary_email: formData.secondaryEmail.trim() || null,
                        profile_completed: true,
                        updated_at: new Date().toISOString(),
                    });
                    await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "PASSENGER" });
                } catch (dbErr) {
                    console.warn("Profile database sync notice:", dbErr);
                }

                // Send welcome notification
                try {
                    await fetch("/api/auth/send-welcome-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: formData.email.trim(),
                            firstName: formData.firstName.trim(),
                            lastName: formData.lastName.trim(),
                            phoneNumber: formData.phoneNumber.trim(),
                        }),
                    });
                } catch {}
            }

            // Mark session as 2FA verified
            if (typeof window !== "undefined") {
                localStorage.setItem("superlines_2fa_verified", "true");
                document.cookie = "superlines_2fa_verified=true; path=/; max-age=86400; SameSite=Lax";
            }

            setSuccessMessage("Account created & email verified successfully! Redirecting to your dashboard...");
            setTimeout(() => {
                router.refresh();
                router.push("/dashboard");
            }, 1200);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during registration.");
        } finally {
            setIsLoading(false);
        }
    };

    // Google One-Click Registration
    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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

    const handleAutoFillDemoOtp = () => {
        if (!activeDemoOtp) return;
        setOtpDigits(activeDemoOtp.split(""));
        setError(null);
    };

    const { strength, label, color } = passwordStrength();

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-muted/20">
            <div className="w-full max-w-xl">
                <Card className="shadow-lg border-red-500/10">
                    <CardHeader className="text-center space-y-2 pb-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600">
                            {isOtpStep ? <KeyRound className="h-7 w-7" /> : <UserPlus className="h-7 w-7" />}
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {isOtpStep ? "Verify Email with OTP" : "Create Passenger Account"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {isOtpStep
                                ? "Enter the 6-digit code sent to your email to confirm registration."
                                : "Sign up with Google or complete your passenger details with dual-email security."}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 space-y-2">
                                <p className="font-bold flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Registration Successful!
                                </p>
                                <p>{successMessage}</p>
                            </div>
                        )}

                        {/* =========================================================================
                            VIEW A: OTP VERIFICATION GATE (Before Finalizing Sign-Up)
                           ========================================================================= */}
                        {isOtpStep ? (
                            <form onSubmit={handleVerifyAndFinalize} className="space-y-5">
                                {/* Email Confirmation Alert */}
                                <div className="rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between font-bold text-blue-950 dark:text-blue-100">
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                            Primary Email:
                                        </span>
                                        <span className="font-mono text-blue-700 dark:text-blue-300 font-extrabold">
                                            {formData.email}
                                        </span>
                                    </div>

                                    {formData.secondaryEmail.trim() && (
                                        <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200 border-t border-blue-200/60 dark:border-blue-900/60 pt-2">
                                            <span className="flex items-center gap-1.5">
                                                <BellRing className="h-4 w-4 text-amber-600" />
                                                Secondary Alert Email:
                                            </span>
                                            <span className="font-mono text-amber-700 dark:text-amber-300 font-extrabold">
                                                {formData.secondaryEmail}
                                            </span>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-normal pt-1">
                                        🛡️ {otpSentSuccess || "A 6-digit OTP has been dispatched to your email for identity confirmation."}
                                    </p>
                                </div>

                                {/* 6-Digit OTP Box */}
                                <div className="space-y-2 text-center">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Enter 6-Digit One-Time PIN (OTP) *
                                    </Label>
                                    <div className="flex justify-center gap-2 sm:gap-3 py-2">
                                        {otpDigits.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={(el) => {
                                                    otpInputRefs.current[idx] = el;
                                                }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleDigitChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                                className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 border-input bg-background focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all shadow-sm"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Check your email inbox or spam folder. Valid for 10 minutes.
                                    </p>
                                </div>

                                {/* Verify Submit Button */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading || otpDigits.join("").length < 6}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Verifying OTP &amp; Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="h-5 w-5" />
                                            Verify OTP &amp; Finalize Sign-Up &rarr;
                                        </>
                                    )}
                                </Button>

                                {/* Resend & Back Controls */}
                                <div className="flex items-center justify-between text-xs pt-1 border-t text-muted-foreground">
                                    <button
                                        type="button"
                                        onClick={() => setIsOtpStep(false)}
                                        className="text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" /> Back to Edit Form
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleInitiateRegistration}
                                        disabled={resendCooldown > 0 || isSendingOtp}
                                        className="font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                                    >
                                        {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend OTP Code"}
                                    </button>
                                </div>

                                {/* Defense Demo Inspector */}
                                <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold">
                                        <span className="flex items-center gap-1.5">
                                            <Sparkles className="h-4 w-4 text-amber-600" />
                                            Capstone Defense Demo Inspector
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowDemoInspector(!showDemoInspector)}
                                            className="text-amber-700 hover:underline text-[11px]"
                                        >
                                            {showDemoInspector ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    {showDemoInspector && (
                                        <div className="space-y-2 pt-1 border-t border-amber-200 dark:border-amber-800 text-muted-foreground">
                                            <div className="flex justify-between items-center font-mono">
                                                <span>Live Generated OTP:</span>
                                                <span className="font-black text-amber-600 dark:text-amber-400 text-base">
                                                    {activeDemoOtp || "Generating..."}
                                                </span>
                                            </div>
                                            {activeDemoOtp && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleAutoFillDemoOtp}
                                                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs py-1.5 h-8 rounded-lg"
                                                >
                                                    ⚡ 1-Click Auto-Fill OTP (Demo Mode)
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>
                        ) : (
                            /* =========================================================================
                                VIEW B: PASSENGER REGISTRATION FORM (Step 1)
                               ========================================================================= */
                            <div className="space-y-6">
                                {/* Google One-Click Registration Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 border-2 hover:bg-muted/50 font-bold flex items-center justify-center gap-3 transition-all text-sm"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Continue with Google
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground font-semibold">
                                            Or register with passenger details
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleInitiateRegistration} className="space-y-4">
                                    {/* Personal Names */}
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="Juan"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="middleName">Middle Name</Label>
                                            <Input
                                                id="middleName"
                                                placeholder="Santos"
                                                value={formData.middleName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Dela Cruz"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Birthdate & Age */}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="birthdate">Date of Birth *</Label>
                                            <ModernDatePicker
                                                id="birthdate"
                                                value={formData.birthdate}
                                                onChange={(val) => {
                                                    handleChange({ target: { id: "birthdate", value: val } } as any);
                                                }}
                                                placeholder="Select birthdate"
                                                maxDate={new Date().toISOString().split("T")[0]}
                                                showShortcuts={false}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="age">Age</Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                placeholder="Auto-calculated"
                                                value={formData.age}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Contact Numbers & Emails */}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="phoneNumber">Phone Number *</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="phoneNumber"
                                                    type="tel"
                                                    placeholder="0917 123 4567"
                                                    className="pl-9"
                                                    value={formData.phoneNumber}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email">Primary Email (for OTP Verification) *</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="juan@gmail.com"
                                                    className="pl-9"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Secondary / Other Google Account (Security Alert Recipient) */}
                                    <div className="space-y-1.5 rounded-xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/20 p-3">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="secondaryEmail" className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                                <BellRing className="h-3.5 w-3.5 text-amber-600" />
                                                Secondary / Other Google Account (Security Alert Recipient)
                                            </Label>
                                            <span className="text-[10px] text-muted-foreground">Optional</span>
                                        </div>
                                        <Input
                                            id="secondaryEmail"
                                            type="email"
                                            placeholder="e.g. other.account@gmail.com"
                                            value={formData.secondaryEmail}
                                            onChange={handleChange}
                                            className="text-xs bg-background"
                                        />
                                        <p className="text-[10px] text-muted-foreground leading-normal">
                                            🔔 Manonotify ang iyong other Google account kapag may nag-sign up o nag-log in sa iyong Superlines account.
                                        </p>
                                    </div>

                                    {/* Complete Address */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="address">Complete Address (Street, Barangay, City, Province) *</Label>
                                        <Textarea
                                            id="address"
                                            rows={2}
                                            placeholder="e.g. 123 Rizal St., Brgy. Central, Daet, Camarines Norte"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Password Fields */}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="password">Password *</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="At least 6 chars"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className="pl-9 pr-10"
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

                                        <div className="space-y-1.5">
                                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Re-type password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className="pl-9 pr-10"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {formData.password && (
                                        <div className="space-y-1">
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map((level) => (
                                                    <div
                                                        key={level}
                                                        className={`h-1 flex-1 rounded-full ${
                                                            strength >= level ? color : "bg-muted"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Strength: <span className="font-medium">{label}</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Terms and Conditions */}
                                    <div className="flex items-start space-x-2 pt-2">
                                        <Checkbox
                                            id="terms"
                                            checked={acceptTerms}
                                            onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                                        />
                                        <Label htmlFor="terms" className="text-xs font-normal leading-relaxed">
                                            I agree to the{" "}
                                            <Link href="/terms" className="text-red-600 hover:underline">
                                                Terms of Service
                                            </Link>{" "}
                                            and{" "}
                                            <Link href="/privacy" className="text-red-600 hover:underline">
                                                Privacy Policy
                                            </Link>
                                            , and consent to passenger data processing for ticket issuance.
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2"
                                        disabled={isSendingOtp}
                                    >
                                        {isSendingOtp ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Sending Verification Code &amp; Alert...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="h-4 w-4" />
                                                Verify Email &amp; Create Account &rarr;
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">Already have an account? </span>
                            <Link href="/login" className="font-semibold text-red-600 hover:underline">
                                Sign in here
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
