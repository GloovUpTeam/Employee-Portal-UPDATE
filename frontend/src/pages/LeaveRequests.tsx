import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveService } from '../services/leaveService';
import { LeaveRequest } from '../types';
import LeaveRequestList from '../components/leaves/LeaveRequestList';
import LeaveRequestDetail from '../components/leaves/LeaveRequestDetail';
import { Filter, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const LeaveRequestsPage: React.FC = () => {
    const { profile: userProfile } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (filterStatus !== 'all') filters.status = filterStatus;

            const data = await leaveService.fetchLeaveRequests(filters);
            setRequests(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load leave requests');
        } finally {
            setLoading(false);
        }
    };

    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'hr')) {
        return (
            <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-white">
                Access Denied. Only Admins and HR can view this page.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0b0b] p-6">
            <Toaster position="top-right" />
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Leave Requests</h1>
                        <p className="text-gray-400">Manage employee leave applications and approvals.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-[#1A1F2C] p-1 rounded-lg border border-gray-800">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-[#00E599] text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'pending' ? 'bg-[#00E599] text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilterStatus('approved')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'approved' ? 'bg-[#00E599] text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Approved
                        </button>
                        <button
                            onClick={() => setFilterStatus('rejected')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'rejected' ? 'bg-[#00E599] text-black' : 'text-gray-400 hover:text-white'}`}
                        >
                            Rejected
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-[#111419] rounded-xl border border-gray-800 min-h-[500px]">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading requests...</div>
                    ) : (
                        <div className="p-6">
                            <LeaveRequestList
                                requests={requests}
                                onSelect={setSelectedRequest}
                                isAdmin={true}
                            />
                        </div>
                    )}
                </div>

            </div>

            {selectedRequest && (
                <LeaveRequestDetail
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onUpdate={() => { fetchRequests(); toast.success('Updated successfully'); }}
                />
            )}
        </div>
    );
};

export default LeaveRequestsPage;
