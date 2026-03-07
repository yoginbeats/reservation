const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    const { data, error: busError } = await supabase
        .from('buses')
        .select('*')
        .limit(1);

    if (busError) {
        console.error('Error fetching buses:', busError);
    } else {
        console.log('Buses data:', data);
    }
}

checkDatabase();
