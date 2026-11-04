"use client";

import { useState, useEffect } from "react";
import {
    AlertTriangle,
    GraduationCap,
    CheckCircle2,
    MapPin,
    Building2,
    ArrowRight,
    Bus,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ACADEMIC_NOTICE_STORAGE_KEY = "superlines_academic_notice_accepted_v1";

export function AcademicDisclaimerModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const hasAccepted = localStorage.getItem(ACADEMIC_NOTICE_STORAGE_KEY);
            if (!hasAccepted) {
                // This is the FIRST modal that pops up as soon as they open the website
                setIsOpen(true);
            }
        } catch {
            setIsOpen(true);
        }

        const handleOpen = () => setIsOpen(true);
        window.addEventListener("open-academic-disclaimer", handleOpen);
        return () => window.removeEventListener("open-academic-disclaimer", handleOpen);
    }, []);

    const handleProceed = () => {
        try {
            localStorage.setItem(ACADEMIC_NOTICE_STORAGE_KEY, new Date().toISOString());
        } catch {}
        setIsOpen(false);
        // Notify downstream modals (e.g. Data Privacy Act) that the initial disclaimer is done
        window.dispatchEvent(new CustomEvent("academic-notice-dismissed"));
    };

    if (!isMounted || !isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="academic-notice-title"
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
        >
            <div className="relative w-full max-w-2xl bg-card text-card-foreground rounded-2xl sm:rounded-3xl border-2 border-red-500/70 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-5 sm:p-6 relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                        <GraduationCap className="h-44 w-44" />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                            <GraduationCap className="h-3.5 w-3.5 text-amber-300" />
                            Academic Capstone Project Demo
                        </span>
                        <span className="text-[11px] font-semibold text-rose-100 hidden sm:inline">
                            Not An Official Ticket Booking Service
                        </span>
                    </div>

                    <h2
                        id="academic-notice-title"
                        className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5"
                    >
                        <AlertTriangle className="h-6 w-6 text-amber-300 flex-shrink-0 animate-pulse" />
                        IMPORTANT NOTICE
                    </h2>
                    <p className="text-xs sm:text-sm text-rose-100 mt-1">
                        Please read carefully before proceeding to browse or test this website.
                    </p>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs sm:text-sm leading-relaxed">
                    {/* Primary Academic Disclaimer Card */}
                    <div className="p-4 sm:p-5 rounded-2xl border-2 border-red-500/30 bg-red-50/70 dark:bg-red-950/30 text-red-950 dark:text-red-100 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                                Academic Project Purpose Only
                            </span>
                        </div>
                        <p className="font-extrabold text-foreground text-sm sm:text-base leading-snug">
                            This online reservation system is developed for academic project purposes only and is not an official reservation system of Superlines Transportation Co., Inc.
                        </p>
                        <div className="flex items-start gap-2 pt-1 text-xs sm:text-sm text-muted-foreground border-t border-red-200 dark:border-red-900/60 pt-3">
                            <MapPin className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <span>
                                For inquiries regarding actual reservations and ticket bookings, please visit the nearest <strong>Superlines terminal</strong> in your area.
                            </span>
                        </div>
                        <p className="text-xs font-bold text-foreground">
                            Thank you for your understanding!
                        </p>
                    </div>

                    {/* Official Physical Terminal Locations Reference */}
                    <div className="p-3.5 rounded-xl border bg-muted/30 text-xs text-muted-foreground space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-foreground">
                            <Building2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span>Superlines Official Physical Terminals</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                            • <strong>Cubao Terminal:</strong> EDSA Corner New York St., Cubao, Quezon City<br />
                            • <strong>Daet Terminal:</strong> Superlines Central Terminal, Daet, Camarines Norte<br />
                            • <strong>PITX Terminal:</strong> Parañaque Integrated Terminal Exchange, Parañaque City
                        </p>
                    </div>

                    {/* Safety & Demonstration Guarantee */}
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-200">
                        <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
                        <span>
                            All routes, seat schedules, and digital payment demonstrations on this web portal are strictly simulated for capstone academic evaluation.
                        </span>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 sm:p-5 bg-muted/40 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-muted-foreground text-center sm:text-left">
                        Click the button below to acknowledge this notice and continue to the demo website.
                    </p>

                    <Button
                        type="button"
                        onClick={handleProceed}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-red-600/20 rounded-xl flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
                    >
                        <CheckCircle2 className="h-4 w-4 text-rose-200" />
                        I Understand &amp; Proceed
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
