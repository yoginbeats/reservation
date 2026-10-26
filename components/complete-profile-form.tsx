"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Calendar, MapPin, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";

interface CompleteProfileFormProps {
    user: any;
    initialProfile?: any;
    nextUrl?: string;
}

export function CompleteProfileForm({
    user,
    initialProfile,
    nextUrl = "/dashboard",
}: CompleteProfileFormProps) {
    const router = useRouter();

    const meta = user?.user_metadata || {};
    const googleGivenName = meta.given_name || meta.first_name || "";
    const googleFamilyName = meta.family_name || meta.last_name || "";
    const metaFullName = meta.full_name || meta.name || "";

    const existingFirst = initialProfile?.first_name || meta.first_name || googleGivenName || (metaFullName ? metaFullName.split(" ")[0] : "");
    const existingMiddle = initialProfile?.middle_name || meta.middle_name || "";
    const existingLast = initialProfile?.last_name || meta.last_name || googleFamilyName || (metaFullName ? metaFullName.split(" ").slice(1).join(" ") : "");
    const existingBirth = initialProfile?.birthdate || meta.birthdate || "";
    const existingAge = initialProfile?.age ? String(initialProfile.age) : meta.age ? String(meta.age) : "";
    const existingPhone = initialProfile?.phone_number || meta.phone_number || user?.phone_number || "";
    const existingAddress = initialProfile?.address || meta.address || "";

    const isExistingProfile = Boolean(
        initialProfile?.profile_completed ||
        meta?.profile_completed ||
        (existingPhone && existingAddress)
    );

    // Form fields
    const [firstName, setFirstName] = useState(existingFirst);
    const [middleName, setMiddleName] = useState(existingMiddle);
    const [lastName, setLastName] = useState(existingLast);
    const [birthdate, setBirthdate] = useState(existingBirth);
    const [age, setAge] = useState<string>(existingAge);
    const [phoneNumber, setPhoneNumber] = useState(existingPhone);
    const [address, setAddress] = useState(existingAddress);

    // Optional password set for Email+Password login
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Submission states
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Calculate age automatically when birthdate changes
    const handleBirthdateChange = (val: string) => {
        setBirthdate(val);
        if (val) {
            const birth = new Date(val);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                calculatedAge--;
            }
            if (calculatedAge >= 0) {
                setAge(String(calculatedAge));
            }
        } else {
            setAge("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!firstName.trim() || !lastName.trim()) {
            setError("First name and Last name are required.");
            return;
        }
        if (!birthdate) {
            setError("Please provide your date of birth.");
            return;
        }
        if (!phoneNumber.trim()) {
            setError("Please provide your phone number or email address (e.g. 09171234567).");
            return;
        }
        if (!address.trim()) {
            setError("Please provide your complete home or travel address for passenger manifests.");
            return;
        }

        // If setting password
        if (password) {
            if (password.length < 6) {
                setError("Password must be at least 6 characters long.");
                return;
            }
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
        }

        setSubmitting(true);

        try {
            const fullName = `${firstName.trim()} ${middleName.trim() ? middleName.trim() + " " : ""}${lastName.trim()}`;
            const parsedAge = age ? parseInt(age, 10) : null;

            // Call server-side profile update API which guarantees database upsert and Auth sync
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    middleName: middleName.trim(),
                    lastName: lastName.trim(),
                    birthdate: birthdate || null,
                    age: parsedAge,
                    phoneNumber: phoneNumber.trim(),
                    address: address.trim(),
                    password: password || undefined,
                }),
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || "Failed to save profile record to database.");
            }

            // Client state update
            if (typeof window !== "undefined") {
                localStorage.setItem(`superlines_first_name_${user.id}`, firstName.trim());
                window.dispatchEvent(
                    new CustomEvent("superlines_profile_updated", {
                        detail: {
                            firstName: firstName.trim(),
                            fullName,
                            phoneNumber: phoneNumber.trim(),
                            address: address.trim(),
                            profile_completed: true,
                        },
                    })
                );
            }

            setSuccess(true);
            setTimeout(() => {
                router.refresh();
                router.push(nextUrl);
            }, 1000);

        } catch (err: any) {
            console.error("Profile complete error:", err);
            setError(err.message || "An unexpected error occurred while saving your profile.");
            setSubmitting(false);
        }
    };

    const userEmail = user?.email || "";

    return (
        <div className="min-h-[calc(100vh-80px)] py-10 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                {/* Back Link */}
                <div className="mb-4">
                    <Link
                        href={nextUrl}
                        className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Passenger Dashboard
                    </Link>
                </div>

                {/* Header Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-red-600 to-blue-700 p-0.5 shadow-lg mb-3">
                        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-zinc-950 p-2">
                            <Image
                                src="/superlines_emblem_transparent.png"
                                alt="Superlines Emblem"
                                width={44}
                                height={36}
                                className="h-8 w-auto object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                        {isExistingProfile ? "Edit Passenger Profile" : "Complete Your Passenger Profile"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        {isExistingProfile
                            ? "Review and update your personal details, contact number, and address for your official passenger account."
                            : "Please provide your full passenger information for ticket verification and bus manifest compliance."}
                    </p>
                </div>

                <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-red-50/60 dark:bg-red-950/20 border-b pb-4">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                            <ShieldCheck className="h-5 w-5" />
                            <span>Official Passenger Verification</span>
                        </div>
                        <CardDescription className="text-xs">
                            Account: <span className="font-semibold text-foreground">{userEmail}</span>. Fill in the required details below to complete your passenger account.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 pt-6">
                            {error && (
                                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200">
                                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                    <span>Profile saved successfully! Redirecting you now...</span>
                                </div>
                            )}

                            {/* Section 1: Full Name */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    1. Personal Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            required
                                            placeholder="Juan"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="middleName">Middle Name</Label>
                                        <Input
                                            id="middleName"
                                            placeholder="Santos"
                                            value={middleName}
                                            onChange={(e) => setMiddleName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            required
                                            placeholder="Dela Cruz"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Age & Birthdate */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="birthdate">Date of Birth *</Label>
                                        <Input
                                            id="birthdate"
                                            type="date"
                                            required
                                            max={new Date().toISOString().split("T")[0]}
                                            value={birthdate}
                                            onChange={(e) => handleBirthdateChange(e.target.value)}
                                            className="h-10 cursor-pointer"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="age">Age (Auto-calculated)</Label>
                                        <Input
                                            id="age"
                                            type="number"
                                            placeholder="e.g. 25"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Contact & Address */}
                            <div className="space-y-4 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        2. Contact & Residential Address
                                    </h3>
                                    {userEmail && phoneNumber !== userEmail && (
                                        <button
                                            type="button"
                                            onClick={() => setPhoneNumber(userEmail)}
                                            className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-md transition-colors"
                                            title="Click to fill with your connected email"
                                        >
                                            Use {userEmail}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phoneNumber">Phone Number or Email Address (Required for SMS & Tickets) *</Label>
                                    <div className="relative">
                                        {phoneNumber.includes("@") ? (
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600 dark:text-red-400 transition-colors" />
                                        ) : (
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                                        )}
                                        <Input
                                            id="phoneNumber"
                                            required
                                            type="text"
                                            autoComplete="tel email"
                                            placeholder="0917 123 4567 or yourname@gmail.com"
                                            className="pl-9"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Provide either a mobile number (for SMS notifications) or an email address (for electronic tickets & trip alerts).
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="address">Complete Home / Travel Address *</Label>
                                    <div className="relative">
                                        <Textarea
                                            id="address"
                                            required
                                            rows={2}
                                            placeholder="House / Unit No., Street, Barangay, City / Municipality, Province"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Password Configuration */}
                            <div className="space-y-4 pt-2 border-t">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        3. Set Email & Password Login (Optional)
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Set a password so you can also log in directly using your email ({userEmail}) without clicking Google.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password">Create Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="At least 6 characters"
                                                className="pl-9 pr-10"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="confirmPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Re-enter password"
                                                className="pl-9"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col sm:flex-row gap-3 border-t bg-zinc-50/50 dark:bg-zinc-900/50 pt-4">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 shadow-md hover:shadow-lg transition-all"
                            >
                                {submitting
                                    ? "Saving Profile Changes..."
                                    : isExistingProfile
                                    ? "Save Changes & Update Account"
                                    : "Save Profile & Finish Setup"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
