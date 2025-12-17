import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Server, 
  Activity as ActivityIcon,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Activity as ActivityType } from '../types';
// Mock data removed

const Activity: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [activities, setActivities] = useState<ActivityType[]>([]);

  useEffect(() => {
    // TODO: Fetch real activities from backend
    setActivities([]);
    setLoading(false);
  }, []);

  // Filter and Sort Logic
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesType = filterType === 'all' || activity.type === filterType;
      const matchesSearch = 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filterType, searchQuery, activities]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getActivityIcon = (type: ActivityType['type']) => {
    switch (type) {
      case 'task': return <CheckCircle2 size={18} className="text-[#1DCD9C]" />;
      case 'ticket': return <AlertCircle size={18} className="text-orange-400" />;
      case 'attendance': return <Clock size={18} className="text-purple-400" />;
      case 'file': return <FileText size={18} className="text-blue-400" />;
      case 'system': return <Server size={18} className="text-gray-400" />;
      default: return <ActivityIcon size={18} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-800 text-gray-400';
    const s = status.toLowerCase();
    if (['completed', 'approved', 'success', 'resolved', 'present'].includes(s)) return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (['pending', 'open', 'in progress', 'ongoing'].includes(s)) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (['late', 'warning', 'critical'].includes(s)) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-gray-800 text-gray-400 border-gray-700';
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <ActivityIcon size={24} className="text-[#1DCD9C]" /> 
             Activity Log
           </h2>
           <p className="text-gray-400 text-sm mt-1">Track all system events and user actions.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#222] border border-gray-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <Filter size={16} className="text-gray-500 mr-2 shrink-0" />
            {['all', 'task', 'ticket', 'attendance', 'file', 'system'].map(type => (
               <button
                  key={type}
                  onClick={() => { setFilterType(type); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors border ${
                     filterType === type 
                     ? 'bg-[#1DCD9C]/10 text-[#1DCD9C] border-[#1DCD9C]/20' 
                     : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-200'
                  }`}
               >
                  {type}
               </button>
            ))}
         </div>

         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input 
               type="text" 
               placeholder="Search activity..." 
               value={searchQuery}
               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
               className="w-full bg-[#111] border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-[#1DCD9C] outline-none placeholder-gray-600"
            />
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-[#222] border border-gray-800 rounded-xl overflow-hidden flex flex-col relative min-h-[400px]">
         {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#222]/80 z-10">
               <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="text-[#1DCD9C] animate-spin" />
                  <p className="text-sm text-gray-500">Loading activities...</p>
               </div>
            </div>
         ) : null}

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-[#1a1a1a] border-b border-gray-800 text-xs text-gray-500 uppercase">
                     <th className="p-4 w-12 text-center">Type</th>
                     <th className="p-4">Details</th>
                     <th className="p-4 w-32">Status</th>
                     <th className="p-4 w-48 text-right">Time</th>
                  </tr>
               </thead>
               <tbody className="text-sm">
                  {paginatedActivities.length > 0 ? (
                     paginatedActivities.map((activity) => (
                        <tr key={activity.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors group">
                           <td className="p-4 text-center">
                              <div className="inline-flex items-center justify-center p-2 rounded-lg bg-[#111] border border-gray-800 group-hover:border-gray-600 transition-colors">
                                 {getActivityIcon(activity.type)}
                              </div>
                           </td>
                           <td className="p-4">
                              <p className="font-medium text-gray-200 mb-0.5">{activity.title}</p>
                              <p className="text-xs text-gray-500">{activity.description}</p>
                              {activity.userName && (
                                 <p className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                                    by <span className="text-gray-400">{activity.userName}</span>
                                 </p>
                              )}
                           </td>
                           <td className="p-4">
                              {activity.status && (
                                 <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${getStatusColor(activity.status)}`}>
                                    {activity.status}
                                 </span>
                              )}
                           </td>
                           <td className="p-4 text-right text-gray-500 font-mono text-xs">
                              {formatDateTime(activity.createdAt)}
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr>
                        <td colSpan={4} className="p-12 text-center">
                           <div className="flex flex-col items-center justify-center text-gray-500 opacity-50">
                              <ActivityIcon size={48} className="mb-2" />
                              <p>No activity found matching your filters.</p>
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
         
         {/* Footer Pagination */}
         {!loading && filteredActivities.length > 0 && (
            <div className="mt-auto p-4 border-t border-gray-800 bg-[#1a1a1a] flex justify-between items-center">
               <p className="text-xs text-gray-500">
                  Showing <span className="text-white font-mono">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-white font-mono">{Math.min(currentPage * itemsPerPage, filteredActivities.length)}</span> of <span className="text-white font-mono">{filteredActivities.length}</span> results
               </p>
               <div className="flex gap-2">
                  <button 
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1}
                     className="p-2 rounded-lg bg-[#222] border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button 
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage === totalPages}
                     className="p-2 rounded-lg bg-[#222] border border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                     <ChevronRight size={16} />
                  </button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default Activity;
