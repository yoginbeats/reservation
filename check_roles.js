const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkRoles() {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const admin = users.users.find(u => u.email === 'superlines@admin.com');

    console.log('Admin ID:', admin?.id);

    const { data: roles, error } = await supabaseAdmin.from('user_roles').select('*');
    if (error) {
        console.error('Error fetching user_roles:', error.message);
    } else {
        console.log('user_roles entries:', roles);
    }
}

checkRoles();
