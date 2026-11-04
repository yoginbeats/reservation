import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wbskcybuhanfpcbumcxa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indic2tjeWJ1aGFuZnBjYnVtY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTYwNzYsImV4cCI6MjA4NjkzMjA3Nn0.-fPPY9_6tbBx8Bm2VIv9qEvqZ7KFpsOOmyrJU9GK_ys";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function search() {
  console.log("=== Searching Supabase for Mary Jane Terco / 09279432311 / 6046447816228 ===");

  // 1. Check profiles
  const { data: profs, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .or('full_name.ilike.%Mary%,full_name.ilike.%Terco%,phone_number.ilike.%9279432311%');
  console.log("Profiles match:", profs?.length || 0, profs || pErr);

  // 2. Check reservations
  const { data: res, error: rErr } = await supabase
    .from('reservations')
    .select('*')
    .or('passenger_name.ilike.%Mary%,passenger_name.ilike.%Terco%');
  console.log("Reservations match:", res?.length || 0, res || rErr);

  // 3. Check payments
  const { data: pays, error: payErr } = await supabase
    .from('payments')
    .select('*')
    .or('transaction_ref.ilike.%6046447816228%,transaction_id.ilike.%6046447816228%');
  console.log("Payments match:", pays?.length || 0, pays || payErr);

  // 4. Check October 25 trips
  const { data: oct25Trips, error: tripErr } = await supabase
    .from('trips')
    .select('*')
    .gte('departure_time', '2026-10-25T00:00:00')
    .lte('departure_time', '2026-10-25T23:59:59');
  console.log("October 25 trips count:", oct25Trips?.length || 0);
  if (oct25Trips && oct25Trips.length > 0) {
    console.log("Sample Oct 25 trips:", JSON.stringify(oct25Trips.slice(0, 5), null, 2));
  }
}

search();
