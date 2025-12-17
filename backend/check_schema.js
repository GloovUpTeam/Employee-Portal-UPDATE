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

async function checkSchema() {
    console.log("Checking employees table schema...");
    const { data, error } = await supabase.from('employees').select('id, email, user_id').limit(1);

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Success. Data sample:", data);
        if (data.length > 0 && data[0].hasOwnProperty('user_id')) {
            console.log("✅ Column 'user_id' exists.");
        } else {
            console.log("Column presence unclear from data (might be null).");
        }
    }
}

checkSchema();
