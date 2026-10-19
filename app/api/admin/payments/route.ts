import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVerificationMode, setVerificationMode } from "@/lib/payment-settings";
import { getLocalBookings, updateLocalBookingStatus } from "@/lib/local-booking-store";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const modeQuery = searchParams.get("mode");

        if (modeQuery === "status") {
            return NextResponse.json({
                success: true,
                verification_mode: getVerificationMode(),
            });
        }

        const supabase = await createClient();

        // 1. Fetch from 'bookings'
        let bookingsData: any[] = [];
        try {
            const { data, error } = await supabase
                .from("bookings")
                .select("*, trip:trips(*, bus:buses(*))")
                .order("created_at", { ascending: false })
                .limit(50);
            if (!error && data) bookingsData = data;
        } catch (e) {
            console.warn("Could not fetch from bookings table:", e);
        }

        // 2. Fetch from 'reservations'
        let reservationsData: any[] = [];
        try {
            const { data, error } = await supabase
                .from("reservations")
                .select("*, trip:trips(*, bus:buses(*))")
                .order("created_at", { ascending: false })
                .limit(50);
            if (!error && data) reservationsData = data;
        } catch (e) {
            console.warn("Could not fetch from reservations table:", e);
        }

        // 3. Fetch all payments to correlate
        let paymentsList: any[] = [];
        try {
            const { data } = await supabase
                .from("payments")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100);
            if (data) paymentsList = data;
        } catch {}

        // 4. Fetch tickets to correlate QR tokens
        let ticketsList: any[] = [];
        try {
            const { data } = await supabase
                .from("tickets")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(100);
            if (data) ticketsList = data;
        } catch {}

        // 5. Combine and normalize
        const seenIds = new Set<string>();
        const combinedList: any[] = [];

        for (const b of bookingsData) {
            seenIds.add(b.id);
            const p = paymentsList.find(x => x.booking_id === b.id || x.reservation_id === b.id);
            const t = ticketsList.find(x => x.booking_id === b.id || x.reservation_id === b.id);
            
            combinedList.push({
                id: b.id,
                source_table: "bookings",
                created_at: b.created_at,
                passenger_name: b.passenger_name || "Guest Passenger",
                passenger_contact: b.passenger_contact || "N/A",
                passenger_email: b.passenger_email || "N/A",
                seat_number: b.seat_number,
                total_price: Number(b.total_price || p?.amount || 650),
                booking_status: b.booking_status || "PENDING",
                payment_status: p?.payment_status || p?.status || (b.booking_status === "CONFIRMED" ? "PAID" : "PENDING_VERIFICATION"),
                payment_method: p?.payment_method || "GCASH_DIRECT",
                transaction_ref: p?.transaction_ref || p?.transaction_id || "N/A",
                qr_token: t?.qr_token || t?.qr_code || `TKT-${b.id.slice(0, 8).toUpperCase()}`,
                trip: {
                    origin: b.trip?.origin || b.trip?.route?.origin?.name || "Cubao",
                    destination: b.trip?.destination || b.trip?.route?.destination?.name || "Daet",
                    departure_time: b.trip?.departure_time,
                    bus_number: b.trip?.bus?.bus_number || "Superlines Express",
                }
            });
        }

        for (const r of reservationsData) {
            if (seenIds.has(r.id)) continue;
            seenIds.add(r.id);
            const p = paymentsList.find(x => x.reservation_id === r.id || x.booking_id === r.id);
            const t = ticketsList.find(x => x.reservation_id === r.id || x.booking_id === r.id);

            combinedList.push({
                id: r.id,
                source_table: "reservations",
                created_at: r.created_at,
                passenger_name: r.passenger_name || "Guest Passenger",
                passenger_contact: r.passenger_contact || "N/A",
                passenger_email: r.passenger_email || "N/A",
                seat_number: r.seat_number,
                total_price: Number(r.total_price || p?.amount || 650),
                booking_status: r.status || "PENDING",
                payment_status: p?.status || p?.payment_status || (r.status === "CONFIRMED" ? "PAID" : "PENDING_VERIFICATION"),
                payment_method: p?.payment_method || "GCASH_DIRECT",
                transaction_ref: p?.transaction_id || p?.transaction_ref || "N/A",
                qr_token: t?.qr_code || t?.qr_token || `TKT-${r.id.slice(0, 8).toUpperCase()}`,
                trip: {
                    origin: r.trip?.origin || r.trip?.route?.origin?.name || "Cubao",
                    destination: r.trip?.destination || r.trip?.route?.destination?.name || "Daet",
                    departure_time: r.trip?.departure_time,
                    bus_number: r.trip?.bus?.bus_number || "Superlines Express",
                }
            });
        }

        // 3. Merge from local store for bulletproof presentation sync
        const localList = getLocalBookings();
        for (const lb of localList) {
            if (!seenIds.has(lb.id)) {
                seenIds.add(lb.id);
                combinedList.push(lb);
            }
        }

        // Sort descending by date
        combinedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({
            success: true,
            verification_mode: getVerificationMode(),
            bookings: combinedList,
            stats: {
                total_collected: combinedList
                    .filter(b => b.payment_status === "PAID" || b.booking_status === "CONFIRMED")
                    .reduce((sum, b) => sum + (b.total_price || 0), 0),
                pending_count: combinedList.filter(b => b.payment_status === "PENDING_VERIFICATION" || b.booking_status === "PENDING_VERIFICATION").length,
                confirmed_count: combinedList.filter(b => b.payment_status === "PAID" || b.booking_status === "CONFIRMED").length,
            }
        });
    } catch (err: any) {
        console.error("Admin Payments Fetch Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bookingId, action, mode } = body;

        // Mode switch request
        if (mode && (mode === "AUTO" || mode === "MANUAL")) {
            setVerificationMode(mode);
            return NextResponse.json({
                success: true,
                message: `Verification mode switched to ${mode}`,
                verification_mode: getVerificationMode(),
            });
        }

        if (!bookingId) {
            return NextResponse.json({ success: false, error: "Missing bookingId." }, { status: 400 });
        }

        const supabase = await createClient();

        if (action === "approve") {
            // Update local store immediately for instant real-time sync
            updateLocalBookingStatus(bookingId, "CONFIRMED", "PAID");

            // Update bookings
            await supabase.from("bookings").update({ booking_status: "CONFIRMED" }).eq("id", bookingId);
            await supabase.from("reservations").update({ status: "CONFIRMED" }).eq("id", bookingId);

            // Update payments
            await supabase.from("payments").update({ payment_status: "PAID" }).eq("booking_id", bookingId);
            await supabase.from("payments").update({ status: "PAID" }).eq("reservation_id", bookingId);

            // Update tickets
            await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("booking_id", bookingId);
            await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("reservation_id", bookingId);

            return NextResponse.json({
                success: true,
                message: "Booking approved and ticket marked as VALID.",
                booking_id: bookingId,
                status: "PAID",
            });
        }

        if (action === "reject") {
            // Update local store immediately
            updateLocalBookingStatus(bookingId, "CANCELLED", "REJECTED");

            // Update bookings
            await supabase.from("bookings").update({ booking_status: "CANCELLED" }).eq("id", bookingId);
            await supabase.from("reservations").update({ status: "CANCELLED" }).eq("id", bookingId);

            // Update payments
            await supabase.from("payments").update({ payment_status: "REJECTED" }).eq("booking_id", bookingId);
            await supabase.from("payments").update({ status: "REJECTED" }).eq("reservation_id", bookingId);

            // Release seat in trip_seats if any
            try {
                await supabase.from("trip_seats").update({ is_available: true, booked_by_booking_id: null }).eq("booked_by_booking_id", bookingId);
            } catch {}

            return NextResponse.json({
                success: true,
                message: "Booking rejected and seat released.",
                booking_id: bookingId,
                status: "REJECTED",
            });
        }

        return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
    } catch (err: any) {
        console.error("Admin Payment Action Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
