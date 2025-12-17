import { 
    User, 
    AttendanceRecord, 
    LeaveRequest, 
    Task, 
    Ticket, 
    Notification, 
    Activity, 
    PayrollSlip, 
    FileAsset, 
    ChatMessage, 
    ProjectFolder
  } from '../types';

// This file provides fallback data for components not yet connected to Supabase
// or for testing UI without a backend connection.

export const CURRENT_USER: any = {
    id: 'u1',
    name: 'Demo User',
    role: 'Employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
};

export const TEAM_MEMBERS: User[] = [
    { id: 'u1', name: 'Demo User', role: 'Employee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', email: 'demo@example.com', status: 'active' },
    { id: 'u2', name: 'Sarah Connor', role: 'Manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', email: 'sarah@example.com', status: 'active' },
    { id: 'u3', name: 'John Smith', role: 'Admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', email: 'john@example.com', status: 'active' }
];

export const MOCK_TASKS: Task[] = [
    {
        id: 't1',
        title: 'Complete Project Documentation',
        description: 'Finalize the technical documentation for the Q4 release.',
        status: 'In Progress',
        priority: 'High',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        assigned_to: 'u1',
        created_by: 'u2'
    },
    {
        id: 't2',
        title: 'Review Pull Requests',
        description: 'Review pending PRs for the frontend repository.',
        status: 'Pending',
        priority: 'Medium',
        created_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 86400000).toISOString(),
        assigned_to: 'u1',
        created_by: 'u3'
    }
];

export const MOCK_TICKETS: Ticket[] = [
    {
        id: 'tk1',
        title: 'VPN Connection Issue',
        description: 'Unable to connect to the corporate VPN from remote location.',
        status: 'Open',
        priority: 'High',
        created_at: new Date().toISOString(),
        client_id: 'u1',
        assignee: 'u3'
    }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
    {
        id: 'a1',
        user_id: 'u1',
        date: new Date().toISOString().split('T')[0],
        check_in: '09:00:00',
        status: 'Present'
    },
    {
        id: 'a2',
        user_id: 'u1',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        check_in: '08:55:00',
        check_out: '17:05:00',
        status: 'Present'
    }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        title: 'New Task Assigned',
        message: 'Sarah Connor assigned you "Complete Project Documentation"',
        isRead: false,
        time: '2 hours ago',
        type: 'task'
    },
    {
        id: 'n2',
        title: 'Payroll Generated',
        message: 'Your payslip for November 2025 is now available.',
        isRead: true,
        time: '1 day ago',
        type: 'payroll'
    }
];

export const MOCK_FILES: FileAsset[] = [
    {
        id: 'f1',
        name: 'Project_Specs_v2.pdf',
        url: '#',
        sizeLabel: '2.4 MB',
        type: 'doc',
        uploadedAt: new Date().toISOString(),
        isNew: true
    },
    {
        id: 'f2',
        name: 'Design_Assets.zip',
        url: '#',
        sizeLabel: '156 MB',
        type: 'archive',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
        isNew: false
    }
];

export const MOCK_PROJECT_FOLDERS: ProjectFolder[] = [
    {
        id: 'pf1',
        name: 'Marketing Assets',
        fileCount: 12,
        totalSizeLabel: '450 MB'
    },
    {
        id: 'pf2',
        name: 'Development Docs',
        fileCount: 8,
        totalSizeLabel: '25 MB'
    }
];

// Empty placeholders for others
export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];
export const MOCK_ACTIVITIES: Activity[] = [];
export const MOCK_PAYROLL: PayrollSlip[] = [];
export const MOCK_PAYROLL_SLIP: any = null;
export const MOCK_CHAT: ChatMessage[] = [];
export const MOCK_RECENT_FILES: FileAsset[] = MOCK_FILES;
