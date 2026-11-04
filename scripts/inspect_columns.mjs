import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wbskcybuhanfpcbumcxa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indic2tjeWJ1aGFuZnBjYnVtY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTYwNzYsImV4cCI6MjA4NjkzMjA3Nn0.-fPPY9_6tbBx8Bm2VIv9qEvqZ7KFpsOOmyrJU9GK_ys";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectColumns() {
  const { data: prof, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles columns:", prof, pErr);

  const { data: pays, error: payErr } = await supabase.from('payments').select('*').limit(1);
  console.log("Payments columns:", pays, payErr);

  const { data: res, error: rErr } = await supabase.from('reservations').select('*').limit(1);
  console.log("Reservations columns:", res, rErr);

  // Check payments by transaction_id
  const { data: pMatch, error: pmErr } = await supabase.from('payments').select('*').ilike('transaction_id', '%6046447816228%');
  console.log("Payment with ref 6046447816228:", pMatch, pmErr);
}

inspectColumns();
