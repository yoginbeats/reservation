const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkBuses() {
    const { data, error } = await supabaseAdmin.from("buses").select("*");
    console.log("Buses:", data);
    console.log("Error:", error);
}

checkBuses();
