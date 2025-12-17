import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateUsers() {
    console.log("Starting migration...");

    // 1. Fetch all employees
    const { data: employees, error } = await supabase.from('employees').select('*');
    if (error) {
        console.error("Error fetching employees:", error);
        return;
    }

    console.log(`Found ${employees.length} employees.`);

    for (const emp of employees) {
        console.log(`Processing: ${emp.email}`);

        // 2. Check if user exists in Auth
        // Note: admin.listUsers isn't always reliable for checking existence by email efficiently without pagination, 
        // asking to create it and catching error is often easier, or listing all.
        // Let's try creating. If it exists, it might error, then we fetch.

        let userId = emp.user_id;

        if (!userId) {
            // Try to create user
            const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
                email: emp.email,
                password: 'password123', // Default password as we don't know the real one plaintext
                email_confirm: true,
                user_metadata: { full_name: emp.full_name, role: emp.role }
            });

            if (createError) {
                console.log(`   User might already exist (${createError.message}). Fetching by email...`);
                // Currently no direct "getUserByEmail" in admin api publicly exposed in all versions?
                // Actually listUsers with filter might work, but let's try to verify if we can get it.
                // Or we can try signIn to get the ID? No, we don't have password.
                // We'll iterate listUsers to find it (assuming small count).
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                const existing = users.find(u => u.email === emp.email);
                if (existing) {
                    userId = existing.id;
                    console.log(`   Found existing Auth UID: ${userId}`);
                } else {
                    console.error(`   Could not find or create user for ${emp.email}`);
                    continue;
                }
            } else {
                userId = createdUser.user.id;
                console.log(`   Created new Auth User: ${userId}`);
            }
        } else {
            console.log(`   Already has user_id: ${userId}`);
        }

        // 3. Update employee record
        if (userId && userId !== emp.user_id) {
            const { error: updateError } = await supabase
                .from('employees')
                .update({ user_id: userId })
                .eq('id', emp.id);

            if (updateError) {
                console.error(`   Failed to link DB: ${updateError.message}`);
            } else {
                console.log(`   ✅ Linked!`);
            }
        }
    }
}

migrateUsers();
