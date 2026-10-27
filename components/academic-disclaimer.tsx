"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, GraduationCap, X, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AcademicDisclaimerCard({ className = "" }: { className?: string }) {
    return (
        <div className={`rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/80 via-zinc-900/90 to-amber-950/80 p-5 text-white shadow-xl backdrop-blur-md ${className}`}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <GraduationCap className="h-6 w-6" />
                </div>
                <div className="space-y-4 text-xs sm:text-sm">
                    {/* ENGLISH SECTION */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[11px] tracking-wider uppercase border border-amber-500/30">
                                NOTICE
                            </span>
                            <span className="text-[11px] text-zinc-400 font-semibold">Academic Project Disclaimer</span>
                        </div>
                        <p className="font-semibold text-zinc-100 leading-relaxed">
                            This online reservation system is developed for <strong>academic project purposes only</strong> and is <strong>not an official reservation system</strong> of Superlines Transportation Co., Inc.
                        </p>
                        <p className="text-zinc-300 mt-1 leading-relaxed">
                            For inquiries regarding actual reservations and ticket bookings, please visit the nearest Superlines terminal in your area.
                        </p>
                        <p className="text-amber-300 font-bold mt-1">
                            Thank you for your understanding!
                        </p>
                    </div>

                    <div className="border-t border-amber-500/20 pt-3">
                        {/* FILIPINO SECTION */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[11px] tracking-wider uppercase border border-amber-500/30">
                                PAUNAWA
                            </span>
                            <span className="text-[11px] text-zinc-400 font-semibold">Proyektong Pang-Akademiko</span>
                        </div>
                        <p className="font-semibold text-zinc-100 leading-relaxed">
                            Ang online reservation system na ito ay ginawa para lamang sa layunin ng aming <strong>proyektong pang-akademiko</strong> at <strong>hindi opisyal na sistema</strong> ng Superlines Transportation Co., Inc.
                        </p>
                        <p className="text-zinc-300 mt-1 leading-relaxed">
                            Para sa mga katanungan tungkol sa aktuwal na reserbasyon at pag-book ng tiket, mangyaring direktang pumunta sa pinakamalapit na terminal ng Superlines sa inyong lugar.
                        </p>
                        <p className="text-amber-300 font-bold mt-1">
                            Maraming salamat sa inyong pang-unawa!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AcademicDisclaimerModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Always show notice modal on arrival to ensure no one misses the academic disclaimer
        setIsOpen(true);
    }, []);

    const handleAcknowledge = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl rounded-3xl border-2 border-amber-500/70 bg-zinc-950 p-6 sm:p-8 text-white shadow-2xl shadow-amber-500/20 space-y-6">
                
                {/* Close Button */}
                <button
                    onClick={handleAcknowledge}
                    className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Dismiss"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header Icon & Title */}
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        <GraduationCap className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                            NOTICE / PAUNAWA
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-400">
                            Superlines Academic Capstone Project
                        </p>
                    </div>
                </div>

                {/* Notice Content */}
                <div className="space-y-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 text-xs sm:text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
                    {/* ENGLISH */}
                    <div className="space-y-1.5 border-b border-zinc-800 pb-4">
                        <span className="inline-block px-2.5 py-0.5 rounded font-black text-xs bg-amber-500 text-zinc-950 uppercase tracking-wide">
                            NOTICE
                        </span>
                        <p className="font-semibold text-white">
                            This online reservation system is developed for <strong>academic project purposes only</strong> and is <strong>not an official reservation system</strong> of Superlines Transportation Co., Inc.
                        </p>
                        <p className="text-zinc-300">
                            For inquiries regarding actual reservations and ticket bookings, please visit the nearest Superlines terminal in your area.
                        </p>
                        <p className="font-bold text-amber-400">
                            Thank you for your understanding!
                        </p>
                    </div>

                    {/* FILIPINO */}
                    <div className="space-y-1.5 pt-1">
                        <span className="inline-block px-2.5 py-0.5 rounded font-black text-xs bg-amber-500 text-zinc-950 uppercase tracking-wide">
                            PAUNAWA
                        </span>
                        <p className="font-semibold text-white">
                            Ang online reservation system na ito ay ginawa para lamang sa layunin ng aming <strong>proyektong pang-akademiko</strong> at <strong>hindi opisyal na sistema</strong> ng Superlines Transportation Co., Inc.
                        </p>
                        <p className="text-zinc-300">
                            Para sa mga katanungan tungkol sa aktuwal na reserbasyon at pag-book ng tiket, mangyaring direktang pumunta sa pinakamalapit na terminal ng Superlines sa inyong lugar.
                        </p>
                        <p className="font-bold text-amber-400">
                            Maraming salamat sa inyong pang-unawa!
                        </p>
                    </div>
                </div>

                {/* Button Action */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <Button
                        type="button"
                        onClick={handleAcknowledge}
                        className="w-full sm:flex-1 h-12 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="h-4 w-4" />
                        <span>I Understand / Naintindihan Ko</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
