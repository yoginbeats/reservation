"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, Camera, RefreshCw, User, Bus, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ConductorQrScanPage() {
    const searchParams = useSearchParams();
    const tripIdFilter = searchParams?.get("trip_id");

    const [manualToken, setManualToken] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);

    // Verification Result State
    const [scanResult, setScanResult] = useState<{
        status: "VALID" | "ALREADY_USED" | "CANCELLED" | "NOT_FOUND" | "PAYMENT_UNPAID" | "WRONG_TRIP";
        message: string;
        ticket?: any;
    } | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const supabase = createClient();

    // Toggle Camera Access
    useEffect(() => {
        if (cameraActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [cameraActive]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            alert("Camera access denied or unavailable on this device. Please use manual token input.");
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleLookupTicket = async (tokenToSearch: string) => {
        const cleanToken = tokenToSearch.trim();
        if (!cleanToken) return;

        setVerifying(true);
        setScanResult(null);

        try {
            // Query ticket from database with relations
            const { data: ticket, error } = await supabase
                .from('tickets')
                .select(`
                    id,
                    qr_token,
                    ticket_status,
                    created_at,
                    booking:bookings(
                        id,
                        passenger_name,
                        passenger_contact,
                        seat_number,
                        total_price,
                        booking_status,
                        payment:payments(payment_status),
                        trip:trips(
                            id,
                            departure_time,
                            bus:buses(bus_number),
                            route:routes(
                                origin:origin_terminal_id(name),
                                destination:destination_terminal_id(name)
                            )
                        )
                    )
                `)
                .eq('qr_token', cleanToken)
                .single();

            if (error || !ticket) {
                setScanResult({
                    status: "NOT_FOUND",
                    message: `✕ TICKET INVALID: Ticket token "${cleanToken}" not found in system.`,
                });
                return;
            }

            const booking = ticket.booking as any;
            const trip = booking?.trip as any;
            const paymentStatus = booking?.payment?.[0]?.payment_status || booking?.payment?.payment_status;

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
            if (ticket.ticket_status === 'CANCELLED' || booking?.booking_status === 'CANCELLED') {
                setScanResult({
                    status: "CANCELLED",
                    message: "✕ TICKET CANCELLED: This reservation has been cancelled.",
                    ticket,
                });
                return;
            }

            // 3. Check Payment Status
            if (paymentStatus !== 'PAID') {
                setScanResult({
                    status: "PAYMENT_UNPAID",
                    message: "✕ PAYMENT NOT CONFIRMED: This ticket has not been paid for yet.",
                    ticket,
                });
                return;
            }

            // 4. Check Trip ID Filter Match (if filter passed)
            if (tripIdFilter && trip?.id !== tripIdFilter) {
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
                message: "✕ Error retrieving ticket status.",
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
            const { data: { user } } = await supabase.auth.getUser();
            const ticketId = scanResult.ticket.id;
            const tripId = scanResult.ticket.booking?.trip?.id;

            // Update Ticket Status to USED
            const { error: updateError } = await supabase
                .from('tickets')
                .update({ ticket_status: 'USED' })
                .eq('id', ticketId);

            if (updateError) throw updateError;

            // Log Verification Audit
            if (user && tripId) {
                await supabase.from('ticket_verifications').insert({
                    ticket_id: ticketId,
                    conductor_id: user.id,
                    trip_id: tripId,
                    status: 'SUCCESS',
                    reason: 'Boarding Confirmed by Conductor Scanner',
                });
            }

            // Update local state to USED
            setScanResult((prev) => prev ? {
                ...prev,
                status: "ALREADY_USED",
                message: "✓ BOARDING CONFIRMED: Ticket is now marked as USED.",
                ticket: { ...prev.ticket, ticket_status: 'USED' }
            } : null);
        } catch (err: any) {
            console.error("Boarding confirmation error:", err);
            alert("Failed to confirm boarding: " + err.message);
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="container mx-auto max-w-3xl space-y-6">
            <div className="text-center space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                    <QrCode className="h-8 w-8 text-red-500" />
                    Conductor QR Scanner
                </h1>
                <p className="text-sm text-zinc-400">Scan or enter passenger QR code token to verify boarding.</p>
            </div>

            {/* Camera / Manual Input Toggle Box */}
            <Card className="border-zinc-800 bg-zinc-950 text-white shadow-xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold">QR Scanner Device Input</CardTitle>
                        <Button
                            size="sm"
                            variant={cameraActive ? "destructive" : "outline"}
                            onClick={() => setCameraActive(!cameraActive)}
                        >
                            <Camera className="mr-2 h-4 w-4" />
                            {cameraActive ? "Turn Off Camera" : "Open Device Camera"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Live Video Feed */}
                    {cameraActive && (
                        <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-black h-64 flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                            <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl pointer-events-none flex items-center justify-center">
                                <div className="h-36 w-36 border-2 border-red-500 border-dashed rounded-lg animate-pulse" />
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
                            placeholder="Enter Ticket Token (e.g. TKT-20260903-XXXXXX)"
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
                                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            ) : scanResult.status === 'ALREADY_USED' ? (
                                <AlertTriangle className="h-8 w-8 text-yellow-400" />
                            ) : (
                                <XCircle className="h-8 w-8 text-red-500" />
                            )}
                            <div>
                                <CardTitle className={`text-xl font-bold ${
                                    scanResult.status === 'VALID' ? 'text-emerald-400' : scanResult.status === 'ALREADY_USED' ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                    {scanResult.message}
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-xs mt-0.5">
                                    Status Check Timestamp: {new Date().toLocaleTimeString()}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {scanResult.ticket && (
                        <CardContent className="p-6 space-y-4 text-zinc-200">
                            <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-4">
                                <div>
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Passenger Name</p>
                                    <p className="text-lg font-bold text-white">{scanResult.ticket.booking?.passenger_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Seat Assigned</p>
                                    <p className="font-mono text-3xl font-black text-emerald-400">
                                        #{scanResult.ticket.booking?.seat_number < 10 ? `0${scanResult.ticket.booking?.seat_number}` : scanResult.ticket.booking?.seat_number}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-zinc-400">Route</p>
                                    <p className="font-bold text-white">
                                        {scanResult.ticket.booking?.trip?.route?.origin?.name} ➔ {scanResult.ticket.booking?.trip?.route?.destination?.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-zinc-400">Bus Assigned</p>
                                    <p className="font-bold text-white">{scanResult.ticket.booking?.trip?.bus?.bus_number || "Bus TBD"}</p>
                                </div>
                                <div>
                                    <p className="text-zinc-400">Departure Schedule</p>
                                    <p className="font-bold text-white">
                                        {new Date(scanResult.ticket.booking?.trip?.departure_time).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-zinc-400">Payment Status</p>
                                    <p className="font-bold text-emerald-400">PAID (₱{scanResult.ticket.booking?.total_price || 850})</p>
                                </div>
                            </div>
                        </CardContent>
                    )}

                    {/* CONFIRM BOARDING ACTION BUTTON */}
                    <CardFooter className="bg-zinc-900/50 p-4 border-t border-zinc-800">
                        {scanResult.status === 'VALID' ? (
                            <Button
                                size="lg"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg py-6 shadow-lg shadow-emerald-600/30"
                                onClick={handleConfirmBoarding}
                                disabled={confirming}
                            >
                                {confirming ? "Updating Ticket Status..." : (
                                    <span className="flex items-center gap-2">
                                        <Check className="h-6 w-6" />
                                        [ CONFIRM BOARDING ]
                                    </span>
                                )}
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full text-zinc-300" onClick={() => setScanResult(null)}>
                                Clear and Scan Next Ticket
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
