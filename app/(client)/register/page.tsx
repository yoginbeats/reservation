"use client";

import { useState } from "react";
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
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Ticket, Check, Calendar, Phone, MapPin, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
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
    const router = useRouter();
    const supabase = createClient();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [id]: value };
            // Auto calculate age if birthdate changes
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

    const handleSubmit = async (e: React.FormEvent) => {
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

        setIsLoading(true);

        try {
            const fullName = `${formData.firstName.trim()} ${formData.middleName.trim() ? formData.middleName.trim() + " " : ""}${formData.lastName.trim()}`;
            const parsedAge = formData.age ? parseInt(formData.age, 10) : null;

            const { error: signUpError, data } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/reservations`,
                    data: {
                        first_name: formData.firstName.trim(),
                        middle_name: formData.middleName.trim(),
                        last_name: formData.lastName.trim(),
                        full_name: fullName,
                        birthdate: formData.birthdate,
                        age: parsedAge,
                        phone_number: formData.phoneNumber.trim(),
                        address: formData.address.trim(),
                        profile_completed: true,
                        role: 'PASSENGER'
                    }
                }
            });

            if (signUpError) {
                if (signUpError.message?.toLowerCase().includes('rate limit')) {
                    setError("Supabase email rate limit reached. Please wait a few minutes or check your inbox if you already tried registering.");
                } else if (signUpError.message?.toLowerCase().includes('already registered')) {
                    setError("This email address is already registered. Please go to the Login page to sign in.");
                } else {
                    setError(signUpError.message);
                }
                return;
            }

            // Safely attempt DB profile & role insert if session is active
            if (data.user) {
                try {
                    await supabase.from('profiles').upsert({
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
                        profile_completed: true,
                        updated_at: new Date().toISOString()
                    });
                    await supabase.from('user_roles').upsert({ user_id: data.user.id, role: 'PASSENGER' });
                } catch (dbErr) {
                    console.warn("Profile database sync warning:", dbErr);
                }

                // Send welcome email notification
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
                } catch (mailErr) {
                    console.warn("Welcome email trigger warning:", mailErr);
                }
            }

            // If session exists immediately (email confirmation disabled)
            if (data.session) {
                router.refresh();
                router.push("/dashboard");
            } else {
                // Email confirmation required by Supabase Auth
                setSuccessMessage("Account created successfully! A confirmation email has been sent. You can now log in using your Email & Password or Google.");
            }

        } catch (err: any) {
            console.error("Registration error:", err);
            const errMsg = err?.message || String(err);
            if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch')) {
                setError("Unable to connect to Supabase backend server. Please verify your internet connection or Supabase settings.");
            } else {
                setError(errMsg || "An unexpected error occurred during registration.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                },
            });
            if (error) {
                if (error.message?.toLowerCase().includes('provider') || error.message?.toLowerCase().includes('disabled')) {
                    setError("Google Sign In provider is not enabled in your Supabase project. Please enable Google in Supabase Dashboard > Authentication > Providers > Google.");
                } else {
                    setError(error.message);
                }
                setIsLoading(false);
            }
        } catch (err: any) {
            console.error("Google Auth Error:", err);
            setError(err?.message || "Failed to start Google sign in.");
            setIsLoading(false);
        }
    };

    const { strength, label, color } = passwordStrength();

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-full max-w-xl">
                {/* Logo/Branding */}
                <div className="mb-6 text-center">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={56}
                            height={44}
                            className="h-11 sm:h-12 w-auto object-contain drop-shadow transition-transform group-hover:scale-105"
                            priority
                        />
                        <span className="text-2xl font-black uppercase tracking-tight text-red-600 transition-colors group-hover:text-red-700">
                            Superlines
                        </span>
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Official Passenger Account Registration
                    </p>
                </div>

                <Card className="border-2 shadow-xl">
                    <CardHeader className="space-y-1 pb-4">
                        <div className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-red-600" />
                            <CardTitle className="text-xl font-bold">Create Passenger Account</CardTitle>
                        </div>
                        <CardDescription>
                            Sign up with Google or fill out your passenger information to book tickets online
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Google One-Click Registration Button */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 border-2 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
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

                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 space-y-2">
                                <p className="font-bold flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Account Created Successfully!
                                </p>
                                <p>{successMessage}</p>
                                <div className="pt-2">
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href="/login">Go to Login</Link>
                                    </Button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="birthdate"
                                            type="date"
                                            className="pl-9"
                                            value={formData.birthdate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        placeholder="Calculated automatically"
                                        value={formData.age}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Contact & Email */}
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
                                    <Label htmlFor="email">Email Address *</Label>
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

                            {/* Complete Address */}
                            <div className="space-y-1.5">
                                <Label htmlFor="address">Complete Address (Street, Barangay, City, Province) *</Label>
                                <div className="relative">
                                    <Textarea
                                        id="address"
                                        rows={2}
                                        placeholder="e.g. 123 Rizal St., Brgy. Central, Daet, Camarines Norte"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
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
                                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold"
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating Your Account..." : "Create Passenger Account"}
                            </Button>
                        </form>

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
