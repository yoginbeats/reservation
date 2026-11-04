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

async function inspect() {
    console.log("=== Querying Reservations ===");
    const { data: res, error: rErr } = await supabase.from('reservations').select('*');
    if (rErr) console.error("Reservations error:", rErr);
    else {
        console.log(`Reservations count: ${res.length}`);
        console.log(JSON.stringify(res, null, 2));
    }

    console.log("\n=== Querying Tickets ===");
    const { data: tix, error: tErr } = await supabase.from('tickets').select('*');
    if (tErr) console.error("Tickets error:", tErr);
    else {
        console.log(`Tickets count: ${tix.length}`);
        console.log(JSON.stringify(tix, null, 2));
    }

    console.log("\n=== Querying Trips around Oct 2026 ===");
    const { data: trips, error: trErr } = await supabase.from('trips').select('*');
    if (trErr) console.error("Trips error:", trErr);
    else {
        console.log(`Trips count: ${trips.length}`);
        console.log(JSON.stringify(trips, null, 2));
    }
}

inspect().catch(console.error);
