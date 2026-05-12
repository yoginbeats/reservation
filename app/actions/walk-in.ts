"use server";

import { createClient, getRole } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createWalkInReservationAction(
    tripId: string,
    seatNumber: string,
    passengerName: string,
    passengerType: string,
    idNumber: string | null = null
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // Use admin client to bypass RLS since the admin is creating a reservation for a walk-in
    // We use the supabase client directly but we know the user is authenticated. 
    // Wait, the regular user client enforces RLS, and admin might not have insert policy for other's reservations.
    // However, if we set the customer_id to the admin's user.id, it will pass the RLS `auth.uid() = customer_id` check!
    
    // Check if the user is an admin or branch admin
    const { role } = await getRole();
        
    if (role !== 'admin' && role !== 'branch_admin') {
        return { success: false, error: "Only ticketing officers can process walk-ins" };
    }

    // 1. Fetch Trip
    const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

    if (tripError || !trip) {
        return { success: false, error: "Trip not found" };
    }

    // 2. Check if seat is taken
    const { data: existingSeat } = await supabase
        .from('reservations')
        .select('id')
        .eq('trip_id', tripId)
        .eq('seat_number', seatNumber)
        .neq('status', 'cancelled')
        .maybeSingle();

    if (existingSeat) {
        return { success: false, error: "Seat is already taken" };
    }

    // 3. Calculate Price
    let totalPrice = trip.price;
    if (passengerType === 'discounted') {
        totalPrice = trip.price * 0.8; // 20% discount
    }

    // 4. Create Reservation
    const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .insert({
            customer_id: user.id, // Walk-in tied to the admin who booked it
            trip_id: tripId,
            seat_number: seatNumber,
            passenger_name: passengerName,
            passenger_type: passengerType,
            id_number: idNumber,
            total_price: totalPrice,
            status: 'confirmed' // Auto-confirm for walk-in
        })
        .select()
        .single();

    if (resError || !reservation) {
        console.error("Reservation Error:", resError);
        return { success: false, error: "Failed to create reservation" };
    }

    // 5. Create Ticket
    const { error: ticketError } = await supabase
        .from('tickets')
        .insert({
            reservation_id: reservation.id,
            qr_code: `WALKIN-${reservation.id}`
        });

    if (ticketError) {
        console.error("Ticket Error:", ticketError);
    }

    // 6. Create Payment Record (Walk-ins usually pay at counter)
    const { error: paymentError } = await supabase
        .from('payments')
        .insert({
            reservation_id: reservation.id,
            amount: totalPrice,
            status: 'completed',
            payment_method: 'Cash (Counter)',
            transaction_id: `OTC-${Date.now()}`
        });

    if (paymentError) {
        console.error("Payment Error:", paymentError);
    }

    // Revalidate paths
    revalidatePath(`/admin/trips/${tripId}/manifest`);
    revalidatePath(`/admin/walk-in`);
    revalidatePath(`/admin/walk-in/${tripId}`);

    return { success: true, reservationId: reservation.id };
}
