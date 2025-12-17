import React from 'react';
import { LeaveRequest, LeaveStatus } from '../../types';
import { Calendar, ChevronRight } from 'lucide-react';

interface LeaveRequestListProps {
    requests: LeaveRequest[];
    onSelect: (request: LeaveRequest) => void;
    isAdmin?: boolean;
}

const statusColors: Record<LeaveStatus, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    approved: 'text-[#00E599] bg-[#00E599]/10 border-[#00E599]/20',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
    needs_info: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    cancelled: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

const LeaveRequestList: React.FC<LeaveRequestListProps> = ({ requests, onSelect, isAdmin }) => {
    if (requests.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-[#1A1F2C] rounded-lg border border-gray-800">
                No leave requests found.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requests.map((req) => (
                <div
                    key={req.id}
                    onClick={() => onSelect(req)}
                    className="bg-[#1A1F2C] border border-gray-800 rounded-lg p-4 hover:border-[#00E599]/50 transition-colors cursor-pointer group"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                {isAdmin && (
                                    <img
                                        src={req.employee?.avatar_url || `https://ui-avatars.com/api/?name=${req.employee?.full_name}&background=random`}
                                        alt="avatar"
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                                <div>
                                    <h3 className="text-white font-medium flex items-center gap-2">
                                        {req.leave_type}
                                        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                                            {req.days_count} day{req.days_count !== 1 ? 's' : ''}
                                        </span>
                                    </h3>
                                    {isAdmin && (
                                        <div className="text-xs text-gray-400">{req.employee?.full_name}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    <span>
                                        {new Date(req.start_date).toLocaleDateString()}
                                        {req.start_date !== req.end_date && ` - ${new Date(req.end_date).toLocaleDateString()}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[req.status] || statusColors.pending} uppercase tracking-wider`}>
                                {req.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                                {new Date(req.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LeaveRequestList;
