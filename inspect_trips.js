const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting [trips] table columns...');
    // We can query the rpc or just try to select bus_id specifically
    const { data, error } = await supabase.from('trips').select('bus_id').limit(1);

    if (error) {
        console.error('Error selecting bus_id:', JSON.stringify(error, null, 2));
    } else {
        console.log('bus_id column exists.');
    }

    // List all columns by selecting the first row if it exists
    const { data: allData, error: allErr } = await supabase.from('trips').select('*').limit(1);
    if (allData && allData.length > 0) {
        console.log('Columns found in first row:', Object.keys(allData[0]));
    } else {
        console.log('Table is empty, cannot infer columns from data.');
    }
}

inspectTable();
