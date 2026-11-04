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

async function findTables() {
    // Try querying common table names
    const candidateTables = [
        'bookings', 'reservations', 'tickets', 'payments', 'trips', 
        'daily_terminal_schedules', 'profiles', 'users', 'announcements', 
        'audit_logs', 'buses', 'routes', 'terminals', 'trip_seats'
    ];

    for (const tbl of candidateTables) {
        const { data, error } = await supabase.from(tbl).select('*').limit(5);
        if (error) {
            console.log(`Table '${tbl}': ERROR - ${error.message}`);
        } else {
            console.log(`Table '${tbl}': EXISTS (${data.length} sample rows)`);
            if (data.length > 0) {
                console.log(JSON.stringify(data[0], null, 2));
            }
        }
    }
}

findTables().catch(console.error);
