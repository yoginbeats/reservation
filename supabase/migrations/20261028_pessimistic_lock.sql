-- ==============================================================================
-- PESSIMISTIC LOCKING TRANSACTION PROCEDURE (FOR UPDATE)
-- Prevents race conditions when two or more users attempt to book the exact same
-- seat at the exact same millisecond.
-- ==============================================================================

CREATE OR REPLACE FUNCTION book_seat_with_pessimistic_lock(
    p_trip_id UUID,
    p_seat_number INT,
    p_passenger_name TEXT,
    p_passenger_contact TEXT DEFAULT '',
    p_passenger_email TEXT DEFAULT '',
    p_total_price NUMERIC DEFAULT 850.00,
    p_gcash_ref TEXT DEFAULT '',
    p_customer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seat_record RECORD;
    v_reservation_id UUID;
    v_payment_id UUID;
    v_ticket_id UUID;
    v_qr_token TEXT;
    v_clean_ref TEXT;
BEGIN
    -- 1. PESSIMISTIC ROW-LEVEL LOCK (FOR UPDATE)
    -- Serializes concurrent requests for the exact same trip seat.
    -- If another transaction holds this lock, this query WAITS until that transaction finishes.
    SELECT is_available, booked_by_booking_id
    INTO v_seat_record
    FROM trip_seats
    WHERE trip_id = p_trip_id AND seat_number = p_seat_number
    FOR UPDATE;

    -- If the seat row exists and is already marked as taken:
    IF FOUND AND v_seat_record.is_available = FALSE THEN
        RAISE EXCEPTION 'Slot already taken: Seat #% on this trip is already reserved.', p_seat_number
            USING ERRCODE = '23505'; -- Unique violation code
    END IF;

    -- Also check active non-cancelled reservations for this seat with FOR UPDATE
    PERFORM 1
    FROM reservations
    WHERE trip_id = p_trip_id 
      AND seat_number = p_seat_number 
      AND status NOT IN ('CANCELLED', 'REJECTED')
    FOR UPDATE;

    IF FOUND THEN
        RAISE EXCEPTION 'Slot already taken: Seat #% has already been confirmed by another passenger.', p_seat_number
            USING ERRCODE = '23505';
    END IF;

    -- 2. MARK SEAT UNAVAILABLE (WITHIN THE SAME TRANSACTION)
    INSERT INTO trip_seats (trip_id, seat_number, is_available)
    VALUES (p_trip_id, p_seat_number, FALSE)
    ON CONFLICT (trip_id, seat_number)
    DO UPDATE SET is_available = FALSE;

    -- 3. INSERT RESERVATION RECORD
    INSERT INTO reservations (
        trip_id,
        customer_id,
        passenger_name,
        seat_number,
        total_price,
        status
    )
    VALUES (
        p_trip_id,
        p_customer_id,
        p_passenger_name,
        p_seat_number,
        p_total_price,
        'CONFIRMED'
    )
    RETURNING id INTO v_reservation_id;

    -- 4. INSERT PAYMENT RECORD
    v_clean_ref := COALESCE(NULLIF(TRIM(p_gcash_ref), ''), 'GCASH-DIRECT');
    INSERT INTO payments (
        reservation_id,
        amount,
        payment_method,
        status,
        transaction_id
    )
    VALUES (
        v_reservation_id,
        p_total_price,
        'GCASH_DIRECT',
        'PAID',
        v_clean_ref
    )
    RETURNING id INTO v_payment_id;

    -- 5. GENERATE QR TOKEN & TICKET
    v_qr_token := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    INSERT INTO tickets (
        reservation_id,
        qr_code
    )
    VALUES (
        v_reservation_id,
        v_qr_token
    )
    RETURNING id INTO v_ticket_id;

    -- Automatic COMMIT at function completion: all tables updated atomically!
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_reservation_id,
        'ticket_id', v_ticket_id,
        'qr_token', v_qr_token,
        'seat_number', p_seat_number,
        'total_price', p_total_price,
        'status', 'CONFIRMED'
    );

EXCEPTION
    -- Automatic ROLLBACK of all operations if any error or 'Slot already taken' occurs
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'slot_taken', (SQLSTATE = '23505' OR SQLERRM ILIKE '%Slot already taken%')
        );
END;
$$;
