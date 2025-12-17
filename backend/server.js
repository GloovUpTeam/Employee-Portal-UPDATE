import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Load environment variables from .env file in the root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

function logToFile(msg) {
  const logLine = new Date().toISOString() + ' ' + msg + '\n';
  try {
    fs.appendFileSync('server.log', logLine);
  } catch (e) {
    console.error("Failed to write to log file:", e);
  }
  // Also log to console so we can see it if possible
  console.log(msg);
}

const app = express();
const port = process.env.SERVER_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  const msg = 'CRITICAL ERROR: Missing Supabase credentials in .env';
  logToFile(msg);
  console.error(msg);
  process.exit(1);
}

// Initialize Supabase with Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// --- Custom Employee Auth API ---

// Middleware to authenticate Token - DISABLED (Public Access)
const authenticateToken = (req, res, next) => {
  // Mock User for API requests
  req.user = {
    id: 'public-id',
    role: 'admin',
    email: 'public@gloovup.com'
  };
  next();
};

app.post('/api/employee/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    logToFile(`[Login] Attempting Supabase Auth login for: ${email}`);

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      logToFile(`[Login] Supabase Auth Failed: ${authError?.message}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const userId = authData.user.id;
    logToFile(`[Login] Supabase Auth Success. User ID: ${userId}`);

    // 2. authorization Rule: User must exist in public.employees AND match user_id
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (empError || !employee) {
      logToFile(`[Login] Employee Data Not Found for User ID: ${userId}`);
      // Security: Logout the user since they are not an authorized employee
      await supabase.auth.signOut();
      return res.status(403).json({ message: "Access denied: Not an employee record found." });
    }

    // 3. active check (if column exists, otherwise skip/warn)
    if (employee.is_active === false) {
      logToFile(`[Login] Inactive employee. Access denied.`);
      await supabase.auth.signOut();
      return res.status(403).json({ message: "Account is inactive." });
    }

    logToFile(`[Login] Login authorized for: ${employee.full_name}`);

    // 4. Return Session & Employee Data
    return res.status(200).json({
      token: authData.session.access_token,
      employee: {
        id: employee.id,
        user_id: employee.user_id,
        full_name: employee.full_name,
        email: employee.email,
        role: employee.role
      }
    });

  } catch (error) {
    logToFile(`[Login] Server Exception: ${error.message}`);
    console.error("Employee login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Protected Route Example
app.get('/api/employee/me', authenticateToken, async (req, res) => {
  try {
    const { data: employee, error } = await supabase
      .from("employees")
      .select("id, user_id, full_name, email, role")
      .eq("user_id", req.user.id)
      .single();

    if (error || !employee) return res.status(404).json({ message: "User not found" });

    res.json({ employee });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(port, () => {
  const msg = `Server running on port ${port}`;
  console.log(msg);
  logToFile(msg);
});
