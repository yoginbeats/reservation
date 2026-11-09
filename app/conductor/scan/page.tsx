"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, Camera, RefreshCw, User, Bus, Check, Upload, X, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ConductorQrScanPage() {
    const searchParams = useSearchParams();
    const tripIdFilter = searchParams?.get("trip_id");

    const [manualToken, setManualToken] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraStarting, setCameraStarting] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [idInspected, setIdInspected] = useState(false);

    // Verification Result State
    const [scanResult, setScanResult] = useState<{
        status: "VALID" | "ALREADY_USED" | "CANCELLED" | "NOT_FOUND" | "PAYMENT_UNPAID" | "WRONG_TRIP";
        message: string;
        ticket?: any;
    } | null>(null);

    const qrScannerRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Toggle Camera Access
    useEffect(() => {
        if (cameraActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [cameraActive]);

    const startCamera = async () => {
        setCameraStarting(true);
        setCameraError(null);

        try {
            if (typeof window === "undefined") return;

            const { Html5Qrcode } = await import("html5-qrcode");

            // Wait for #qr-reader element in DOM
            let attempts = 0;
            while (!document.getElementById("qr-reader") && attempts < 15) {
                await new Promise((r) => setTimeout(r, 100));
                attempts++;
            }

            if (!document.getElementById("qr-reader")) {
                throw new Error("Scanner container element not found.");
            }

            // Cleanup any existing instance
            if (qrScannerRef.current) {
                try {
                    if (qrScannerRef.current.isScanning) {
                        await qrScannerRef.current.stop();
                    }
                    qrScannerRef.current.clear();
                } catch {}
            }

            const scanner = new Html5Qrcode("qr-reader");
            qrScannerRef.current = scanner;

            const onScanSuccess = (decodedText: string) => {
                if (decodedText) {
                    const cleanText = decodedText.trim();
                    setManualToken(cleanText);
                    handleLookupTicket(cleanText);
                    setCameraActive(false);
                }
            };

            const config = {
                fps: 15,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            // 1. Detect all available camera devices
            let cameras: any[] = [];
            try {
                cameras = await Html5Qrcode.getCameras();
            } catch (camListErr) {
                console.warn("Could not pre-enumerate cameras:", camListErr);
            }

            if (cameras && cameras.length > 0) {
                // Prefer rear / back camera (best for mobile conductors), fallback to primary camera (laptop / webcam)
                const rearCamera = cameras.find((c: any) =>
                    /back|rear|environment/i.test(c.label || "")
                );
                const chosenCameraId = rearCamera ? rearCamera.id : cameras[0].id;
                await scanner.start(chosenCameraId, config, onScanSuccess, () => {});
            } else {
                // 2. Fallback to facingMode constraints with exactly 1 valid key
                try {
                    await scanner.start(
                        { facingMode: "environment" },
                        config,
                        onScanSuccess,
                        () => {}
                    );
                } catch (backErr) {
                    console.warn("Environment facingMode failed, falling back to user facingMode:", backErr);
                    await scanner.start(
                        { facingMode: "user" },
                        config,
                        onScanSuccess,
                        () => {}
                    );
                }
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            const msg = err?.message || err?.toString() || "Camera device unavailable";
            if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
                setCameraError("Camera access was blocked by the browser. Please allow camera permissions in your browser URL bar / site settings.");
            } else if (msg.includes("NotFoundError") || msg.includes("DevicesNotFoundError")) {
                setCameraError("No camera hardware detected on this device.");
            } else {
                setCameraError(`Could not start camera: ${msg}. You can upload a photo of the QR ticket or type the token below.`);
            }
            setCameraActive(false);
        } finally {
            setCameraStarting(false);
        }
    };

    const stopCamera = async () => {
        try {
            if (qrScannerRef.current) {
                if (qrScannerRef.current.isScanning) {
                    await qrScannerRef.current.stop();
                }
                qrScannerRef.current.clear();
                qrScannerRef.current = null;
            }
        } catch (e) {
            console.warn("Camera stop error:", e);
        }
        setCameraStarting(false);
    };

    const handleFileUploadScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setVerifying(true);
        try {
            const { Html5Qrcode } = await import("html5-qrcode");
            let tempEl = document.getElementById("qr-file-scan-temp");
            if (!tempEl) {
                tempEl = document.createElement("div");
                tempEl.id = "qr-file-scan-temp";
                tempEl.style.display = "none";
                document.body.appendChild(tempEl);
            }
            const fileScanner = new Html5Qrcode("qr-file-scan-temp");
            const decodedText = await fileScanner.scanFile(file, true);
            fileScanner.clear();

            if (decodedText) {
                const clean = decodedText.trim();
                setManualToken(clean);
                handleLookupTicket(clean);
            }
        } catch (err) {
            console.warn("File QR scan error:", err);
            alert("Could not detect a clear QR code in that image. Please try taking a clearer photo or enter the ticket token manually.");
        } finally {
            setVerifying(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleLookupTicket = async (tokenToSearch: string) => {
        const cleanToken = tokenToSearch.trim().toUpperCase();
        if (!cleanToken) return;

        setVerifying(true);
        setScanResult(null);
        setIdInspected(false);

        try {
            // Call resilient conductor ticket lookup endpoint
            const res = await fetch(`/api/conductor/tickets?token=${encodeURIComponent(cleanToken)}`);
            const data = await res.json();

            if (!res.ok || !data.ticket) {
                setScanResult({
                    status: "NOT_FOUND",
                    message: `✕ TICKET INVALID: Ticket token "${cleanToken}" not found in system or manifest.`,
                });
                return;
            }

            const ticket = data.ticket;

            // 1. Check if Ticket Already Used
            if (ticket.ticket_status === 'USED') {
                setScanResult({
                    status: "ALREADY_USED",
                    message: "✕ TICKET ALREADY USED: This ticket was already verified for boarding.",
                    ticket,
                });
                return;
            }

            // 2. Check if Cancelled
            if (ticket.ticket_status === 'CANCELLED' || ticket.booking_status === 'CANCELLED') {
                setScanResult({
                    status: "CANCELLED",
                    message: "✕ TICKET CANCELLED: This reservation has been cancelled.",
                    ticket,
                });
                return;
            }

            // 3. Check Payment Status
            if (ticket.payment_status && ticket.payment_status !== 'PAID') {
                setScanResult({
                    status: "PAYMENT_UNPAID",
                    message: `✕ PAYMENT NOT CONFIRMED: Status is ${ticket.payment_status}.`,
                    ticket,
                });
                return;
            }

            // 4. Check Trip ID Filter Match (if filter passed)
            if (tripIdFilter && ticket.trip?.id && ticket.trip.id !== tripIdFilter) {
                setScanResult({
                    status: "WRONG_TRIP",
                    message: "✕ WRONG TRIP: This ticket is for a different scheduled trip.",
                    ticket,
                });
                return;
            }

            // Valid Ticket Result!
            setScanResult({
                status: "VALID",
                message: "✓ TICKET VALID: Verified and ready for boarding.",
                ticket,
            });
        } catch (err: any) {
            console.error("QR Scan Error:", err);
            setScanResult({
                status: "NOT_FOUND",
                message: "✕ Error retrieving ticket status. Please check network connection.",
            });
        } finally {
            setVerifying(false);
        }
    };

    // Confirm Boarding Action - Triggered manually by conductor
    const handleConfirmBoarding = async () => {
        if (!scanResult?.ticket) return;

        setConfirming(true);

        try {
            const res = await fetch('/api/conductor/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: scanResult.ticket.qr_token,
                    action: 'CONFIRM_BOARDING',
                    inspectedId: idInspected,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to confirm boarding.");
            }

            // Update local state to USED
            setScanResult((prev) => prev ? {
                ...prev,
                status: "ALREADY_USED",
                message: "✓ BOARDING CONFIRMED: Passenger marked as BOARDED (USED).",
                ticket: { ...prev.ticket, ticket_status: 'USED' }
            } : null);
        } catch (err: any) {
            console.error("Boarding confirmation error:", err);
            alert("Failed to confirm boarding: " + err.message);
        } finally {
            setConfirming(false);
        }
    };

    const hasDiscount = Boolean(
        scanResult?.ticket?.is_discounted ||
        scanResult?.ticket?.discount_amount > 0 ||
        (scanResult?.ticket?.discounted_passengers && scanResult.ticket.discounted_passengers.length > 0)
    );

    return (
        <div className="container mx-auto max-w-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <QrCode className="h-7 w-7 text-red-500" />
                        Conductor Boarding QR Scanner
                    </h1>
                    <p className="text-xs text-zinc-400">Scan or enter passenger QR code token to verify boarding and inspect discount IDs.</p>
                </div>
                {tripIdFilter && (
                    <Button variant="outline" size="sm" asChild className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white">
                        <a href={`/conductor/manifest?trip_id=${tripIdFilter}`}>
                            View Trip Manifest
                        </a>
                    </Button>
                )}
            </div>

            {/* Camera / Manual Input Toggle Box */}
            <Card className="border-zinc-800 bg-zinc-950 text-white shadow-xl">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <CardTitle className="text-base font-bold">QR Scanner Device Input</CardTitle>
                        <div className="flex items-center gap-2">
                            {/* Photo / Screenshot Scan Button */}
                            <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xs"
                                disabled={verifying}
                            >
                                <Upload className="mr-1.5 h-3.5 w-3.5" />
                                Scan QR Photo
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUploadScan}
                            />

                            {/* Camera Toggle Button */}
                            <Button
                                size="sm"
                                variant={cameraActive ? "destructive" : "default"}
                                type="button"
                                onClick={() => setCameraActive(!cameraActive)}
                                className={cameraActive ? "" : "bg-red-600 hover:bg-red-700 font-bold text-xs"}
                            >
                                <Camera className="mr-1.5 h-3.5 w-3.5" />
                                {cameraActive ? "Turn Off Camera" : "Open Device Camera"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Camera Error Alert */}
                    {cameraError && (
                        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold text-white">Camera Access Notice</p>
                                <p className="mt-0.5 leading-relaxed">{cameraError}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCameraError(null)}
                                className="text-zinc-400 hover:text-white p-1"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Live Camera Scanner Modal */}
                    {cameraActive && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
                            <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                        <Camera className="h-4 w-4 text-red-500 animate-pulse" />
                                        <span>Live Boarding QR Scanner</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={stopCamera}
                                        className="text-zinc-400 hover:text-white h-8 w-8 p-0 rounded-full"
                                    >
                                        <XCircle className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* QR Reader Canvas / Video Container */}
                                <div className="relative overflow-hidden rounded-2xl bg-black border border-zinc-800 min-h-[300px] flex items-center justify-center">
                                    <div id="qr-reader" className="w-full h-full" />
                                    {cameraStarting && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-300 gap-2">
                                            <RefreshCw className="h-6 w-6 animate-spin text-red-500" />
                                            <span className="text-xs font-semibold">Binubuksan ang device camera...</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-[11px] text-center text-zinc-400">
                                    Itapat ang QR code sa viewfinder para awtomatikong ma-scan ang boarding ticket.
                                </p>

                                <Button
                                    variant="destructive"
                                    className="w-full font-bold text-xs py-2.5 rounded-xl"
                                    onClick={stopCamera}
                                >
                                    Isara ang Camera
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Manual Token Input Fallback */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleLookupTicket(manualToken);
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Enter Ticket Token (e.g. TKT-20261019-XXXXXX)"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm tracking-wide"
                        />
                        <Button type="submit" className="bg-red-600 hover:bg-red-700 font-bold px-6" disabled={verifying}>
                            {verifying ? "Checking..." : "Verify Token"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* VERIFICATION RESULT CARD */}
            {scanResult && (
                <Card className={`border-2 shadow-2xl transition-all ${
                    scanResult.status === 'VALID'
                        ? 'border-emerald-500 bg-emerald-950/30'
                        : scanResult.status === 'ALREADY_USED'
                        ? 'border-yellow-500 bg-yellow-950/30'
                        : 'border-red-500 bg-red-950/30'
                }`}>
                    <CardHeader className="pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            {scanResult.status === 'VALID' ? (
                                <CheckCircle2 className="h-8 w-8 text-emerald-400 flex-shrink-0" />
                            ) : scanResult.status === 'ALREADY_USED' ? (
                                <AlertTriangle className="h-8 w-8 text-yellow-400 flex-shrink-0" />
                            ) : (
                                <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                            )}
                            <div>
                                <CardTitle className={`text-xl font-bold ${
                                    scanResult.status === 'VALID' ? 'text-emerald-400' : scanResult.status === 'ALREADY_USED' ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                    {scanResult.message}
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-xs mt-0.5">
                                    Status Check Timestamp: {new Date().toLocaleTimeString()} • Token: <span className="font-mono text-white font-bold">{scanResult.ticket?.qr_token}</span>
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {scanResult.ticket && (
                        <CardContent className="p-6 space-y-4 text-zinc-200">
                            <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-4">
                                <div>
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Primary Passenger</p>
                                    <p className="text-lg font-bold text-white">{scanResult.ticket.passenger_name}</p>
                                    {scanResult.ticket.passenger_contact && (
                                        <p className="text-xs text-zinc-400 font-mono mt-0.5">📞 {scanResult.ticket.passenger_contact}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                                        {scanResult.ticket.seat_numbers?.length > 1 ? "Seats Assigned" : "Seat Assigned"}
                                    </p>
                                    <p className="font-mono text-3xl font-black text-emerald-400">
                                        {scanResult.ticket.seat_numbers?.length > 1
                                            ? scanResult.ticket.seat_numbers.map((s: number) => `#${s < 10 ? `0${s}` : s}`).join(", ")
                                            : `#${scanResult.ticket.seat_number < 10 ? `0${scanResult.ticket.seat_number}` : scanResult.ticket.seat_number}`}
                                    </p>
                                </div>
                            </div>

                            {/* MANDATORY PHYSICAL DISCOUNT ID INSPECTION CARD */}
                            {hasDiscount && (
                                <div className="rounded-xl border-2 border-purple-500/80 bg-purple-950/40 p-4 space-y-3 shadow-lg">
                                    <div className="flex items-center justify-between border-b border-purple-800/80 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                                                ID
                                            </span>
                                            <span className="font-bold text-purple-200 text-sm">
                                                Physical ID Inspection Required (20% Statutory Discount)
                                            </span>
                                        </div>
                                        <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded font-extrabold uppercase">
                                            Verify Card
                                        </span>
                                    </div>

                                    {/* Beneficiaries List */}
                                    <div className="space-y-2">
                                        {scanResult.ticket.discounted_passengers && scanResult.ticket.discounted_passengers.length > 0 ? (
                                            scanResult.ticket.discounted_passengers.map((p: any, idx: number) => (
                                                <div key={idx} className="bg-zinc-900/80 p-2.5 rounded-lg border border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                                    <div>
                                                        <span className="font-bold text-white">#{idx + 1} {p.name}</span>
                                                        <span className="ml-2 font-semibold text-purple-400">
                                                            ({p.classification === 'SENIOR' ? 'Senior Citizen' : p.classification})
                                                        </span>
                                                    </div>
                                                    <span className="font-mono text-purple-200 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 font-bold">
                                                        ID No: {p.id_number}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-purple-800/60 flex items-center justify-between text-xs">
                                                <span className="font-bold text-white">
                                                    Classification: {scanResult.ticket.passenger_type || "Statutory Discount"}
                                                </span>
                                                {scanResult.ticket.discount_id && (
                                                    <span className="font-mono text-purple-200 bg-purple-950 px-2 py-0.5 rounded border border-purple-800 font-bold">
                                                        ID No: {scanResult.ticket.discount_id}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Mandatory Conductor Checkbox */}
                                    {scanResult.status === 'VALID' && (
                                        <div className="flex items-start gap-2.5 pt-2 border-t border-purple-800/60">
                                            <input
                                                id="inspectCheckbox"
                                                type="checkbox"
                                                checked={idInspected}
                                                onChange={(e) => setIdInspected(e.target.checked)}
                                                className="mt-0.5 h-4 w-4 rounded border-purple-400 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                            />
                                            <label htmlFor="inspectCheckbox" className="text-xs text-purple-200 font-semibold cursor-pointer select-none">
                                                I confirm that I have physically inspected and verified the passenger&apos;s valid ID card matches the name and ID number above.
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-zinc-400">Designated Pick-up Point</p>
                                    <p className="font-extrabold text-amber-300 text-sm mt-0.5 flex items-center gap-1">
                                        📍 {scanResult.ticket.pickup_location || scanResult.ticket.trip?.origin || "Main Terminal"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-zinc-400">Route</p>
                                    <p className="font-bold text-white">
                                        {scanResult.ticket.trip?.origin} ➔ {scanResult.ticket.trip?.destination}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-zinc-400">Bus Assigned</p>
                                    <p className="font-bold text-white">{scanResult.ticket.trip?.bus_number || "Superlines Bus"}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-400">Departure Schedule</p>
                                    <p className="font-bold text-white">
                                        {new Date(scanResult.ticket.trip?.departure_time).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-zinc-400">Payment Status & Amount</p>
                                    <p className="font-bold text-emerald-400">
                                        {scanResult.ticket.payment_status} (₱{scanResult.ticket.total_price}.00)
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    )}

                    {/* CONFIRM BOARDING ACTION BUTTON */}
                    <CardFooter className="bg-zinc-900/50 p-4 border-t border-zinc-800 flex flex-col gap-2">
                        {scanResult.status === 'VALID' ? (
                            <Button
                                size="lg"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg py-6 shadow-lg shadow-emerald-600/30"
                                onClick={handleConfirmBoarding}
                                disabled={confirming || (hasDiscount && !idInspected)}
                            >
                                {confirming ? "Updating Ticket Status..." : (
                                    <span className="flex items-center gap-2">
                                        <Check className="h-6 w-6" />
                                        [ CONFIRM PASSENGER BOARDING ]
                                    </span>
                                )}
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full bg-white text-black hover:bg-zinc-100 hover:text-black font-bold border-zinc-300" onClick={() => setScanResult(null)}>
                                Clear and Scan Next Ticket
                            </Button>
                        )}
                        {hasDiscount && scanResult.status === 'VALID' && !idInspected && (
                            <p className="text-[11px] text-amber-400 text-center font-semibold">
                                ⚠️ Please check the physical ID inspection confirmation above to unlock boarding.
                            </p>
                        )}
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
