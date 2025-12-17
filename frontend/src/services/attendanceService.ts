import { supabase } from '../config/supabaseClient';
import { formatDateToISO, formatTimeToSQLTime } from '../utils/date';

export interface AttendanceRow {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  check_in: string | null; // HH:MM:SS
  check_out: string | null; // HH:MM:SS
  status: 'Present' | 'Late' | 'Absent' | 'Half Day';
  created_at: string;
}

export const getTodayRow = async (): Promise<AttendanceRow | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const today = formatDateToISO(new Date());

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.error('Error fetching today row:', error);
    return null;
  }
  return data;
};

export const checkIn = async (status: string = 'Present'): Promise<AttendanceRow> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const now = new Date();
  const today = formatDateToISO(now);
  const checkInTime = formatTimeToSQLTime(now); // HH:MM:SS

  // Check if row exists
  const existing = await getTodayRow();

  if (existing) {
    throw new Error('Already checked in for today');
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: user.id,
      date: today,
      check_in: checkInTime,
      status: status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const checkOut = async (): Promise<AttendanceRow> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const now = new Date();
  const checkOutTime = formatTimeToSQLTime(now); // HH:MM:SS

  // Check if row exists
  const existing = await getTodayRow();
  if (!existing) {
    throw new Error('Cannot check out: No check-in record found for today');
  }

  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out: checkOutTime,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchMonthAttendance = async (year: number, month: number): Promise<AttendanceRow[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Calculate start and end dates for the month
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const startDateISO = formatDateToISO(startDate);
  const endDateISO = formatDateToISO(endDate);

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDateISO)
    .lte('date', endDateISO)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export async function fetchAttendanceForUser(userId: string, monthStartISO: string, monthEndISO: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .gte('date', monthStartISO)
    .lte('date', monthEndISO)
    .order('date', { ascending: false });

  if(error) throw error;
  return data;
}

export async function createCheckIn({ userId, dateISO, sqlTime }: { userId: string, dateISO: string, sqlTime: string }){
  const payload = {
    user_id: userId,
    date: dateISO,
    check_in: sqlTime,
    status: 'Present'
  };
  const { data, error } = await supabase
    .from('attendance')
    .insert([payload])
    .select();

  if(error) throw error;
  return data;
}

export const countAttendanceThisMonth = async (userId: string): Promise<{ present: number, totalDays: number }> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { count, error } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', formatDateToISO(startOfMonth))
    .lte('date', formatDateToISO(endOfMonth))
    .eq('status', 'Present');

  if (error) {
    console.error('Error counting attendance:', error);
    return { present: 0, totalDays: endOfMonth.getDate() };
  }
  return { present: count || 0, totalDays: endOfMonth.getDate() };
};
