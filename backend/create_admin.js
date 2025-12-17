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

async function createAdmin() {
    const email = 'gowsalya@gloovup.com';
    const password = 'password123';
    const fullName = 'Gowsalya Admin';

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        console.log(`Creating user: ${email}`);

        const { data, error } = await supabase
            .from('employees')
            .upsert({
                email: email,
                password: passwordHash,
                full_name: fullName,
                role: 'admin',
                is_active: true
            }, { onConflict: 'email' })
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
        } else {
            console.log('✅ User created successfully!');
            console.log(data);
        }
    } catch (err) {
        console.error('Script error:', err);
    }
}

createAdmin();
