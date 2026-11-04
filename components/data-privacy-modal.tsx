"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Lock,
    FileText,
    CheckCircle2,
    Info,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    AlertCircle,
    Building2,
    Users,
    QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_STORAGE_KEY = "superlines_data_privacy_consent_v1";
const ACADEMIC_NOTICE_STORAGE_KEY = "superlines_academic_notice_accepted_v1";

export function DataPrivacyModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        const checkAndOpenPrivacy = () => {
            try {
                const hasAcademicNotice = localStorage.getItem(ACADEMIC_NOTICE_STORAGE_KEY);
                const hasPrivacyConsent = localStorage.getItem(CONSENT_STORAGE_KEY);

                // Only show privacy modal if academic notice is already acknowledged,
                // ensuring Academic Notice is always the FIRST modal users see.
                if (hasAcademicNotice && !hasPrivacyConsent) {
                    setIsOpen(true);
                }
            } catch {
                setIsOpen(true);
            }
        };

        checkAndOpenPrivacy();

        // Listen for when Academic Disclaimer modal is dismissed
        const handleAcademicDismissed = () => {
            try {
                const hasPrivacyConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
                if (!hasPrivacyConsent) {
                    setIsOpen(true);
                }
            } catch {
                setIsOpen(true);
            }
        };

        // Global trigger so users can reopen privacy policy anytime via footer or header
        const handleOpenEvent = () => setIsOpen(true);
        window.addEventListener("open-privacy-policy", handleOpenEvent);
        window.addEventListener("academic-notice-dismissed", handleAcademicDismissed);

        return () => {
            window.removeEventListener("open-privacy-policy", handleOpenEvent);
            window.removeEventListener("academic-notice-dismissed", handleAcademicDismissed);
        };
    }, []);

    const handleAccept = () => {
        try {
            localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());
        } catch {}
        setIsOpen(false);
    };

    if (!isMounted || !isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
        >
            <div className="relative w-full max-w-2xl bg-card text-card-foreground rounded-2xl sm:rounded-3xl border-2 border-emerald-500/50 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
                {/* Top Glowing Header Banner */}
                <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 sm:p-6 relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                        <ShieldCheck className="h-44 w-44" />
                    </div>

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                            <ShieldCheck className="h-3 w-3 text-emerald-300" />
                            R.A. 10173 • Republic of the Philippines
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-100 hidden sm:inline">
                            National Privacy Commission Compliant
                        </span>
                    </div>

                    <h2
                        id="privacy-modal-title"
                        className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2"
                    >
                        Data Privacy Notice &amp; Consent
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 leading-relaxed">
                        Your security and privacy are of utmost importance to us. In compliance with the <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, here is full transparency on how we protect, process, and handle your information on this website.
                    </p>
                </div>

                {/* Modal Content Body */}
                <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs sm:text-sm leading-relaxed">
                    {/* Primary Statement Box */}
                    <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                            <Lock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span>STATEMENT OF DATA USAGE (DATA USAGE SCOPE)</span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-foreground leading-normal">
                            All personal information you provide (such as your <strong>Full Name, Contact Number, Email Address, GCash Transaction Reference Number, and ID Verification</strong>) will be collected and processed <strong>exclusively</strong> for your bus ticket booking, travel manifest, and official operations of Superlines Express.
                        </p>
                    </div>

                    {/* How We Use Your Data: 4 Pillars */}
                    <div className="space-y-2">
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            WHERE AND HOW YOUR DATA IS USED:
                        </h3>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                            {/* Pillar 1 */}
                            <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                                    <QrCode className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                    <span>1. Booking &amp; Digital e-Tickets</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Issuance of your official QR boarding pass, real-time seat reservation, and dispatching verified digital e-tickets to your email address.
                                </p>
                            </div>

                            {/* Pillar 2 */}
                            <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                                    <Users className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                                    <span>2. Passenger Safety Manifest</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Compliance with <strong>LTFRB</strong> and terminal dispatch regulations for official passenger travel records and passenger insurance coverage.
                                </p>
                            </div>

                            {/* Pillar 3 */}
                            <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                                    <span>3. GCash &amp; Payment Audit</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Verification of your GCash transaction reference number and receipt screenshot to protect against double-booking and payment discrepancies.
                                </p>
                            </div>

                            {/* Pillar 4 */}
                            <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                                    <Building2 className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                    <span>4. Statutory Discounts (20%)</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Validation and audit of Senior Citizen, PWD, or Student identification cards in accordance with Philippine national laws prior to terminal boarding.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Expandable Privacy Rights Accordion */}
                    <div className="border rounded-xl overflow-hidden bg-muted/10">
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-bold text-foreground hover:bg-muted/30 transition-colors"
                        >
                            <span className="flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5 text-blue-500" />
                                Learn More About Your Rights Under R.A. 10173
                            </span>
                            {showDetails ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>

                        {showDetails && (
                            <div className="px-4 pb-3.5 pt-1 space-y-2 text-[11px] text-muted-foreground border-t bg-muted/20 animate-in fade-in duration-150">
                                <p>As a data subject under Philippine Republic Act No. 10173, you are entitled to the following statutory rights:</p>
                                <ul className="list-disc list-inside space-y-1 pl-1 font-mono text-[11px]">
                                    <li><strong>Right to be Informed:</strong> You have the right to know how your personal data is collected, processed, and safeguarded.</li>
                                    <li><strong>Right to Access:</strong> You can retrieve, inspect, or download your booking records and boarding pass anytime using your GCash Reference Number or passenger credentials.</li>
                                    <li><strong>Right to Rectification:</strong> You may correct inaccurate or outdated booking information through assistance from terminal cashiers or assigned conductors.</li>
                                    <li><strong>Strict Security Guarantee:</strong> Your personal data is never sold, leased, or distributed to third-party commercial marketing entities or external advertisers.</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Academic & Demonstration Guarantee Notice */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
                        <span>
                            This platform operates as a secure demonstration booking system adhering to strict security and data privacy standards to ensure a safe, protected travel booking experience.
                        </span>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 sm:p-5 bg-muted/40 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-muted-foreground text-center sm:text-left">
                        By clicking &quot;I Agree &amp; Proceed&quot;, you consent to the processing of your data for bus ticketing and passenger manifest operations.
                    </p>

                    <Button
                        type="button"
                        onClick={handleAccept}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 rounded-xl flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
                    >
                        <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                        I Agree &amp; Proceed
                    </Button>
                </div>
            </div>
        </div>
    );
}
