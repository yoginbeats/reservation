const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTotalSeats() {
    console.log('Checking for [total_seats] column in [trips]...');

    const { error } = await supabase.from('trips').select('total_seats').limit(1);

    if (error) {
        console.log('Column [total_seats]: MISSING or ERROR - ' + error.message);
    } else {
        console.log('Column [total_seats]: EXISTS');
    }
}

checkTotalSeats();
