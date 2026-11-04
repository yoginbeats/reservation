import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wbskcybuhanfpcbumcxa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indic2tjeWJ1aGFuZnBjYnVtY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTYwNzYsImV4cCI6MjA4NjkzMjA3Nn0.-fPPY9_6tbBx8Bm2VIv9qEvqZ7KFpsOOmyrJU9GK_ys";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  console.log("Testing signIn or signUp to get authenticated token...");
  const testEmail = `tester${Date.now()}@gmail.com`;
  const testPassword = "Password123!";

  const { data: signUpData, error: signErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signErr) {
    console.error("SignUp error:", signErr);
    return;
  }

  const token = signUpData?.session?.access_token;
  console.log("Got access token?", Boolean(token));

  const authClient = token ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }) : supabase;

  console.log("\n--- Querying 'reservations' with auth ---");
  const { data: res, error: rErr } = await authClient.from('reservations').select('*');
  console.log("Reservations count:", res?.length, "Error:", rErr);
  if (res && res.length > 0) console.log(JSON.stringify(res, null, 2));

  console.log("\n--- Querying 'profiles' with auth ---");
  const { data: prof, error: pErr } = await authClient.from('profiles').select('*');
  console.log("Profiles count:", prof?.length, "Error:", pErr);
  if (prof && prof.length > 0) console.log(JSON.stringify(prof, null, 2));

  console.log("\n--- Querying 'payments' with auth ---");
  const { data: pay, error: payErr } = await authClient.from('payments').select('*');
  console.log("Payments count:", pay?.length, "Error:", payErr);
  if (pay && pay.length > 0) console.log(JSON.stringify(pay, null, 2));

  console.log("\n--- Querying 'tickets' with auth ---");
  const { data: tix, error: tErr } = await authClient.from('tickets').select('*');
  console.log("Tickets count:", tix?.length, "Error:", tErr);
  if (tix && tix.length > 0) console.log(JSON.stringify(tix, null, 2));
}

testAuth();
