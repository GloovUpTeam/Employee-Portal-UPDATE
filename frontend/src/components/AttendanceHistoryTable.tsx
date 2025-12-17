import React from 'react';
import { AttendanceRow } from '../services/attendanceService';

interface AttendanceHistoryTableProps {
  date: string;
  rows: AttendanceRow[];
}

const AttendanceHistoryTable: React.FC<AttendanceHistoryTableProps> = ({ date, rows }) => {
  
  const getStatusBadge = (status: string) => {
    let colorClass = 'bg-gray-700 text-gray-300';
    if (status === 'Present') colorClass = 'bg-[#16a34a] text-white';
    if (status === 'Late') colorClass = 'bg-[#16a34a] text-white'; // Treat Late as Present visually per requirements? Or keep distinct? User said "treat 'late' as Present for counts". For table, "status badge" is requested. I'll keep distinct colors but maybe green for Late too if requested, but user said "green #16a34a for Present, red #ef4444 for Absent". I'll stick to that.
    if (status === 'Absent') colorClass = 'bg-[#ef4444] text-white';
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-[#111318] rounded-xl shadow-lg overflow-hidden flex-1 border border-gray-800">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Attendance History</h3>
        <div className="text-sm text-gray-400">
          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-[#1f2933] text-xs uppercase font-medium text-gray-500">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                  No records found for this date.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#1f2933]/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    {row.date}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(row.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceHistoryTable;
