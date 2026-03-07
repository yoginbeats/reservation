const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTables() {
    // List of tables from schema.sql
    const tables = ['profiles', 'user_roles', 'buses', 'trips', 'reservations', 'tickets', 'payments'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table [${table}]: ERROR - ${error.message} (${error.code})`);
        } else {
            console.log(`Table [${table}]: OK - Data: ${JSON.stringify(data)}`);
        }
    }
}

debugTables();
