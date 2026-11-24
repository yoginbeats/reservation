"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
    Check,
    Upload,
    SwitchCamera,
    ShieldAlert,
    X,
    Zap,
    Flashlight
} from "lucide-react";
import jsQR from "jsqr";

export default function ConductorQrScanPage() {
    const searchParams = useSearchParams();
    const tripIdFilter = searchParams?.get("trip_id");

    const [manualToken, setManualToken] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [cameraActive, setCameraActive] = useState(true);
    const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [idInspected, setIdInspected] = useState(false);
    const [processingPhoto, setProcessingPhoto] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [isHardwareAccelerated, setIsHardwareAccelerated] = useState(false);

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
    const barcodeDetectorRef = useRef<any>(null);

    // Initialize Native BarcodeDetector (Chrome / Android / Chromium hardware acceleration)
    useEffect(() => {
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
            try {
                const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
                barcodeDetectorRef.current = detector;
                setIsHardwareAccelerated(true);
            } catch (e) {
                console.warn("Native BarcodeDetector not available, falling back to optimized jsQR:", e);
                barcodeDetectorRef.current = null;
                setIsHardwareAccelerated(false);
            }
        }
    }, []);

    // Listen to browser permission change (e.g. if user allowed camera in site settings)
    useEffect(() => {
        if (typeof window !== "undefined" && navigator.permissions?.query) {
            navigator.permissions
                .query({ name: "camera" as any })
                .then((permissionStatus) => {
                    permissionStatus.onchange = () => {
                        if (permissionStatus.state === "granted" && !cameraActive) {
                            setCameraError(null);
                            setCameraActive(true);
                        }
                    };
                })
                .catch(() => {});
        }
    }, [cameraActive]);

    // Audio beep & haptic feedback on successful scan
    const playSuccessFeedback = useCallback(() => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                const ctx = new AudioContextClass();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.16);
            }
        } catch {}

        try {
            if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([80, 40, 80]);
            }
        } catch {}
    }, []);

    // Extract standard ticket token from QR code content (URL, plain text, or JSON)
    const extractToken = (raw: string): string => {
        const text = raw.trim();
        const tktMatch = text.match(/TKT-[A-Z0-9-]+/i);
        if (tktMatch) return tktMatch[0].toUpperCase();

        try {
            const url = new URL(text);
            const ref =
                url.searchParams.get("ref") ||
                url.searchParams.get("token") ||
                url.searchParams.get("qr_token") ||
                url.searchParams.get("booking_id");
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

    const stopCamera = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => {
                try {
                    t.stop();
                } catch {}
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setTorchOn(false);
        setHasTorch(false);
    }, []);

    const runScanLoop = useCallback(() => {
        let isProcessing = false;
        let lastScanTime = 0;

        const scan = async () => {
            if (!streamRef.current || !videoRef.current) return;

            const now = performance.now();
            const video = videoRef.current;

            if (
                video &&
                video.readyState >= video.HAVE_CURRENT_DATA &&
                !isProcessing &&
                now - lastScanTime >= 65 // ~15 scans/sec: instant detection without CPU choke
            ) {
                lastScanTime = now;
                isProcessing = true;

                try {
                    let detectedToken: string | null = null;

                    // 1. Hardware Accelerated BarcodeDetector (instant < 15ms)
                    if (barcodeDetectorRef.current) {
                        try {
                            const barcodes = await barcodeDetectorRef.current.detect(video);
                            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                                detectedToken = extractToken(barcodes[0].rawValue);
                            }
                        } catch {
                            // Fallback to jsQR below
                        }
                    }

                    // 2. High-speed jsQR fallback with hardware downscaling
                    if (!detectedToken && video.videoWidth > 0 && video.videoHeight > 0) {
                        const canvas = canvasRef.current || document.createElement("canvas");
                        const vw = video.videoWidth;
                        const vh = video.videoHeight;

                        // Downscale to max ~640px: 8x faster than raw 1080p frame
                        const maxDim = 640;
                        const scale = Math.min(1, maxDim / Math.max(vw, vh));
                        const sw = Math.max(1, Math.round(vw * scale));
                        const sh = Math.max(1, Math.round(vh * scale));

                        canvas.width = sw;
                        canvas.height = sh;
                        const ctx = canvas.getContext("2d", { willReadFrequently: true });

                        if (ctx) {
                            ctx.drawImage(video, 0, 0, sw, sh);
                            const imgData = ctx.getImageData(0, 0, sw, sh);

                            const code = jsQR(imgData.data, sw, sh, {
                                inversionAttempts: "attemptBoth",
                            });

                            if (code && code.data && code.data.trim()) {
                                detectedToken = extractToken(code.data);
                            }
                        }
                    }

                    if (detectedToken) {
                        playSuccessFeedback();
                        setManualToken(detectedToken);
                        setCameraActive(false);
                        stopCamera();
                        handleLookupTicket(detectedToken);
                        return;
                    }
                } catch (e) {
                    console.warn("Scan frame error:", e);
                } finally {
                    isProcessing = false;
                }
            }

            animationFrameRef.current = requestAnimationFrame(scan);
        };

        animationFrameRef.current = requestAnimationFrame(scan);
    }, [playSuccessFeedback, stopCamera]);

    const startCamera = useCallback(async () => {
        setCameraError(null);

        if (typeof window === "undefined") return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError(
                "Camera access is not supported on this browser or requires a secure HTTPS connection. Please use 'Snap Photo / Upload' or enter the ticket token manually."
            );
            return;
        }

        stopCamera();

        let stream: MediaStream | null = null;

        // Multi-tier fallback constraints for maximum hardware compatibility
        const constraintTiers: MediaStreamConstraints[] = [
            {
                video: {
                    facingMode: { ideal: cameraFacing },
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    advanced: [{ focusMode: "continuous" } as any],
                },
            },
            {
                video: {
                    facingMode: { ideal: cameraFacing },
                },
            },
            {
                video: {
                    facingMode: "environment",
                },
            },
            {
                video: true,
            },
        ];

        let lastErr: any = null;
        for (const constraints of constraintTiers) {
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (stream) break;
            } catch (err: any) {
                lastErr = err;
                if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
                    break; // User denied or permission blocked; don't hammer other constraints
                }
            }
        }

        if (!stream) {
            setCameraActive(false);
            let msg = "Hindi ma-access ang camera sa device na ito.";
            if (lastErr?.name === "NotAllowedError" || lastErr?.name === "PermissionDeniedError") {
                msg =
                    "Naka-Block ang camera sa iyong browser. Upang magamit ang live scanner, i-click ang lock icon (🔒) o site settings sa tabi ng URL bar, piliin ang 'Allow' para sa Camera, at i-refresh ang page.";
            } else if (lastErr?.name === "NotFoundError" || lastErr?.name === "DevicesNotFoundError") {
                msg = "Walang nakitang camera hardware sa device na ito. Gamitin ang 'Snap Photo / Upload' button sa ibaba.";
            } else if (lastErr?.name === "NotReadableError" || lastErr?.name === "TrackStartError") {
                msg = "Kasalukuyang ginagamit ang camera ng ibang app (halimbawa: Zoom o camera app). Pakisara muna ang ibang app.";
            }
            setCameraError(msg);
            return;
        }

        // Check torch capability
        try {
            const track = stream.getVideoTracks()[0];
            const caps = (track as any)?.getCapabilities?.();
            if (caps && "torch" in caps) {
                setHasTorch(true);
            }
            if (caps?.focusMode?.includes("continuous")) {
                (track as any).applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {});
            }
        } catch {}

        streamRef.current = stream;

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.setAttribute("autoplay", "true");
            videoRef.current.muted = true;
            try {
                await videoRef.current.play();
            } catch (e) {
                console.warn("Video play notice:", e);
            }
            runScanLoop();
        }
    }, [cameraFacing, runScanLoop, stopCamera]);

    // Toggle Camera on/off or change facing mode
    useEffect(() => {
        if (cameraActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [cameraActive, cameraFacing, startCamera, stopCamera]);

    const toggleTorch = async () => {
        if (!streamRef.current || !hasTorch) return;
        try {
            const track = streamRef.current.getVideoTracks()[0];
            const nextTorch = !torchOn;
            await (track as any).applyConstraints({
                advanced: [{ torch: nextTorch }],
            });
            setTorchOn(nextTorch);
        } catch (e) {
            console.warn("Torch toggle error:", e);
        }
    };

    const toggleCameraFacing = () => {
        setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
    };

    // Photo Upload / Instant Snap Scanner
    const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessingPhoto(true);
        setCameraError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                let tokenFound: string | null = null;

                // 1. Try Hardware BarcodeDetector on image
                if (barcodeDetectorRef.current) {
                    try {
                        const barcodes = await barcodeDetectorRef.current.detect(img);
                        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                            tokenFound = extractToken(barcodes[0].rawValue);
                        }
                    } catch {}
                }

                // 2. Fallback to jsQR
                if (!tokenFound) {
                    const maxDim = 1000;
                    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                    const w = Math.max(1, Math.round(img.width * scale));
                    const h = Math.max(1, Math.round(img.height * scale));
                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, w, h);
                        const imageData = ctx.getImageData(0, 0, w, h);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "attemptBoth",
                        });
                        if (code && code.data && code.data.trim()) {
                            tokenFound = extractToken(code.data);
                        }
                    }
                }

                setProcessingPhoto(false);

                if (tokenFound) {
                    playSuccessFeedback();
                    setManualToken(tokenFound);
                    handleLookupTicket(tokenFound);
                } else {
                    alert(
                        "Hindi madetect ang QR Code sa litratong ito. Pakitutok nang mas malinaw, liwanagan, o i-type nang direkta ang Ticket Token sa ibaba."
                    );
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
            const res = await fetch(`/api/conductor/tickets?token=${encodeURIComponent(cleanToken)}`);
            const data = await res.json();

            if (!res.ok || !data.ticket) {
                setScanResult({
                    status: "NOT_FOUND",
                    message: `✕ TICKET INVALID: Hindi natagpuan ang ticket token "${cleanToken}" sa system o manifest.`,
                });
                return;
            }

            const ticket = data.ticket;

            // 1. Check if Ticket Already Used
            if (ticket.ticket_status === "USED") {
                setScanResult({
                    status: "ALREADY_USED",
                    message: "✕ TICKET ALREADY USED: Nagamit na ang ticket na ito para sa pagsakay.",
                    ticket,
                });
                return;
            }

            // 2. Check if Cancelled
            if (ticket.ticket_status === "CANCELLED" || ticket.booking_status === "CANCELLED") {
                setScanResult({
                    status: "CANCELLED",
                    message: "✕ TICKET CANCELLED: Ang reservation na ito ay nakansela na.",
                    ticket,
                });
                return;
            }

            // 3. Check Payment Status
            if (ticket.payment_status && ticket.payment_status !== "PAID") {
                setScanResult({
                    status: "PAYMENT_UNPAID",
                    message: `✕ PAYMENT NOT CONFIRMED: Status ay ${ticket.payment_status}.`,
                    ticket,
                });
                return;
            }

            // 4. Check Trip ID Filter Match (if filter passed)
            if (tripIdFilter && ticket.trip?.id && ticket.trip.id !== tripIdFilter) {
                setScanResult({
                    status: "WRONG_TRIP",
                    message: "✕ WRONG TRIP: Ang ticket na ito ay para sa ibang scheduled trip.",
                    ticket,
                });
                return;
            }

            // Valid Ticket Result!
            setScanResult({
                status: "VALID",
                message: "✓ TICKET VALID: Beripikado at handa na para sa pagsakay.",
                ticket,
            });
        } catch (err: any) {
            console.error("QR Scan Error:", err);
            setScanResult({
                status: "NOT_FOUND",
                message: "✕ Nagka-problema sa pagkuha ng ticket status. Pakisuri ang koneksyon sa internet.",
            });
        } finally {
            setVerifying(false);
        }
    };

    // Confirm Boarding Action
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
            alert("Bigo sa pag-confirm ng boarding: " + err.message);
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
        <div className="container mx-auto max-w-3xl space-y-6 pb-12">
            <style jsx>{`
                @keyframes scanlaser {
                    0% {
                        top: 5%;
                        opacity: 0.8;
                    }
                    50% {
                        top: 92%;
                        opacity: 1;
                    }
                    100% {
                        top: 5%;
                        opacity: 0.8;
                    }
                }
                .laser-line {
                    position: absolute;
                    left: 4%;
                    right: 4%;
                    height: 2px;
                    background: #ef4444;
                    box-shadow: 0 0 12px 2px #ef4444;
                    animation: scanlaser 2s ease-in-out infinite;
                }
            `}</style>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <QrCode className="h-7 w-7 text-red-500" />
                        Conductor Boarding QR Scanner
                    </h1>
                    <p className="text-xs text-zinc-400">
                        Mabilisang QR scanner gamit ang camera, instant photo snap, o manual ticket token entry.
                    </p>
                </div>
                {tripIdFilter && (
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white"
                    >
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
            <Card className="border-zinc-800 bg-zinc-950 text-white shadow-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-zinc-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Camera className="h-5 w-5 text-red-500" />
                                Live QR Scanner
                                {isHardwareAccelerated && (
                                    <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Zap className="h-3 w-3 text-emerald-400" /> Instant Detection
                                    </span>
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-400">
                                Itutok ang camera sa QR code ng pasahero upang ma-detect agad.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                size="sm"
                                variant={cameraActive ? "destructive" : "default"}
                                onClick={() => {
                                    setCameraError(null);
                                    setCameraActive(!cameraActive);
                                }}
                                className={cameraActive ? "font-bold text-xs" : "bg-red-600 hover:bg-red-700 text-white font-bold text-xs"}
                            >
                                <Camera className="mr-1.5 h-4 w-4" />
                                {cameraActive ? "Pause Camera" : "Open Camera"}
                            </Button>

                            {cameraActive && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={toggleCameraFacing}
                                        className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white font-semibold text-xs"
                                        title="Switch Camera (Front/Back)"
                                    >
                                        <SwitchCamera className="mr-1 h-3.5 w-3.5" /> Flip
                                    </Button>

                                    {hasTorch && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={toggleTorch}
                                            className={`text-xs font-semibold ${
                                                torchOn
                                                    ? "bg-amber-500 text-black border-amber-400 font-bold"
                                                    : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                                            }`}
                                            title="Toggle Flashlight / Torch"
                                        >
                                            <Flashlight className="mr-1 h-3.5 w-3.5" /> {torchOn ? "Flash ON" : "Flash"}
                                        </Button>
                                    )}
                                </>
                            )}

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={processingPhoto}
                                className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-white font-semibold text-xs"
                            >
                                <Upload className="mr-1.5 h-4 w-4" />
                                {processingPhoto ? "Reading QR..." : "Snap / Upload"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                    {/* Camera Error Notice with 1-Click Retry */}
                    {cameraError && (
                        <div className="rounded-xl border border-red-500/50 bg-red-950/60 p-4 space-y-3 text-xs shadow-lg animate-in fade-in">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
                                    <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                                    <span>Camera Access Notice</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCameraError(null)}
                                    className="text-zinc-400 hover:text-white p-1 rounded-md transition"
                                    aria-label="Dismiss notice"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <p className="text-zinc-200 leading-relaxed">{cameraError}</p>

                            <div className="rounded-lg bg-black/40 border border-zinc-800/80 p-3 space-y-1.5 text-[11px] text-zinc-300">
                                <p className="font-bold text-zinc-100 flex items-center gap-1.5">
                                    <span>💡</span> Paano i-Allow ang Camera sa iyong Browser:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-zinc-300 pl-1">
                                    <li>
                                        I-click ang <strong>🔒 Lock icon</strong> o <strong>🎛️ Site Settings</strong> sa tabi ng URL sa address bar.
                                    </li>
                                    <li>
                                        Hanapin ang <strong>Camera</strong> at ilipat ito patungong{" "}
                                        <strong className="text-emerald-400">Allow</strong>.
                                    </li>
                                    <li>Pindutin ang <strong>Subukang Muli</strong> sa ibaba o i-refresh ang page.</li>
                                </ol>
                            </div>

                            <div className="pt-1 flex flex-wrap items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setCameraError(null);
                                        setCameraActive(true);
                                        startCamera();
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                                >
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Subukang Muli (Retry Camera)
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-amber-500/50 bg-amber-950/40 text-amber-200 hover:bg-amber-900/50 text-xs font-bold"
                                >
                                    <Camera className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                                    Snap Photo with Camera Directly
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* LIVE CAMERA VIEWFINDER (IN-PAGE RESPONSIVE) */}
                    {cameraActive && !cameraError && (
                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] bg-black border-2 border-zinc-800 flex items-center justify-center shadow-2xl">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover select-none"
                            />

                            {/* Viewfinder Target Graphic with Sweeping Laser Line */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-64 h-64 sm:w-72 sm:h-72 border border-red-500/40 rounded-3xl relative flex items-center justify-center">
                                    {/* Sweeping Laser Line */}
                                    <div className="laser-line" />

                                    {/* Corner Reticles */}
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 -mt-1 -ml-1 rounded-tl-xl" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 -mt-1 -mr-1 rounded-tr-xl" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 -mb-1 -ml-1 rounded-bl-xl" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 -mb-1 -mr-1 rounded-br-xl" />

                                    <p className="text-[11px] font-black text-white bg-black/75 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-lg">
                                        Align QR Code Here
                                    </p>
                                </div>
                            </div>

                            {/* Live Status Overlay Pill */}
                            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-700/60 pointer-events-none">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                                <span className="text-[11px] font-bold text-white tracking-wide">SCANNING...</span>
                            </div>
                        </div>
                    )}

                    {/* Camera Paused Placeholder */}
                    {!cameraActive && !scanResult && (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-3">
                            <Camera className="h-10 w-10 text-zinc-500 mx-auto" />
                            <div>
                                <p className="font-bold text-white text-sm">Naka-pause ang Live Camera</p>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Pindutin ang button sa ibaba upang buksan muli ang camera scanner.
                                </p>
                            </div>
                            <Button
                                onClick={() => {
                                    setCameraError(null);
                                    setCameraActive(true);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                            >
                                <Camera className="mr-1.5 h-4 w-4" /> Buksan ang Live Camera (Open Scanner)
                            </Button>
                        </div>
                    )}

                    {/* Manual Token Input Form */}
                    <div className="pt-2 border-t border-zinc-800/80">
                        <p className="text-xs font-semibold text-zinc-400 mb-2">O i-type ang Ticket Token nang mano-mano:</p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleLookupTicket(manualToken);
                            }}
                            className="flex flex-col sm:flex-row gap-2"
                        >
                            <Input
                                placeholder="e.g. TKT-20261123-G9UA3J"
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm tracking-wider"
                            />
                            <Button
                                type="submit"
                                className="bg-red-600 hover:bg-red-700 font-bold px-6 shrink-0"
                                disabled={verifying}
                            >
                                {verifying ? "Checking..." : "Verify Token"}
                            </Button>
                        </form>
                    </div>
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
                                    <span className="font-mono text-white font-bold">
                                        {scanResult.ticket?.qr_token || manualToken}
                                    </span>
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {scanResult.ticket && (
                        <CardContent className="p-6 space-y-4 text-zinc-200">
                            <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-4">
                                <div>
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                                        Primary Passenger
                                    </p>
                                    <p className="text-lg font-bold text-white">{scanResult.ticket.passenger_name}</p>
                                    {scanResult.ticket.passenger_contact && (
                                        <p className="text-xs text-zinc-400 font-mono mt-0.5">
                                            📞 {scanResult.ticket.passenger_contact}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                                        {scanResult.ticket.seat_numbers?.length > 1 ? "Seats Assigned" : "Seat Assigned"}
                                    </p>
                                    <p className="font-mono text-3xl font-black text-emerald-400">
                                        {scanResult.ticket.seat_numbers?.length > 1
                                            ? scanResult.ticket.seat_numbers
                                                  .map((s: number) => `#${s < 10 ? `0${s}` : s}`)
                                                  .join(", ")
                                            : `#${
                                                  scanResult.ticket.seat_number < 10
                                                      ? `0${scanResult.ticket.seat_number}`
                                                      : scanResult.ticket.seat_number
                                              }`}
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
                                        {scanResult.ticket.discounted_passengers &&
                                        scanResult.ticket.discounted_passengers.length > 0 ? (
                                            scanResult.ticket.discounted_passengers.map((p: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="bg-zinc-900/80 p-2.5 rounded-lg border border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                                                >
                                                    <div>
                                                        <span className="font-bold text-white">
                                                            #{idx + 1} {p.name}
                                                        </span>
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
                                            <label
                                                htmlFor="inspectCheckbox"
                                                className="text-xs text-purple-200 font-semibold cursor-pointer select-none"
                                            >
                                                Kumpirmado: Personal kong nasuri ang valid ID card ng pasahero at tumutugma
                                                ito sa pangalan at ID number sa itaas.
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
                                    <p className="font-bold text-white">
                                        {scanResult.ticket.trip?.bus_number || "Superlines Bus"}
                                    </p>
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

                    {/* ACTION FOOTER */}
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
                                onClick={() => {
                                    setScanResult(null);
                                    setCameraActive(true);
                                }}
                            >
                                <Camera className="mr-2 h-4 w-4" /> Scan Next Ticket (Reopen Camera)
                            </Button>
                        )}
                        {hasDiscount && scanResult.status === "VALID" && !idInspected && (
                            <p className="text-[11px] text-amber-400 text-center font-semibold">
                                ⚠️ Pakilagyan ng check ang physical ID inspection confirmation sa itaas upang ma-unlock ang boarding.
                            </p>
                        )}
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
