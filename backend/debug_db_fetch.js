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

async function listEmployees() {
    console.log("Fetching employees table...");
    const { data, error } = await supabase.from('employees').select('id, email, full_name, role, is_active');

    if (error) {
        console.error("Error fetching:", error);
    } else {
        console.log("--- EMPLOYEES TABLE ---");
        console.table(data);
        console.log("-----------------------");
    }
}

listEmployees();
