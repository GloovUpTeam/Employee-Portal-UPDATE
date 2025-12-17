import { supabase } from '../config/supabaseClient';
import { LeaveRequest, LeaveRequestMessage, LeaveType } from '../types';

export interface CreateLeaveParams {
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    half_day: boolean;
    half_day_period?: 'morning' | 'afternoon';
    reason: string;
    manager_id?: string;
    attachment_urls?: any[];
}

export const leaveService = {
    // Create a new leave request using the RPC
    async createLeaveRequest(params: CreateLeaveParams) {
        const { data, error } = await supabase.rpc('create_leave_request', {
            p_leave_type: params.leave_type,
            p_start_date: params.start_date,
            p_end_date: params.end_date,
            p_half_day: params.half_day,
            p_half_day_period: params.half_day_period || null,
            p_reason: params.reason,
            p_manager_id: params.manager_id || null
        });

        if (error) throw error;
        return data; // Returns the UUID of the created request
    },

    // Fetch leave requests with optional filters
    async fetchLeaveRequests(options?: {
        employeeId?: string;
        status?: string;
    }) {
        let query = supabase
            .from('leave_requests')
            .select(`
        *,
        employee:profiles!leave_requests_employee_id_fkey(id, full_name, avatar_url, email, role),
        decision_maker:profiles!leave_requests_decision_by_fkey(id, full_name)
      `)
            .order('created_at', { ascending: false });

        if (options?.employeeId) {
            query = query.eq('employee_id', options.employeeId);
        }

        if (options?.status) {
            query = query.eq('status', options.status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as LeaveRequest[];
    },

    // Fetch single request details with messages
    async fetchLeaveRequestDetails(id: string) {
        const { data, error } = await supabase
            .from('leave_requests')
            .select(`
        *,
        employee:profiles!leave_requests_employee_id_fkey(id, full_name, avatar_url, email, role),
        decision_maker:profiles!leave_requests_decision_by_fkey(id, full_name)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as LeaveRequest;
    },

    // Update status (Admin/HR only)
    async updateLeaveStatus(requestId: string, status: string, comment: string) {
        const { error } = await supabase.rpc('update_leave_status', {
            p_request_id: requestId,
            p_status: status,
            p_comment: comment
        });

        if (error) throw error;
    },

    // Messages / Thread
    async fetchMessages(requestId: string) {
        const { data, error } = await supabase
            .from('leave_request_messages')
            .select(`
        *,
        sender:profiles(id, full_name, avatar_url)
      `)
            .eq('leave_request_id', requestId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as LeaveRequestMessage[];
    },

    async sendMessage(requestId: string, message: string) {
        const { data, error } = await supabase
            .from('leave_request_messages')
            .insert({
                leave_request_id: requestId,
                sender_id: (await supabase.auth.getUser()).data.user?.id,
                message: message
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
