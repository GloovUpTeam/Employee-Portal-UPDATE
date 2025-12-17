import { supabase } from '../config/supabaseClient';

export async function getDashboardData(userId: string) {
  try {
    // Parallel requests for performance
    const [
      tasksAssigned,
      tasksCreated,
      tasksCompleted,
      ticketsOpen,
      attendance
    ] = await Promise.all([
      // 1. Total Tasks Assigned to Me
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assignee', userId),
      
      // 2. Total Tasks Created by Me
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('created_by', userId),

      // 3. Completed Tasks (Assigned to me)
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assignee', userId).eq('status', 'Completed'),

      // 4. Open Tickets (Client or Assignee)
      supabase.from('tickets').select('id', { count: 'exact', head: true }).or(`client_id.eq.${userId},assignee.eq.${userId}`).eq('status', 'Open'),

      // 5. Today's Attendance
      supabase.from('attendance')
        .select('status, check_in')
        .eq('user_id', userId)
        .order('check_in', { ascending: false })
        .limit(1)
    ]);

    // Check for errors
    if (tasksAssigned.error) console.error('Error fetching assigned tasks count', tasksAssigned.error);
    if (attendance.error) console.error('Error fetching attendance', attendance.error);

    return {
      my_tasks_count: tasksAssigned.count || 0,
      my_created_count: tasksCreated.count || 0,
      completed_tasks_count: tasksCompleted.count || 0,
      my_tickets_count: ticketsOpen.count || 0,
      today_attendance: attendance.data?.[0] || null,
      recentActivity: [] // Placeholder for now
    };

  } catch (err) {
    console.error('getDashboardData failed:', err);
    throw err;
  }
}

// Alias for compatibility if needed
export const fetchDashboard = getDashboardData;
