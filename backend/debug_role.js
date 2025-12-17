const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Env Variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRole(email) {
    console.log(`Checking role for ${email}...`);
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching employee:', error.message);
        return;
    }

    if (!data) {
        console.error('Employee not found!');
        return;
    }

    console.log('Employee Data:', JSON.stringify(data, null, 2));
    console.log(`Role: '${data.role}'`);
    console.log(`Is Active: ${data.is_active}`);
}

checkRole('gowsalya@gloovup.com');
