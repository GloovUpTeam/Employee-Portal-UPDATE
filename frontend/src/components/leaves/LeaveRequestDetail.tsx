import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, User, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { LeaveRequest, LeaveRequestMessage } from '../../types';
import { leaveService } from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';

interface LeaveRequestDetailProps {
    request: LeaveRequest;
    onClose: () => void;
    onUpdate: () => void;
}

const LeaveRequestDetail: React.FC<LeaveRequestDetailProps> = ({ request, onClose, onUpdate }) => {
    const { profile: userProfile } = useAuth();
    const [messages, setMessages] = useState<LeaveRequestMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [actionComment, setActionComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [showActionModal, setShowActionModal] = useState<'approved' | 'rejected' | null>(null);

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'hr';
    const isPending = request.status === 'pending';

    useEffect(() => {
        loadMessages();
    }, [request.id]);

    const loadMessages = async () => {
        try {
            const msgs = await leaveService.fetchMessages(request.id);
            setMessages(msgs);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await leaveService.sendMessage(request.id, newMessage);
            setNewMessage('');
            loadMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusUpdate = async () => {
        if (!showActionModal) return;
        setLoading(true);
        try {
            await leaveService.updateLeaveStatus(request.id, showActionModal, actionComment);
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
            <div className="bg-[#111419] border-l border-gray-800 w-full max-w-2xl h-full shadow-2xl flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-1">{request.leave_type} Request</h2>
                        <div className="text-gray-400 text-sm">
                            Submitted by <span className="text-white">{request.employee?.full_name}</span> on {new Date(request.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-6 bg-[#1A1F2C] p-4 rounded-lg border border-gray-800">
                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Dates</div>
                            <div className="text-white flex items-center gap-2">
                                <Calendar size={16} className="text-[#00E599]" />
                                {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                                {request.days_count} Days ({request.half_day ? `Half Day - ${request.half_day_period}` : 'Full Day'})
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</div>
                            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                ${request.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    request.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                {request.status}
                            </div>
                            {request.decision_by && (
                                <div className="text-xs text-gray-500 mt-1">
                                    by {request.decision_maker?.full_name}
                                </div>
                            )}
                        </div>

                        <div className="col-span-2">
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Reason</div>
                            <div className="text-gray-300 text-sm">{request.reason}</div>
                        </div>
                    </div>

                    {/* Messages / Thread */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Discussion Thread</h3>
                        <div className="space-y-4 mb-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.sender_id === userProfile?.id ? 'flex-row-reverse' : ''}`}>
                                    <img
                                        src={msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${msg.sender?.full_name}`}
                                        className="w-8 h-8 rounded-full bg-gray-700"
                                    />
                                    <div className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.sender_id === userProfile?.id ? 'bg-[#00E599] text-black' : 'bg-[#1A1F2C] text-gray-300 border border-gray-700'}`}>
                                        <div className="font-semibold mb-1 text-xs opacity-75">{msg.sender?.full_name}</div>
                                        {msg.message}
                                        <div className="text-[10px] opacity-50 mt-1 text-right">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && <div className="text-center text-gray-600 text-sm">No messages yet.</div>}
                        </div>

                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                className="w-full bg-[#0F1115] border border-gray-700 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[#00E599]"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="absolute right-2 top-2 p-1.5 bg-[#00E599] rounded-full text-black hover:bg-white transition-colors disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>

                </div>

                {/* Footer Actions (Admin Only) */}
                {isAdmin && isPending && (
                    <div className="p-6 border-t border-gray-800 bg-[#1A1F2C] flex justify-end gap-3">
                        <button
                            onClick={() => setShowActionModal('rejected')}
                            className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
                        >
                            <XCircle size={18} /> Reject
                        </button>
                        <button
                            onClick={() => setShowActionModal('approved')}
                            className="px-4 py-2 bg-[#00E599] text-black hover:bg-white rounded-md transition-colors flex items-center gap-2 font-medium"
                        >
                            <CheckCircle size={18} /> Approve
                        </button>
                    </div>
                )}

                {/* Action Confirmation Modal */}
                {showActionModal && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-10">
                        <div className="bg-[#1A1F2C] border border-gray-700 rounded-lg p-6 w-full max-w-sm">
                            <h3 className="text-lg font-semibold text-white mb-2 capitalize">
                                {showActionModal} Request
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Add an optional comment for the employee regarding this decision.
                            </p>
                            <textarea
                                className="w-full bg-[#0F1115] border border-gray-700 rounded p-3 text-sm text-white mb-4 focus:outline-none focus:border-[#00E599]"
                                rows={3}
                                placeholder="Optional comment..."
                                value={actionComment}
                                onChange={(e) => setActionComment(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowActionModal(null)}
                                    className="text-gray-400 hover:text-white text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={loading}
                                    className={`px-4 py-2 rounded text-sm font-medium ${showActionModal === 'approved' ? 'bg-[#00E599] text-black' : 'bg-red-500 text-white'}`}
                                >
                                    {loading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default LeaveRequestDetail;
