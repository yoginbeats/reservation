const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Creating superlines@admin.com account...');
  const { data, error } = await supabase.auth.signUp({
    email: 'superlines@admin.com',
    password: 'Password123!',
    options: {
      data: {
        role: 'admin',
        first_name: 'Super',
        last_name: 'Admin'
      }
    }
  });

  if (error) {
    console.error('Error creating account:', error.message);
    if (error.message.includes('already registered')) {
        console.log('\nAccount is already registered!');
        console.log('If you forgot the password, you need to reset it in your Supabase Dashboard.');
    }
  } else {
    console.log('Success! Account created.');
    console.log('Email: superlines@admin.com');
    console.log('Password: Password123!');
    console.log('\nNOTE: If email confirmation is enabled in your Supabase project, you might need to check the email or disable "Confirm Email" in Supabase Auth settings to log in immediately.');
  }

  console.log('\nCreating branch admin accounts...');
  const branches = ['cubao', 'pitx', 'daet'];
  
  for (const branch of branches) {
      const email = `superlines${branch}@admin.com`;
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'Password123!',
        options: {
          data: {
            role: 'branch_admin',
            first_name: branch.toUpperCase(),
            last_name: 'Admin'
          }
        }
      });
      if (error && !error.message.includes('already registered')) {
          console.error(`Error creating ${email}:`, error.message);
      } else {
          console.log(`- ${email} created (Password123!)`);
      }
  }
}

main();
