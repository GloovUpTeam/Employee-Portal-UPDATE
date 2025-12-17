import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Notification } from '../types';

const Notifications: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<Notification['type'] | 'all'>('all');

  const filteredNotifications = notifications.filter(n => {
    const matchesRead = filter === 'all' ? true : !n.isRead;
    const matchesType = typeFilter === 'all' ? true : n.type === typeFilter;
    return matchesRead && matchesType;
  });

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'task': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'ticket': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'payroll': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'attendance': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const TYPES: (Notification['type'] | 'all')[] = ['all', 'task', 'ticket', 'payroll', 'attendance', 'system'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <Bell size={24} className="text-[#1DCD9C]" /> 
             Notifications
           </h2>
           <p className="text-gray-400 text-sm mt-1">Stay updated with your latest activities.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 bg-[#222] border border-gray-700 text-gray-300 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition-colors text-sm flex items-center gap-2"
          >
            <Check size={16} /> Mark all read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 border-b border-gray-800 pb-4">
        <div className="flex bg-[#222] border border-gray-700 rounded-lg p-1 self-start">
             <button 
               onClick={() => setFilter('all')}
               className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === 'all' ? 'bg-[#1DCD9C] text-black' : 'text-gray-400 hover:text-white'}`}
             >
               All
             </button>
             <button 
               onClick={() => setFilter('unread')}
               className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === 'unread' ? 'bg-[#1DCD9C] text-black' : 'text-gray-400 hover:text-white'}`}
             >
               Unread Only
             </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 mr-1">Filter by:</span>
            {TYPES.map(t => (
                <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors capitalize ${
                        typeFilter === t 
                        ? 'bg-[#222] text-white border-gray-500' 
                        : 'bg-transparent text-gray-500 border-transparent hover:bg-[#222] hover:text-gray-300'
                    }`}
                >
                    {t}
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center bg-[#222] rounded-xl border border-gray-800 border-dashed">
             <p className="text-gray-500">No notifications found matching your filters.</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`
                group relative flex gap-4 p-5 rounded-xl border transition-all cursor-pointer
                ${notification.isRead 
                  ? 'bg-[#1a1a1a] border-gray-800 hover:border-gray-700 opacity-80 hover:opacity-100' 
                  : 'bg-[#222] border-[#1DCD9C]/30 shadow-[0_0_10px_rgba(29,205,156,0.05)]'}
              `}
            >
              {!notification.isRead && (
                 <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#1DCD9C] rounded-r-full" />
              )}
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${getIconColor(notification.type)}`}>
                 <Bell size={18} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getIconColor(notification.type)}`}>
                            {notification.type}
                        </span>
                        <h4 className={`text-base ${!notification.isRead ? 'text-white font-semibold' : 'text-gray-300'}`}>
                            {notification.title}
                        </h4>
                   </div>
                   <span className="text-xs text-gray-500">{notification.time}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">{notification.message}</p>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center self-center ml-2">
                 <button 
                   onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                   className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                   title="Delete"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
