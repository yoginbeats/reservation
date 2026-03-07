const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectReservations() {
    const columns = ['id', 'customer_id', 'trip_id', 'seat_number', 'passenger_name', 'passenger_type', 'total_price', 'status'];
    console.log('Checking columns for [reservations]:');

    for (const col of columns) {
        const { error } = await supabase.from('reservations').select(col).limit(1);
        if (error) {
            console.log(`[${col}]: MISSING - ${error.message}`);
        } else {
            console.log(`[${col}]: OK`);
        }
    }
}

inspectReservations();
