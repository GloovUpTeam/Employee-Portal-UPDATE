import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserLink(email) {
    console.log(`Fixing link for ${email}...`);

    // 1. Get or Create Auth User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
        console.log("User not found in Auth. Creating...");
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: 'password123',
            email_confirm: true
        });
        if (createError) {
            console.error("Failed to create user:", createError.message);
            return;
        }
        user = created.user;
    }

    console.log(`Auth User ID: ${user.id}`);

    // 2. Update Employees Table
    const { error: updateError } = await supabase
        .from('employees')
        .update({ user_id: user.id, is_active: true })
        .eq('email', email);

    if (updateError) {
        console.error("Failed to update employees table:", updateError.message);
    } else {
        console.log("✅ Successfully linked employee record to Auth User.");
    }
}

fixUserLink('gowsalya@gloovup.com');
fixUserLink('shiya_admin@gloovup.com');
