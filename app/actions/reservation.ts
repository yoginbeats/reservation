"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function cancelReservationAction(reservationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    // Verify ownership
    const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('id, customer_id, status')
        .eq('id', reservationId)
        .single();

    if (fetchError || !reservation) {
        return { success: false, error: "Reservation not found" };
    }

    if (reservation.customer_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    if (reservation.status === 'cancelled') {
        return { success: false, error: "Already cancelled" };
    }

    // Cancel the reservation
    const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

    if (updateError) {
        console.error("Cancellation error:", updateError);
        return { success: false, error: "Failed to cancel reservation" };
    }

    // Update associated tickets
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    await supabaseAdmin
        .from('tickets')
        .update({ status: 'cancelled' })
        .eq('reservation_id', reservationId);

    revalidatePath('/my-tickets');
    return { success: true };
}
