import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyUser() {
    const email = 'gowsalya@gloovup.com';
    const password = 'password123';

    console.log(`Verifying user: ${email}`);

    const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return;
    }

    if (!employee) {
        console.error('User not found!');
        return;
    }

    console.log('User found:', employee.id);
    console.log('Hash:', employee.password);
    console.log('Is Active:', employee.is_active);

    const match = await bcrypt.compare(password, employee.password);
    console.log(`Password 'password123' match: ${match}`);
}

verifyUser();
