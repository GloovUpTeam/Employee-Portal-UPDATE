export interface EmployeeUser {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    due_date?: string | null;
    project_id?: string;
    project?: {
        id?: string;
        name: string;
    };
    created_at?: string;
    type?: 'Project' | 'Task' | string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date?: string | null;
    created_at?: string;
    created_by?: {
        full_name: string;
    };
    assignee?: {
        id: string;
        full_name: string;
        email: string;
    };
    client_id?: string;
    raised_by_admin_id?: string;
    assigned_employee_id?: string;
}
