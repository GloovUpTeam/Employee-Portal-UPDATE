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

async function createNewAdmin() {
    const email = 'shiya_admin@gloovup.com';
    const password = 'password123';
    const fullName = 'Shiya Admin';

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        console.log(`Creating NEW user: ${email}`);

        // Using INSERT instead of UPSERT to avoid update logic
        const { data, error } = await supabase
            .from('employees')
            .insert({
                email: email,
                password: passwordHash,
                full_name: fullName,
                role: 'admin',
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
        } else {
            console.log('✅ User created successfully!');
            console.log('User data:', data);

            // Verify immediately
            console.log('--- Verifying Password ---');
            const match = await bcrypt.compare(password, data.password);
            console.log(`Password match result: ${match}`);
        }
    } catch (err) {
        console.error('Script error:', err);
    }
}

createNewAdmin();
