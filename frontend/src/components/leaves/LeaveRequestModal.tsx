import React, { useState } from 'react';
import { X, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { leaveService, CreateLeaveParams } from '../../services/leaveService';
import { LeaveType } from '../../types';

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateLeaveParams>({
        leave_type: 'Paid Leave',
        start_date: '',
        end_date: '',
        half_day: false,
        half_day_period: undefined,
        reason: '',
        attachment_urls: []
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.start_date || !formData.end_date) throw new Error("Dates are required");
            if (formData.end_date < formData.start_date) throw new Error("End date cannot be before start date");

            await leaveService.createLeaveRequest(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    const calculateDays = () => {
        if (!formData.start_date || !formData.end_date) return 0;
        if (formData.half_day) return 0.5;
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1A1F2C] border border-gray-800 rounded-lg w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Request Leave</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Leave Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Leave Type</label>
                        <select
                            className="w-full bg-[#0F1115] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00E599]"
                            value={formData.leave_type}
                            onChange={(e) => setFormData({ ...formData, leave_type: e.target.value as LeaveType })}
                        >
                            <option value="Paid Leave">Paid Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="Casual Leave">Casual Leave</option>
                            <option value="Unpaid Leave">Unpaid Leave</option>
                            <option value="Work From Home">Work From Home</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                            <input
                                type="date"
                                className="w-full bg-[#0F1115] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00E599]"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                            <input
                                type="date"
                                className="w-full bg-[#0F1115] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00E599]"
                                value={formData.end_date}
                                min={formData.start_date}
                                disabled={formData.half_day}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Half Day & Days Count */}
                    <div className="flex items-center justify-between bg-[#0F1115] p-3 rounded border border-gray-800">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-gray-700 bg-gray-800 text-[#00E599] focus:ring-0"
                                checked={formData.half_day}
                                onChange={(e) => {
                                    const isHalf = e.target.checked;
                                    setFormData({
                                        ...formData,
                                        half_day: isHalf,
                                        end_date: isHalf ? formData.start_date : formData.end_date,
                                        half_day_period: isHalf ? 'morning' : undefined
                                    });
                                }}
                            />
                            Half Day
                        </label>

                        {formData.half_day && (
                            <select
                                className="bg-[#1A1F2C] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                value={formData.half_day_period}
                                onChange={(e) => setFormData({ ...formData, half_day_period: e.target.value as 'morning' | 'afternoon' })}
                            >
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                            </select>
                        )}

                        <div className="text-sm font-medium text-[#00E599]">
                            {calculateDays()} Days
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Reason</label>
                        <textarea
                            className="w-full bg-[#0F1115] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#00E599] min-h-[100px]"
                            placeholder="Please provide a reason for your leave..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            required
                            minLength={10}
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#00E599] text-black font-medium px-6 py-2 rounded hover:bg-[#00E599]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default LeaveRequestModal;
