import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { AttendanceRow } from '../services/attendanceService';

interface AttendanceCalendarProps {
  attendanceRows: AttendanceRow[];
  selectedDate: string;
  onSelectDate: (dateISO: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ 
  attendanceRows, 
  selectedDate, 
  onSelectDate,
  onMonthChange
}) => {
  
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      
      // Highlight selected date
      if (dateStr === selectedDate) {
        return 'bg-[#06b58b] text-white rounded-full font-bold';
      }

      const row = attendanceRows.find(r => r.date === dateStr);
      if (row) {
        if (row.status === 'Present') return 'bg-[#16a34a] text-white rounded-full';
        if (row.status === 'Late') return 'bg-[#d97706] text-white rounded-full';
        if (row.status === 'Absent') return 'bg-[#ef4444] text-white rounded-full';
      }
    }
    return null;
  };

  return (
    <div className="bg-[#111318] p-6 rounded-xl shadow-lg h-full border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-4">Calendar</h3>
      <div className="calendar-wrapper bg-white rounded-lg p-2 text-gray-900">
        <Calendar
          onChange={(value) => {
            if (value instanceof Date) {
              const dateISO = value.toISOString().split('T')[0];
              onSelectDate(dateISO);
            }
          }}
          value={new Date(selectedDate)}
          tileClassName={tileClassName}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              onMonthChange(activeStartDate.getFullYear(), activeStartDate.getMonth());
            }
          }}
        />
      </div>
      <div className="mt-4 flex gap-3 text-xs text-gray-400 justify-center flex-wrap">
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#16a34a] rounded-full"></div> Present</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#d97706] rounded-full"></div> Late</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#ef4444] rounded-full"></div> Absent</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-[#06b58b] rounded-full"></div> Selected</div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
