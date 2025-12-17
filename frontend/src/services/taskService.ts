import { supabase } from '../config/supabaseClient';
import { Task } from '../types';

// STRICT: Project-Based Task Fetching

// STRICT: Project-Based Task Fetching for EMPLOYEES
// Fetches both assigned PROJECTS and TASKS within those projects
export async function fetchTasks(): Promise<Task[]> {
  try {
    // 1. Get logged-in employee ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // 2. Fetch Assigned Projects
    const projectsPromise = supabase
      .from('projects')
      .select(`
        id,
        client_name,
        budget,
        status,
        assigned_to,
        created_at
      `)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });

    // 3. Fetch Tasks by JOINING projects
    const tasksPromise = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        created_at,
        project_id,
        project:projects!inner(
          id,
          client_name,
          assigned_to
        )
      `)
      .eq('projects.assigned_to', user.id)
      .order('created_at', { ascending: false });

    const [projectsRes, tasksRes] = await Promise.all([projectsPromise, tasksPromise]);

    if (projectsRes.error) throw projectsRes.error;
    if (tasksRes.error) throw tasksRes.error;

    // 4. Map Projects to Task Interface
    const projectItems = (projectsRes.data || []).map((p: any) => ({
      id: p.id,
      title: p.client_name,
      description: 'Project', // Distinct description
      status: p.status ?? 'Pending',
      priority: 'Medium',
      due_date: null,
      project_id: p.id,
      project: { name: p.client_name },
      created_at: p.created_at,
      type: 'Project' // Explicit Type
    }));

    // 5. Map Tasks to Task Interface
    const taskItems = (tasksRes.data || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || t.project?.client_name,
      status: t.status ?? 'Pending',
      priority: t.priority || 'Medium',
      due_date: null,
      project_id: t.project_id,
      project: { name: t.project?.client_name },
      created_at: t.created_at,
      type: 'Task' // Explicit Type
    }));

    // 6. Merge and Sort by Created At (Newest first)
    const mergedList = [...projectItems, ...taskItems].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return mergedList;

  } catch (err: any) {
    console.error('fetchTasks failed:', err);
    throw err;
  }
}

// ADMIN: Fetch ALL Tasks across all projects
export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(name, assigned_employee_id)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((t: any) => ({
    ...t,
    project: Array.isArray(t.project) ? t.project[0] : t.project
  }));
}



// Fetch projects for dropdowns (Contextual based on usage, but typically for Admin or readonly list)
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .order('name');

  if (error) throw error;
  return data || [];
}

// ADMIN: Fetch All projects with assignee details
export async function fetchAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id, 
      name, 
      assigned_employee_id,
      employee:employees(full_name, email)
    `)
    .order('name');

  if (error) throw error;

  // Flatten for easier consumption if needed, or return as is
  return (data || []).map((p: any) => ({
    ...p,
    assigned_employee: Array.isArray(p.employee) ? p.employee[0] : p.employee
  }));
}

// ADMIN: Fetch available employees for assignment
export async function fetchEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, email')
    .order('full_name');

  if (error) throw error;
  return data || [];
}

// ADMIN: Assign Project
export async function assignProject(projectId: string, employeeId: string | null) {
  const { data, error } = await supabase
    .from('projects')
    .update({ assigned_employee_id: employeeId })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}


export async function createTask(task: Partial<Task>) {
  // 1. Get current user ID safely for logging/audit if needed, but RLS handles permission
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id;

  if (!uid) throw new Error('not authenticated');

  // 2. Construct payload matching DB columns exactly
  // STRICT: No assigned_employee_id. Tasks belong to Projects.
  const payload = {
    title: task.title,
    description: task.description,
    priority: task.priority || 'Medium',
    status: task.status || 'Pending',
    due_date: task.due_date || null,
    project_id: task.project_id // MANDATORY: Task must have a project
  };

  if (!payload.project_id) {
    throw new Error('Project assignment is required for creating a task.');
  }

  console.log('Creating task with payload:', payload);

  const { data, error } = await supabase
    .from('tasks')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('createTask error', error);
    throw error;
  }
  return data;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  // STRICT: Filter out any fields that shouldn't be updated directly or don't exist
  const { assignee, assigned_employee_id, project, ...dbUpdates } = updates as any;

  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(taskId: string, status: string) {
  console.log(`[taskService] Updating task ${taskId} to status: ${status}`);

  const payload = {
    status: status,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .select('id, status')
    .single();

  if (error) {
    console.error('[taskService] Update failed:', error);
    throw error;
  }

  return data;
}
