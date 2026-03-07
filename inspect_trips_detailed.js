const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    const columns = ['id', 'origin', 'destination', 'bus_id', 'departure_time', 'price'];
    console.log('Checking columns for [trips]:');

    for (const col of columns) {
        const { error } = await supabase.from('trips').select(col).limit(1);
        if (error) {
            console.log(`[${col}]: MISSING - ${error.message}`);
        } else {
            console.log(`[${col}]: OK`);
        }
    }
}

inspectTable();
