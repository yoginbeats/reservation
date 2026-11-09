"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    QrCode,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Camera,
    RefreshCw,
    User,
    Bus,
    Check,
    Upload,
    SwitchCamera,
    ShieldAlert,
    ExternalLink,
    AlertCircle
} from "lucide-react";
import jsQR from "jsqr";

export default function ConductorQrScanPage() {
    const searchParams = useSearchParams();
    const tripIdFilter = searchParams?.get("trip_id");

    const [manualToken, setManualToken] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [idInspected, setIdInspected] = useState(false);
    const [processingPhoto, setProcessingPhoto] = useState(false);

    // Verification Result State
    const [scanResult, setScanResult] = useState<{
        status: "VALID" | "ALREADY_USED" | "CANCELLED" | "NOT_FOUND" | "PAYMENT_UNPAID" | "WRONG_TRIP";
        message: string;
        ticket?: any;
    } | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Audio beep on successful scan
    const playSuccessBeep = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.18);
        } catch {}
    };

    // Extract standard ticket token from QR code content (URL, plain text, or JSON)
    const extractToken = (raw: string): string => {
        const text = raw.trim();
        const tktMatch = text.match(/TKT-[A-Z0-9-]+/i);
        if (tktMatch) return tktMatch[0].toUpperCase();

        try {
            const url = new URL(text);
            const ref = url.searchParams.get("ref") || url.searchParams.get("token") || url.searchParams.get("qr_token") || url.searchParams.get("booking_id");
            if (ref) return ref.toUpperCase();
        } catch {}

        try {
            const parsed = JSON.parse(text);
            if (parsed.qr_token || parsed.token || parsed.booking_id) {
                return (parsed.qr_token || parsed.token || parsed.booking_id).toString().toUpperCase();
            }
        } catch {}

        return text.toUpperCase();
    };

    // Toggle Camera Access
    useEffect(() => {
        if (cameraActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [cameraActive, cameraFacing]);

    const startCamera = async () => {
        setCameraError(null);

        if (typeof window === "undefined") return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError(
                "Camera access is not supported or is blocked because this page is not served over HTTPS/localhost. You can use 'Take Photo / Upload QR' or enter the token manually."
            );
            return;
        }

        try {
            // Strategy 1: Preferred environment (back) camera
            let stream: MediaStream | null = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: cameraFacing },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                });
            } catch {
                // Strategy 2: Fallback to any available video camera (webcam, laptop front camera)
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true");
                await videoRef.current.play().catch((e) => {
                    console.warn("Camera video play notice:", e);
                });

                // Start continuous frame scan loop
                runScanLoop();
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            let msg = "Could not access device camera.";
            if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
                msg = "Camera permission was denied. Please allow camera permissions in your browser address bar.";
            } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
                msg = "No camera hardware detected on this device.";
            } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
                msg = "Camera is currently in use by another application.";
            }
            setCameraError(msg);
        }
    };

    const runScanLoop = () => {
        const scan = () => {
            const video = videoRef.current;
            if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
                const canvas = canvasRef.current || document.createElement("canvas");
                const width = video.videoWidth || 640;
                const height = video.videoHeight || 480;

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });

                if (ctx && width > 0 && height > 0) {
                    ctx.drawImage(video, 0, 0, width, height);
                    const imageData = ctx.getImageData(0, 0, width, height);

                    // Universal jsQR decoder (works on 100% of browsers)
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code && code.data && code.data.trim()) {
                        const token = extractToken(code.data);
                        if (token) {
                            playSuccessBeep();
                            setManualToken(token);
                            handleLookupTicket(token);
                            setCameraActive(false);
                            return;
                        }
                    }
                }
            }
            animationFrameRef.current = requestAnimationFrame(scan);
        };
        animationFrameRef.current = requestAnimationFrame(scan);
    };

    const stopCamera = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const toggleCameraFacing = () => {
        setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
    };

    // Photo Upload / Instant Snap Scanner
    const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessingPhoto(true);
        setCameraError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    setProcessingPhoto(false);
                    return;
                }
                ctx.drawImage(img, 0, 0, img.width, img.height);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                setProcessingPhoto(false);

                if (code && code.data && code.data.trim()) {
                    const token = extractToken(code.data);
                    playSuccessBeep();
                    setManualToken(token);
                    handleLookupTicket(token);
                } else {
                    alert("Could not detect a clear QR Code in the selected image. Please try taking a closer, well-lit photo or enter the token manually.");
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleLookupTicket = async (tokenToSearch: string) => {
        const cleanToken = extractToken(tokenToSearch);
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
            if (ticket.ticket_status === "USED") {
                setScanResult({
                    status: "ALREADY_USED",
                    message: "✕ TICKET ALREADY USED: This ticket was already verified for boarding.",
                    ticket,
                });
                return;
            }

            // 2. Check if Cancelled
            if (ticket.ticket_status === "CANCELLED" || ticket.booking_status === "CANCELLED") {
                setScanResult({
                    status: "CANCELLED",
                    message: "✕ TICKET CANCELLED: This reservation has been cancelled.",
                    ticket,
                });
                return;
            }

            // 3. Check Payment Status
            if (ticket.payment_status && ticket.payment_status !== "PAID") {
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
            const res = await fetch("/api/conductor/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: scanResult.ticket.qr_token,
                    action: "CONFIRM_BOARDING",
                    inspectedId: idInspected,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to confirm boarding.");
            }

            // Update local state to USED
            setScanResult((prev) =>
                prev
                    ? {
                          ...prev,
                          status: "ALREADY_USED",
                          message: "✓ BOARDING CONFIRMED: Passenger marked as BOARDED (USED).",
                          ticket: { ...prev.ticket, ticket_status: "USED" },
                      }
                    : null
            );
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
                    <p className="text-xs text-zinc-400">
                        Scan via camera, snap/upload photo, or enter passenger QR code token to verify boarding.
                    </p>
                </div>
                {tripIdFilter && (
                    <Button variant="outline" size="sm" asChild className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white">
                        <a href={`/conductor/manifest?trip_id=${tripIdFilter}`}>View Trip Manifest</a>
                    </Button>
                )}
            </div>

            {/* Hidden canvas for video processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden native photo input for mobile snap or image upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileScan}
            />

            {/* Camera / Manual Input Toggle Box */}
            <Card className="border-zinc-800 bg-zinc-950 text-white shadow-xl">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Camera className="h-5 w-5 text-red-500" />
                                QR Scanner Input Controls
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-400">
                                Choose between Live Camera, Snap Photo / Upload Image, or Manual Token Entry.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                size="sm"
                                variant={cameraActive ? "destructive" : "default"}
                                onClick={() => setCameraActive(!cameraActive)}
                                className={cameraActive ? "" : "bg-red-600 hover:bg-red-700 text-white font-bold"}
                            >
                                <Camera className="mr-1.5 h-4 w-4" />
                                {cameraActive ? "Close Camera" : "Open Live Camera"}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={processingPhoto}
                                className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white font-semibold text-xs"
                            >
                                <Upload className="mr-1.5 h-4 w-4" />
                                {processingPhoto ? "Reading QR..." : "Snap Photo / Upload"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Camera Error Alert with Actionable Help */}
                    {cameraError && (
                        <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 space-y-2 text-xs">
                            <div className="flex items-center gap-2 font-bold text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>Camera Access Notice</span>
                            </div>
                            <p className="text-zinc-300 leading-relaxed">{cameraError}</p>
                            <div className="pt-1 flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-red-500/50 bg-red-900/30 text-red-200 hover:bg-red-900/50 text-xs font-bold"
                                >
                                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Use Photo Snap Instead (Works Everywhere)
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Live Video Feed Modal / Overlay */}
                    {cameraActive && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
                            <div className="relative w-full max-w-lg bg-zinc-950 rounded-2xl border-2 border-zinc-800 overflow-hidden shadow-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                                        <span className="font-extrabold text-sm text-white">Live QR Scanner</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={toggleCameraFacing}
                                            className="text-zinc-400 hover:text-white text-xs"
                                            title="Switch Camera (Front/Back)"
                                        >
                                            <SwitchCamera className="h-4 w-4 mr-1" /> Flip
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => setCameraActive(false)}
                                            className="text-xs font-bold"
                                        >
                                            <XCircle className="h-4 w-4 mr-1" /> Close
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black flex items-center justify-center">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Viewfinder Target Graphic */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-56 h-56 border-2 border-red-500/80 rounded-2xl relative animate-pulse flex items-center justify-center">
                                            {/* Corner Accents */}
                                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 -mt-1 -ml-1 rounded-tl" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 -mt-1 -mr-1 rounded-tr" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 -mb-1 -ml-1 rounded-bl" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 -mb-1 -mr-1 rounded-br" />
                                            <p className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                                Align QR Code Here
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-center text-[11px] text-zinc-400">
                                    Point camera steadily at passenger&apos;s printed or mobile QR Boarding Pass.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Manual Token Input Fallback */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleLookupTicket(manualToken);
                        }}
                        className="flex flex-col sm:flex-row gap-2 pt-1"
                    >
                        <Input
                            placeholder="Enter Ticket Token (e.g. TKT-20261109-XXXXXX)"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm tracking-wide"
                        />
                        <Button type="submit" className="bg-red-600 hover:bg-red-700 font-bold px-6 shrink-0" disabled={verifying}>
                            {verifying ? "Checking..." : "Verify Token"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* VERIFICATION RESULT CARD */}
            {scanResult && (
                <Card
                    className={`border-2 shadow-2xl transition-all ${
                        scanResult.status === "VALID"
                            ? "border-emerald-500 bg-emerald-950/30"
                            : scanResult.status === "ALREADY_USED"
                            ? "border-yellow-500 bg-yellow-950/30"
                            : "border-red-500 bg-red-950/30"
                    }`}
                >
                    <CardHeader className="pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            {scanResult.status === "VALID" ? (
                                <CheckCircle2 className="h-8 w-8 text-emerald-400 flex-shrink-0" />
                            ) : scanResult.status === "ALREADY_USED" ? (
                                <AlertTriangle className="h-8 w-8 text-yellow-400 flex-shrink-0" />
                            ) : (
                                <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                            )}
                            <div>
                                <CardTitle
                                    className={`text-xl font-bold ${
                                        scanResult.status === "VALID"
                                            ? "text-emerald-400"
                                            : scanResult.status === "ALREADY_USED"
                                            ? "text-yellow-400"
                                            : "text-red-400"
                                    }`}
                                >
                                    {scanResult.message}
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-xs mt-0.5">
                                    Status Check Timestamp: {new Date().toLocaleTimeString()} • Token:{" "}
                                    <span className="font-mono text-white font-bold">{scanResult.ticket?.qr_token || manualToken}</span>
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
                                                <div
                                                    key={idx}
                                                    className="bg-zinc-900/80 p-2.5 rounded-lg border border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                                                >
                                                    <div>
                                                        <span className="font-bold text-white">#{idx + 1} {p.name}</span>
                                                        <span className="ml-2 font-semibold text-purple-400">
                                                            ({p.classification === "SENIOR" ? "Senior Citizen" : p.classification})
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
                                    {scanResult.status === "VALID" && (
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
                        {scanResult.status === "VALID" ? (
                            <Button
                                size="lg"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg py-6 shadow-lg shadow-emerald-600/30"
                                onClick={handleConfirmBoarding}
                                disabled={confirming || (hasDiscount && !idInspected)}
                            >
                                {confirming ? (
                                    "Updating Ticket Status..."
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Check className="h-6 w-6" />
                                        [ CONFIRM PASSENGER BOARDING ]
                                    </span>
                                )}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full bg-white text-black hover:bg-zinc-100 hover:text-black font-bold border-zinc-300"
                                onClick={() => setScanResult(null)}
                            >
                                Clear and Scan Next Ticket
                            </Button>
                        )}
                        {hasDiscount && scanResult.status === "VALID" && !idInspected && (
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
