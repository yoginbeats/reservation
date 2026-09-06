-- ============================================================================
-- SUPERLINES TRANSPORTATION CO. INC.
-- CENTRALIZED RESERVATION & TICKETING SYSTEM DATABASE SCHEMA
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TERMINALS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    location TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Default Terminals (Daet, PITX, Cubao)
INSERT INTO public.terminals (name, location) VALUES
('Daet', 'Daet Bus Terminal, Camarines Norte'),
('PITX', 'Parañaque Integrated Terminal Exchange, Metro Manila'),
('Cubao', 'Superlines Cubao Terminal, EDSA, Quezon City')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. USER ROLES & PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('PASSENGER', 'TELLER', 'CONDUCTOR', 'ADMIN')),
    terminal_id UUID REFERENCES public.terminals(id) ON DELETE SET NULL, -- Assigned terminal for TELLERs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. BUSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number VARCHAR(50) UNIQUE NOT NULL,
    bus_type VARCHAR(50) DEFAULT 'STANDARD' CHECK (bus_type IN ('STANDARD', 'DELUXE', 'AIRCON', 'SUPER_DELUXE')),
    seat_capacity INT DEFAULT 45 CHECK (seat_capacity > 0),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Sample Buses
INSERT INTO public.buses (bus_number, bus_type, seat_capacity) VALUES
('BUS-101', 'AIRCON', 45),
('BUS-102', 'SUPER_DELUXE', 45),
('BUS-103', 'DELUXE', 45)
ON CONFLICT (bus_number) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. ROUTES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_terminal_id UUID NOT NULL REFERENCES public.terminals(id),
    destination_terminal_id UUID NOT NULL REFERENCES public.terminals(id),
    distance_km NUMERIC(6,2),
    estimated_hours NUMERIC(4,2),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_route UNIQUE (origin_terminal_id, destination_terminal_id)
);

-- Seed Routes between Daet, PITX, Cubao
DO $$
DECLARE
    daet_id UUID;
    pitx_id UUID;
    cubao_id UUID;
BEGIN
    SELECT id INTO daet_id FROM public.terminals WHERE name = 'Daet' LIMIT 1;
    SELECT id INTO pitx_id FROM public.terminals WHERE name = 'PITX' LIMIT 1;
    SELECT id INTO cubao_id FROM public.terminals WHERE name = 'Cubao' LIMIT 1;

    IF daet_id IS NOT NULL AND cubao_id IS NOT NULL THEN
        INSERT INTO public.routes (origin_terminal_id, destination_terminal_id, distance_km, estimated_hours)
        VALUES 
        (cubao_id, daet_id, 340.00, 8.0),
        (daet_id, cubao_id, 340.00, 8.0)
        ON CONFLICT DO NOTHING;
    END IF;

    IF daet_id IS NOT NULL AND pitx_id IS NOT NULL THEN
        INSERT INTO public.routes (origin_terminal_id, destination_terminal_id, distance_km, estimated_hours)
        VALUES 
        (pitx_id, daet_id, 335.00, 7.5),
        (daet_id, pitx_id, 335.00, 7.5)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. TRIPS / SCHEDULES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES public.buses(id),
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE,
    fare_amount NUMERIC(10,2) NOT NULL DEFAULT 850.00,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. TRIP SEATS TABLE (CENTRALIZED SEAT INVENTORY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    seat_number INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    booked_by_booking_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_trip_seat UNIQUE (trip_id, seat_number)
);

-- ----------------------------------------------------------------------------
-- 7. BOOKINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for Walk-in non-registered passengers
    passenger_name VARCHAR(255) NOT NULL,
    passenger_contact VARCHAR(100),
    seat_number INT NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    booking_source VARCHAR(20) NOT NULL CHECK (booking_source IN ('ONLINE', 'WALK_IN')),
    booking_terminal_id UUID REFERENCES public.terminals(id), -- NULL for Online, Terminal ID for Walk-in
    created_by UUID REFERENCES auth.users(id), -- User who created booking (Teller ID or Passenger ID)
    booking_status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint for trip_seats.booked_by_booking_id
ALTER TABLE public.trip_seats 
ADD CONSTRAINT fk_trip_seats_booking 
FOREIGN KEY (booked_by_booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 8. PAYMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('PAYMONGO', 'CASH_WALKIN')),
    payment_status VARCHAR(20) DEFAULT 'PAID' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
    transaction_ref VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 9. TICKETS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    ticket_status VARCHAR(20) DEFAULT 'VALID' CHECK (ticket_status IN ('PENDING', 'VALID', 'USED', 'CANCELLED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 10. TICKET VERIFICATIONS (CONDUCTOR AUDIT LOG)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    conductor_id UUID NOT NULL REFERENCES auth.users(id),
    trip_id UUID NOT NULL REFERENCES public.trips(id),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'REJECTED')),
    reason TEXT
);

-- ----------------------------------------------------------------------------
-- 11. AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    record_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- ATOMIC SEAT BOOKING STORED PROCEDURE (PREVENTS DOUBLE BOOKING)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.book_seat_atomic(
    p_trip_id UUID,
    p_seat_number INT,
    p_passenger_id UUID,
    p_passenger_name VARCHAR(255),
    p_passenger_contact VARCHAR(100),
    p_total_price NUMERIC(10,2),
    p_booking_source VARCHAR(20),
    p_booking_terminal_id UUID,
    p_created_by UUID,
    p_payment_method VARCHAR(30),
    p_transaction_ref VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seat_record RECORD;
    v_booking_id UUID;
    v_payment_id UUID;
    v_ticket_id UUID;
    v_qr_token VARCHAR(255);
    v_booking_status VARCHAR(20);
    v_payment_status VARCHAR(20);
    v_ticket_status VARCHAR(20);
BEGIN
    -- Lock the seat row for update to prevent concurrent race condition
    SELECT * INTO v_seat_record
    FROM public.trip_seats
    WHERE trip_id = p_trip_id AND seat_number = p_seat_number
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Seat number % does not exist for trip %', p_seat_number, p_trip_id;
    END IF;

    IF NOT v_seat_record.is_available THEN
        RAISE EXCEPTION 'Seat % is already booked for this trip', p_seat_number;
    END IF;

    -- Set status based on payment method
    IF p_payment_method = 'CASH_WALKIN' THEN
        v_booking_status := 'CONFIRMED';
        v_payment_status := 'PAID';
        v_ticket_status := 'VALID';
    ELSE
        -- PayMongo online pending payment
        v_booking_status := 'PENDING';
        v_payment_status := 'PENDING';
        v_ticket_status := 'PENDING';
    END IF;

    -- Generate unique QR Token (e.g. TKT-TIMESTAMP-RANDOM)
    v_qr_token := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- Create Booking
    INSERT INTO public.bookings (
        trip_id, passenger_id, passenger_name, passenger_contact,
        seat_number, total_price, booking_source, booking_terminal_id,
        created_by, booking_status
    ) VALUES (
        p_trip_id, p_passenger_id, p_passenger_name, p_passenger_contact,
        p_seat_number, p_total_price, p_booking_source, p_booking_terminal_id,
        p_created_by, v_booking_status
    ) RETURNING id INTO v_booking_id;

    -- Update Seat status
    UPDATE public.trip_seats
    SET is_available = FALSE,
        booked_by_booking_id = v_booking_id
    WHERE id = v_seat_record.id;

    -- Create Payment Record
    INSERT INTO public.payments (
        booking_id, amount, payment_method, payment_status, transaction_ref
    ) VALUES (
        v_booking_id, p_total_price, p_payment_method, v_payment_status, p_transaction_ref
    ) RETURNING id INTO v_payment_id;

    -- Create Ticket Record
    INSERT INTO public.tickets (
        booking_id, qr_token, ticket_status
    ) VALUES (
        v_booking_id, v_qr_token, v_ticket_status
    ) RETURNING id INTO v_ticket_id;

    -- Record Audit Log
    INSERT INTO public.audit_logs (
        user_id, action, entity_name, record_id, details
    ) VALUES (
        p_created_by, 'CREATE_BOOKING', 'bookings', v_booking_id,
        jsonb_build_object(
            'trip_id', p_trip_id,
            'seat_number', p_seat_number,
            'booking_source', p_booking_source,
            'booking_terminal_id', p_booking_terminal_id,
            'qr_token', v_qr_token
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'ticket_id', v_ticket_id,
        'qr_token', v_qr_token,
        'booking_status', v_booking_status,
        'payment_status', v_payment_status
    );
END;
$$;

-- Function to initialize 45 seats for a new trip automatically
CREATE OR REPLACE FUNCTION public.initialize_trip_seats()
RETURNS TRIGGER AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..45 LOOP
        INSERT INTO public.trip_seats (trip_id, seat_number, is_available)
        VALUES (NEW.id, i, TRUE)
        ON CONFLICT (trip_id, seat_number) DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize seats on trip creation
DROP TRIGGER IF EXISTS trigger_initialize_trip_seats ON public.trips;
CREATE TRIGGER trigger_initialize_trip_seats
AFTER INSERT ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.initialize_trip_seats();
