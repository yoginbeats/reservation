const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing trip insertion without bus_id...');
    const { data, error } = await supabase
        .from('trips')
        .insert([{
            origin: 'PITX',
            destination: 'Daet',
            departure_time: new Date().toISOString(),
            price: 650.00
            // bus_id is null
        }])
        .select();

    if (error) {
        console.error('Error inserting trip:', error.message, error.code);
    } else {
        console.log('Trip inserted successfully:', data);
    }
}

testInsert();
