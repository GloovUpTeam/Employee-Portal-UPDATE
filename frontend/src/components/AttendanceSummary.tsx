import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AttendanceSummaryProps {
  presentCount: number;
  absentCount: number;
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ presentCount, absentCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Present Card */}
      <div className="bg-[#111318] p-6 rounded-xl border border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">Present days this month</p>
          <p className="text-4xl font-bold text-white">{presentCount}</p>
        </div>
        <div className="p-3 bg-[#16a34a]/10 rounded-lg">
          <CheckCircle2 className="text-[#16a34a] w-8 h-8" />
        </div>
      </div>

      {/* Absent Card */}
      <div className="bg-[#111318] p-6 rounded-xl border border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">Absent days this month</p>
          <p className="text-4xl font-bold text-white">{absentCount}</p>
        </div>
        <div className="p-3 bg-[#ef4444]/10 rounded-lg">
          <XCircle className="text-[#ef4444] w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummary;
