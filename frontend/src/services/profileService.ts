import { supabase } from '../config/supabaseClient';
import { Profile } from '../types';

// Map employee to Profile
function mapEmployeeToProfile(emp: any): Profile {
  return {
    id: emp.id,
    full_name: emp.full_name,
    email: emp.email,
    role: emp.role,
    avatar_url: null, // Employees table doesn't have avatar_url yet
    created_at: new Date().toISOString() // Mock or fetch if available
  };
}

export async function getCurrentUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching employee profile:', error.message);
      return null;
    }

    return data ? mapEmployeeToProfile(data) : null;
  } catch (err) {
    console.error('Employee fetch failed completely', err);
    return null;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return getCurrentUserProfile(userId);
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email, role');

  if (error) {
    console.error('Error fetching all employees:', error);
    return [];
  }
  return (data || []).map(mapEmployeeToProfile);
}
