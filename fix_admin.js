const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'superlines@admin.com';
  const password = 'superlines123';

  console.log('Fetching users...');
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log(`Found existing user ${email} (ID: ${existingUser.id}). Deleting...`);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error('Error deleting user:', deleteError.message);
      return;
    }
    console.log('User deleted successfully.');
  }

  console.log(`Creating new user ${email}...`);
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      first_name: 'Super',
      last_name: 'Admin'
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('SUCCESS! Admin account created and confirmed.');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

main();
