const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Logging in to superlines@admin.com...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'superlines@admin.com',
    password: 'Password123!',
  });

  if (signInError) {
    console.error('Error logging in:', signInError.message);
    console.log('Maybe the password was already changed or the account does not exist.');
    return;
  }

  console.log('Logged in successfully. Updating password...');
  const { data, error } = await supabase.auth.updateUser({
    password: 'superlines123',
  });

  if (error) {
    console.error('Error updating password:', error.message);
  } else {
    console.log('Password successfully updated to: superlines123');
  }
}

main();
