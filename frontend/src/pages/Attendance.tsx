import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { formatDateToISO } from '../utils/date';
import { fetchAttendanceForUser, AttendanceRow } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import AttendanceCalendar from '../components/AttendanceCalendar';
import AttendanceHistoryTable from '../components/AttendanceHistoryTable';
import AttendanceSummary from '../components/AttendanceSummary';
import { LeaveRequest } from '../types';
import LeaveRequestModal from '../components/leaves/LeaveRequestModal';
import LeaveRequestList from '../components/leaves/LeaveRequestList';
import LeaveRequestDetail from '../components/leaves/LeaveRequestDetail';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [monthStart, setMonthStart] = useState<string>('');
  const [monthEnd, setMonthEnd] = useState<string>('');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(formatDateToISO(new Date()));
  const [error, setError] = useState<string | null>(null);

  // Leave Request State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [userLeaves, setUserLeaves] = useState<LeaveRequest[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    // Initialize month range
    const now = new Date();
    updateMonthRange(now.getFullYear(), now.getMonth());
  }, []);

  useEffect(() => {
    load();
    fetchMyLeaves();
  }, [monthStart, monthEnd, user]);

  const updateMonthRange = (year: number, month: number) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    setMonthStart(formatDateToISO(start));
    setMonthEnd(formatDateToISO(end));
  };

  async function load() {
    if (!user || !monthStart || !monthEnd) return;
    setError(null);
    try {
      const data = await fetchAttendanceForUser(user.id, monthStart, monthEnd);
      setRows(data || []);
    } catch (e: any) {
      console.error('Failed to load attendance', e);
      setError(e.message || "Failed to load attendance history");
      toast.error("Failed to load attendance history");
    }
  }

  const fetchMyLeaves = async () => {
    if (!user?.id) return;
    try {
      const leaves = await leaveService.fetchLeaveRequests({ employeeId: user.id });
      setUserLeaves(leaves || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const refreshData = () => {
    load();
    fetchMyLeaves();
  };

  // derive counts for dashboard if needed
  const presentCount = rows.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const absentCount = rows.filter(r => r.status === 'Absent').length;

  return (
    <div className="min-h-screen bg-[#0b0b0b] p-6 space-y-8">
      <Toaster position="top-right" />
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Attendance & Leaves</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <AttendanceSummary
          presentCount={presentCount}
          absentCount={absentCount}
        />

        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <div className="w-full lg:w-96 flex-shrink-0">
            <AttendanceCalendar
              attendanceRows={rows}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              onMonthChange={updateMonthRange}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Attendance History */}
            <div className='bg-[#1A1F2C] rounded-xl p-4 border border-gray-800'>
              <h3 className="text-gray-400 text-sm font-medium uppercase mb-4">Daily History</h3>
              <AttendanceHistoryTable
                date={selectedDate}
                rows={rows.filter(r => r.date === selectedDate)}
              />
            </div>

            {/* Leave Requests */}
            <div className='bg-[#111419] rounded-xl p-6 border border-gray-800'>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm font-medium uppercase">My Leave Requests</h3>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="flex items-center gap-2 bg-[#00E599] text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#00E599]/90 transition-colors"
                >
                  <Plus size={16} />
                  Request Leave
                </button>
              </div>
              <LeaveRequestList
                requests={userLeaves}
                onSelect={setSelectedLeave}
              />
            </div>
          </div>
        </div>

        <LeaveRequestModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onSuccess={() => { refreshData(); toast.success('Leave request submitted'); }}
        />

        {selectedLeave && (
          <LeaveRequestDetail
            request={selectedLeave}
            onClose={() => setSelectedLeave(null)}
            onUpdate={() => { refreshData(); toast.success('Request updated'); }}
          />
        )}
      </div>
    </div>
  );
}
