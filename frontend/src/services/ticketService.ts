import { supabase } from '../config/supabaseClient';
import { Ticket } from '../types';

export async function fetchTickets(userId?: string, role?: string) {
  try {
    let query = supabase
      .from('tickets')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        created_at,
        client_id,
        raised_by_admin_id,
        assigned_employee_id,
        assignee:employees(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    // STRICT: Employee -> Fetch only assigned
    // We strictly filter by assigned_to if NOT admin.
    if (role !== 'admin' && userId) {
      console.log(`[TicketService] Filtering tickets for employee: ${userId}`);
      query = query.eq('assigned_to', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch tickets error:", error);
      throw error;
    }

    // Map to ensure array structure if needed
    const tickets = (data || []).map((t: any) => {
      const assigneeObj = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee;
      // We don't have created_by profile info easily if we dropped profiles usage, 
      // but we can try to rely on what's available or just omit it if strict rules say "No profiles".
      // For now, we focus on fixing the crash.
      return {
        ...t,
        assignee: assigneeObj
      };
    });

    return tickets as Ticket[];
  } catch (err: any) {
    console.error('Ticket fetch failed:', err);
    throw err;
  }
}

export async function createTicket({ title, description, priority, due_date, assigneeId, authUserId, client_id }: {
  title: string;
  description: string;
  priority: string;
  due_date?: string;
  assigneeId?: string;
  authUserId: string;
  client_id?: string;
}) {
  // validate before sending
  if (!title || !authUserId) throw new Error('Missing required fields');

  const payload = {
    title,
    description,
    priority,
    status: 'open',
    due_date: due_date || null,
    assignee: assigneeId || null,
    created_by: authUserId,
    client_id: client_id || null,
    // STRICT mapping
    raised_by_admin_id: authUserId,
    assigned_employee_id: assigneeId || null
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Failed to create ticket', error);
    throw error;
  }
  return data;
}

export async function fetchEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email')
    .eq('is_active', true)
    .order('full_name');

  if (error) throw error;
  return data || [];
}

// Legacy export for compatibility if needed, but prefer fetchTickets
export const getTickets = async (userId: string): Promise<Ticket[]> => {
  return fetchTickets();
};
