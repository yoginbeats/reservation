const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listColumns() {
    console.log('Listing all columns for [trips] table via rpc or introspection...');

    // Attempting to select a variety of potential names to see what fails/succeeds
    const { data, error } = await supabase.from('trips').select('*').limit(1);

    if (error) {
        console.error('Error fetching trips:', JSON.stringify(error, null, 2));
    } else {
        if (data && data.length > 0) {
            console.log('Actual columns in DB:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Trying to force a specific select...');
            const { error: err2 } = await supabase.from('trips').select('bus_number').limit(1);
            if (err2) {
                console.log('Column [bus_number] DOES NOT exist (Error: ' + err2.message + ')');
            } else {
                console.log('Column [bus_number] EXISTS and is likely required.');
            }
        }
    }
}

listColumns();
