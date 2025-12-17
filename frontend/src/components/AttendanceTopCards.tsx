import React from 'react';
import { displayTimeFromSQL } from '../utils/date';

interface AttendanceTopCardsProps {
  currentTime: Date;
  presentCount: number;
  absentCount: number;
  onCheckIn: () => void;
  onCheckOut: () => void;
  checking: boolean;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  todayCheckIn: string | null;
  todayCheckOut: string | null;
}

const AttendanceTopCards: React.FC<AttendanceTopCardsProps> = ({
  currentTime,
  presentCount,
  absentCount,
  onCheckIn,
  onCheckOut,
  checking,
  isCheckedIn,
  isCheckedOut,
  todayCheckIn,
  todayCheckOut
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Current Time Card */}
      <div className="bg-[#111318] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-full border border-gray-800">
        <div>
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Current Time</h2>
          <div className="text-4xl font-bold tracking-tight mb-2 font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-gray-400 text-sm">
            {formatDate(currentTime)}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onCheckIn}
            disabled={isCheckedIn || checking}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2
              ${isCheckedIn
                ? 'bg-[#1f2933] text-gray-500 cursor-not-allowed' 
                : 'bg-[#06b58b] hover:bg-[#059669] text-white shadow-lg shadow-[#06b58b]/20'}`}
          >
            {checking ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              'CHECK IN'
            )}
          </button>

          <button
            onClick={onCheckOut}
            disabled={!isCheckedIn || isCheckedOut || checking}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2
              ${!isCheckedIn || isCheckedOut
                ? 'bg-[#1f2933] text-gray-500 cursor-not-allowed' 
                : 'bg-gray-700 hover:bg-gray-600 text-white shadow-lg'}`}
          >
            {checking ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              'CHECK OUT'
            )}
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-[#111318] text-white p-6 rounded-xl shadow-lg h-full flex flex-col border border-gray-800">
        <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">Today's Status</h2>
        
        <div className="flex-1 flex flex-col justify-center items-center mb-6">
          <div className={`px-4 py-2 rounded-full border font-medium text-sm
            ${isCheckedIn && !isCheckedOut ? 'bg-[#06b58b]/20 text-[#06b58b] border-[#06b58b]/30' : 
              isCheckedOut ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
              'bg-[#1f2933] text-gray-400 border-gray-700'}`}>
            {isCheckedOut ? 'Checked Out' : isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1f2933] p-3 rounded-lg border border-gray-800">
            <div className="text-xs text-gray-500 mb-1 uppercase">Check In</div>
            <div className="text-lg font-mono font-semibold text-white">
              {displayTimeFromSQL(todayCheckIn)}
            </div>
          </div>
          <div className="bg-[#1f2933] p-3 rounded-lg border border-gray-800">
            <div className="text-xs text-gray-500 mb-1 uppercase">Check Out</div>
            <div className="text-lg font-mono font-semibold text-white">
              {displayTimeFromSQL(todayCheckOut)}
            </div>
          </div>
        </div>
      </div>

      {/* Network/GPS Card (Static Mock) */}
      <div className="bg-[#111318] text-white p-6 rounded-xl shadow-lg h-full flex flex-col border border-gray-800">
        <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">Location & Network</h2>
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <div className="flex items-center gap-3 text-[#06b58b] bg-[#06b58b]/10 px-4 py-2 rounded-lg border border-[#06b58b]/20 w-full">
            <div className="w-2 h-2 bg-[#06b58b] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Office Network Verified</span>
          </div>
          <div className="flex items-center gap-3 text-[#06b58b] bg-[#06b58b]/10 px-4 py-2 rounded-lg border border-[#06b58b]/20 w-full">
            <div className="w-2 h-2 bg-[#06b58b] rounded-full"></div>
            <span className="text-sm font-medium">GPS Location Verified</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            IP: 192.168.1.104 (Internal)
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTopCards;
