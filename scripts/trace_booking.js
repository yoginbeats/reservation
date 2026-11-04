const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = "https://wbskcybuhanfpcbumcxa.supabase.co";
let supabaseKey = "";

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [k, ...v] = line.trim().split('=');
        if (k === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = v.join('=').trim();
        if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = v.join('=').trim();
    });
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function trace() {
    console.log("=== Querying Supabase for Bookings ===");
    
    // 1. All bookings with details
    const { data: bookings, error: bErr } = await supabase
        .from('bookings')
        .select(`
            *,
            trip:trips(*, route:routes(*, origin:terminals!routes_origin_id_fkey(name), destination:terminals!routes_destination_id_fkey(name)), bus:buses(bus_number, bus_type)),
            ticket:tickets(*),
            payment:payments(*)
        `)
        .order('created_at', { ascending: false });

    if (bErr) {
        console.error("Bookings error:", bErr);
    } else {
        console.log(`Found ${bookings.length} total bookings in DB.`);
        bookings.forEach((b, idx) => {
            console.log(`\n--- Booking #${idx + 1} ---`);
            console.log(`ID: ${b.id}`);
            console.log(`Passenger: ${b.passenger_name} (${b.passenger_contact || 'No contact'})`);
            console.log(`Seat: #${b.seat_number}`);
            console.log(`Created At (Booked On): ${b.created_at}`);
            console.log(`Source: ${b.booking_source} | Status: ${b.booking_status}`);
            console.log(`Price: ₱${b.total_price}`);
            if (b.trip) {
                console.log(`Trip Departure: ${b.trip.departure_time}`);
                console.log(`Route: ${b.trip.route?.origin?.name || b.trip.origin || 'N/A'} -> ${b.trip.route?.destination?.name || b.trip.destination || 'N/A'}`);
                console.log(`Bus: ${b.trip.bus?.bus_number || b.trip.bus_number || 'N/A'} (${b.trip.bus?.bus_type || 'N/A'})`);
            } else {
                console.log(`Trip ID: ${b.trip_id}`);
            }
            if (b.ticket) {
                const t = Array.isArray(b.ticket) ? b.ticket[0] : b.ticket;
                if (t) console.log(`Ticket QR Token: ${t.qr_token} | Ticket Status: ${t.ticket_status}`);
            }
            if (b.payment) {
                const p = Array.isArray(b.payment) ? b.payment[0] : b.payment;
                if (p) console.log(`Payment: ${p.payment_method} | Ref: ${p.transaction_ref} | Status: ${p.payment_status}`);
            }
        });
    }

    // 2. Also check PayMongo / GCash payments directly
    console.log("\n=== Checking Payments Table ===");
    const { data: payments, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

    if (!payErr && payments) {
        console.log(`Found ${payments.length} payment records:`);
        payments.forEach(p => {
            console.log(`Payment: ₱${p.amount} | Method: ${p.payment_method} | Ref: ${p.transaction_ref} | Status: ${p.payment_status} | Date: ${p.created_at}`);
        });
    }

    // 3. Check profiles / users
    console.log("\n=== Checking Recent Profiles ===");
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (!pErr && profiles) {
        console.log(`Found ${profiles.length} registered profiles:`);
        profiles.forEach(p => {
            console.log(`User: ${p.full_name || 'N/A'} | Phone: ${p.phone_number || 'N/A'} | Role: ${p.role} | Created: ${p.created_at}`);
        });
    }
}

trace().catch(console.error);
