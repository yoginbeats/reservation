"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
    ShieldCheck,
    Mail,
    BellRing,
    Smartphone,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Sparkles,
    ArrowRight,
    Lock,
    Eye,
    KeyRound,
    Clock,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

function VerifyOtpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paramEmail = searchParams.get("email") || "";
    const nextUrl = searchParams.get("next") || "/dashboard";

    const [primaryEmail, setPrimaryEmail] = useState(paramEmail);
    const [secondaryEmail, setSecondaryEmail] = useState("");
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Defense Demo Mode States
    const [showDemoDetails, setShowDemoDetails] = useState(true);
    const [activeDemoOtp, setActiveDemoOtp] = useState<string | null>(null);
    const [alertRecipients, setAlertRecipients] = useState<string[]>([]);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // On mount, resolve email from param or Supabase session, then auto-dispatch OTP
    useEffect(() => {
        let isMounted = true;
        const resolveAndSend = async () => {
            let emailToUse = paramEmail;
            if (!emailToUse) {
                try {
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user?.email && isMounted) {
                        emailToUse = user.email;
                        setPrimaryEmail(user.email);
                    }
                } catch (e) {
                    console.warn("Could not retrieve logged in session email:", e);
                }
            }
            if (emailToUse && !activeDemoOtp && isMounted) {
                handleSendSecurityOtp(emailToUse, "");
            }
        };
        resolveAndSend();
        return () => {
            isMounted = false;
        };
    }, [paramEmail]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const interval = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendCooldown]);

    const handleSendSecurityOtp = async (targetPrimary?: string, targetSecondary?: string) => {
        const prim = (targetPrimary || primaryEmail).trim().toLowerCase();
        const sec = (targetSecondary !== undefined ? targetSecondary : secondaryEmail).trim().toLowerCase();

        if (!prim) {
            setError("Primary Google account email is required.");
            return;
        }

        setIsSendingOtp(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await fetch("/api/auth/send-security-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: prim,
                    secondaryEmail: sec || undefined,
                    action: "GOOGLE_SIGNIN",
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to send security code.");
            }

            setActiveDemoOtp(data.otpPreview);
            setAlertRecipients(data.recipients || [prim]);
            setSuccessMsg(data.message || "Security alert and verification code dispatched!");
            setResendCooldown(60); // 60s cooldown

            // Focus on first input
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 200);
        } catch (err: any) {
            setError(err.message || "Could not dispatch security OTP.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleDigitChange = (index: number, val: string) => {
        const clean = val.replace(/\D/g, "");
        const newDigits = [...otpDigits];

        if (clean.length > 1) {
            // Paste action
            const pasted = clean.slice(0, 6).split("");
            pasted.forEach((d, i) => {
                if (i < 6) newDigits[i] = d;
            });
            setOtpDigits(newDigits);
            const nextIdx = Math.min(pasted.length, 5);
            inputRefs.current[nextIdx]?.focus();
            return;
        }

        newDigits[index] = clean;
        setOtpDigits(newDigits);

        if (clean && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otpDigits.join("");
        if (code.length < 6) {
            setError("Please enter the complete 6-digit verification code.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: primaryEmail,
                    otp: code,
                    next: nextUrl,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Verification failed.");
            }

            // Save verified session locally
            if (typeof window !== "undefined") {
                localStorage.setItem("superlines_2fa_verified", "true");
                document.cookie = "superlines_2fa_verified=true; path=/; max-age=86400; SameSite=Lax";
            }

            setSuccessMsg("Identity Verified! Redirecting to Superlines System...");
            setTimeout(() => {
                router.refresh();
                router.push(data.redirectUrl || nextUrl);
            }, 800);
        } catch (err: any) {
            setError(err.message || "Invalid or expired OTP code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoFillDemoOtp = () => {
        if (!activeDemoOtp) return;
        const chars = activeDemoOtp.split("");
        setOtpDigits(chars);
        setError(null);
    };

    return (
        <div
            className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col justify-between relative bg-cover bg-center bg-no-repeat bg-fixed py-8 px-4"
            style={{
                backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.88), rgba(9, 9, 11, 0.94)), url('/scenic_highway_bg.jpg')`,
            }}
        >
            {/* Header */}
            <div className="max-w-xl w-full mx-auto flex items-center justify-between pb-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <Image
                        src="/superlines_emblem_transparent.png"
                        alt="Superlines Logo"
                        width={36}
                        height={28}
                        className="object-contain"
                    />
                    <span className="font-extrabold text-sm tracking-wide text-zinc-200">
                        SUPERLINES TRANSPORTATION
                    </span>
                </Link>
                <span className="text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
                    Security Guard
                </span>
            </div>

            {/* Main 2FA Card */}
            <div className="max-w-xl w-full mx-auto space-y-5">
                <Card className="border-2 border-red-900/40 bg-zinc-900/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-red-900/80 via-red-800/80 to-zinc-900 p-5 text-white flex items-center justify-between border-b border-red-800/40">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-black shadow-md">
                                <KeyRound className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tight leading-tight">
                                    Double Verification (2-Step Security)
                                </h1>
                                <p className="text-xs text-zinc-200 opacity-90">
                                    Google Sign-In Account Protection &amp; Alert Protocol
                                </p>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-5 sm:p-6 space-y-5">
                        {error && (
                            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2 shadow-sm">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {/* Account Verification Info Box */}
                        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 p-4 space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                    Primary Google Account (Used to Sign In)
                                </Label>
                                {primaryEmail ? (
                                    <div className="flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                                        <div className="flex items-center gap-2 truncate">
                                            <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm shrink-0">
                                                G
                                            </div>
                                            <span className="font-mono text-sm font-bold text-zinc-100 truncate">
                                                {primaryEmail}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPrimaryEmail("")}
                                            className="text-[11px] text-zinc-400 hover:text-white h-7 px-2"
                                        >
                                            Change
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="Ilagay ang iyong Gmail (e.g. juan@gmail.com)"
                                            value={primaryEmail}
                                            onChange={(e) => setPrimaryEmail(e.target.value)}
                                            className="bg-zinc-900 border-zinc-700 text-xs h-9 text-zinc-100 placeholder:text-zinc-500"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => handleSendSecurityOtp(primaryEmail)}
                                            disabled={!primaryEmail.trim() || isSendingOtp}
                                            className="h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shrink-0"
                                        >
                                            {isSendingOtp ? "Sending..." : "Send PIN"}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Secondary / Other Google Account Input */}
                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="secondaryInput" className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                        <BellRing className="h-3.5 w-3.5" />
                                        <span>Secondary / Other Google Account (Security Alert Recipient)</span>
                                    </Label>
                                    <span className="text-[10px] text-zinc-400">Optional Backup</span>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        id="secondaryInput"
                                        type="email"
                                        placeholder="Hal. other.account@gmail.com"
                                        value={secondaryEmail}
                                        onChange={(e) => setSecondaryEmail(e.target.value)}
                                        className="bg-zinc-900 border-zinc-700 text-xs h-9 text-zinc-100 placeholder:text-zinc-500"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSendSecurityOtp(primaryEmail, secondaryEmail)}
                                        disabled={isSendingOtp}
                                        className="h-9 text-xs font-bold border-amber-600/40 text-amber-300 hover:bg-amber-950/40 shrink-0"
                                    >
                                        {isSendingOtp ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3.5 w-3.5 mr-1" />}
                                        Alert Both
                                    </Button>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-normal">
                                    🔔 Gaya ng opisyal na Google Security Alert, manonotify ang iyong other Google account na may nag-sign in sa Superlines Reservation System.
                                </p>
                            </div>
                        </div>

                        {/* OTP Input Form */}
                        <form onSubmit={handleVerifySubmit} className="space-y-5">
                            <div className="space-y-2 text-center">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                                    Enter 6-Digit Double Verification Code (OTP)
                                </Label>
                                <div className="flex justify-center gap-2 sm:gap-3 py-2">
                                    {otpDigits.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => {
                                                inputRefs.current[idx] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 border-zinc-700 bg-zinc-950 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all shadow-inner"
                                        />
                                    ))}
                                </div>
                                <p className="text-[11px] text-zinc-400">
                                    Valid for 10 minutes. Check your Google inbox (and spam/updates folder).
                                </p>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isLoading || otpDigits.join("").length < 6}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-6 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Verifying Two-Step Credentials...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-5 w-5" />
                                        Verify Identity &amp; Continue &rarr;
                                    </>
                                )}
                            </Button>

                            {/* Resend Section */}
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800 text-zinc-400">
                                <span>Didn&apos;t receive the code?</span>
                                <button
                                    type="button"
                                    onClick={() => handleSendSecurityOtp()}
                                    disabled={resendCooldown > 0 || isSendingOtp}
                                    className="font-bold text-red-400 hover:text-red-300 disabled:opacity-50 transition"
                                >
                                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Security Code"}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Capstone Defense Demonstration Drawer */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-300 font-bold">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <span>Capstone Defense Live Demonstration Panel</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDemoDetails(!showDemoDetails)}
                            className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1"
                        >
                            {showDemoDetails ? "Hide Inspector" : "Show Inspector"}
                            {showDemoDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    {showDemoDetails && (
                        <div className="space-y-3 pt-2 border-t border-amber-500/20 text-zinc-300">
                            <p className="text-[11px] leading-relaxed text-zinc-400">
                                💡 <strong>Para sa inyong Defense Presentation:</strong> Ipinapakita ng panel na ito ang patunay ng automated alert dispatch. Kahit offline o mabagal ang Wi-Fi sa presentation room, makikita agad ng panel ang nabuong 6-digit OTP at ang mga na-notify na accounts.
                            </p>

                            <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-3 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">Dispatched OTP Code:</span>
                                    <span className="font-mono font-black text-amber-400 text-base tracking-widest">
                                        {activeDemoOtp || "Generating..."}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">Accounts Notified:</span>
                                    <span className="font-bold text-zinc-200">
                                        {alertRecipients.length > 0 ? alertRecipients.join(" & ") : primaryEmail}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">Security Alert Subject:</span>
                                    <span className="text-[11px] text-zinc-300 truncate max-w-[280px]">
                                        🚨 Security Alert: New Google Sign-In for Superlines
                                    </span>
                                </div>
                            </div>

                            {activeDemoOtp && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAutoFillDemoOtp}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs py-2 rounded-lg shadow"
                                >
                                    ⚡ 1-Click Auto-Fill OTP (Live Demo)
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="max-w-xl w-full mx-auto text-center text-xs text-zinc-500 pt-6">
                Superlines Bus Transportation Co., Inc. &bull; Two-Step Identity Security
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center text-xs">Loading Security Gate...</div>}>
            <VerifyOtpContent />
        </Suspense>
    );
}

