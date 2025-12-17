import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity as ActivityIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDashboardData } from '../services/dashboardService';
import { fetchTasks } from '../services/taskService';

import { countAttendanceThisMonth } from '../services/attendanceService';

type ChartPoint = { name: string; completed: number; pending: number; };

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('User');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState<boolean>(true);

  // Attendance Stats
  const [presentCount, setPresentCount] = useState(0);
  const [totalDays, setTotalDays] = useState(30);

  useEffect(() => {
    if (authLoading) {
      setDisplayName('Loading...');
      return;
    }

    // Priority: Profile Name -> User Metadata Name -> Email -> 'User'
    const name = profile?.full_name
      || user?.user_metadata?.full_name
      || user?.email?.split('@')[0]
      || 'User';

    setDisplayName(name.split(' ')[0]); // Just first name
  }, [user, profile, authLoading]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await getDashboardData(user.id);
        setDashboardData(data);

        // Fetch attendance stats
        const res = await countAttendanceThisMonth(user.id);
        setPresentCount(res.present ?? 0);
        setTotalDays(res.totalDays ?? 30);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    let mounted = true;
    async function fetchChartData() {
      if (!user) return;
      try {
        setLoadingChart(true);
        const tasks = await fetchTasks(user.id);

        // Generate last 5 days
        const days = [];
        for (let i = 4; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push(d);
        }

        const transformed: ChartPoint[] = days.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

          // Filter tasks created on this date
          const dayTasks = tasks.filter(t => t.created_at.startsWith(dateStr));

          const completed = dayTasks.filter(t => t.status === 'Completed').length;
          const pending = dayTasks.filter(t => t.status !== 'Completed').length;

          return {
            name: dayName,
            completed,
            pending
          };
        });

        if (mounted) setChartData(transformed);
      } catch (err) {
        console.error('Error loading chart data', err);
        if (mounted) setChartData([]);
      } finally {
        if (mounted) setLoadingChart(false);
      }
    }

    fetchChartData();
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DCD9C]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl inline-block">
          <AlertCircle className="mx-auto mb-2" />
          {error}
          <button onClick={() => window.location.reload()} className="block mx-auto mt-4 text-sm underline hover:text-white">Retry</button>
        </div>
      </div>
    );
  }

  const { my_tasks_count = 0, my_tickets_count = 0, today_attendance, completed_tasks_count = 0 } = dashboardData || {};
  const isPresent = !!today_attendance?.check_in;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Welcome back, {displayName}.</h2>
          <p className="text-gray-400 mt-1">Here's what's happening in your workspace today.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-2xl font-mono text-[#1DCD9C]">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Tasks Card */}
        <Link
          to="/tasks"
          className="bg-[#222] p-5 rounded-xl border border-gray-800 hover:border-[#1DCD9C]/50 transition-colors cursor-pointer group block"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm group-hover:text-white transition-colors">My Tasks</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {my_tasks_count}
          </p>
          <p className="text-xs text-gray-500 mt-1">{completed_tasks_count} completed</p>
        </Link>

        {/* Tickets Card */}
        <Link
          to="/tickets"
          className="bg-[#222] p-5 rounded-xl border border-gray-800 hover:border-[#1DCD9C]/50 transition-colors cursor-pointer group block"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm group-hover:text-white transition-colors">My Tickets</span>
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {my_tickets_count}
          </p>
          <p className="text-xs text-gray-500 mt-1">Assigned or Client</p>
        </Link>

        {/* Attendance Card */}
        <Link
          to="/attendance"
          className="bg-[#222] p-5 rounded-xl border border-gray-800 hover:border-[#1DCD9C]/50 transition-colors cursor-pointer group block"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm group-hover:text-white transition-colors">Attendance</span>
            <div className="p-2 bg-[#1DCD9C]/10 text-[#1DCD9C] rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{presentCount} / {totalDays}</p>
          <p className="text-xs text-gray-500 mt-1">{Math.round((presentCount / totalDays) * 100) || 0}% Present this month</p>
        </Link>

        {/* Productivity Card */}
        <Link
          to="/activity"
          className="bg-[#222] p-5 rounded-xl border border-gray-800 hover:border-[#1DCD9C]/50 transition-colors cursor-pointer group block"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm group-hover:text-white transition-colors">Productivity</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <ActivityIcon size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">--%</p>
          <p className="text-xs text-gray-500 mt-1">Based on tasks</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#222] p-6 rounded-xl border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-6">Work Summary</h3>
          <div style={{ minHeight: 320, width: '100%' }}>
            {loadingChart ? (
              <div className="flex items-center justify-center h-[320px] text-gray-500">
                Loading chart...
              </div>
            ) : chartData.length === 0 || chartData.every(d => d.completed === 0 && d.pending === 0) ? (
              <div className="flex flex-col items-center justify-center h-[320px] text-gray-500 border border-dashed border-gray-800 rounded-lg">
                <ActivityIcon size={32} className="mb-2 opacity-20" />
                <p>No activity data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#555" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#555" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                    cursor={{ fill: '#333' }}
                  />
                  <Bar dataKey="completed" stackId="a" fill="#1DCD9C" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="pending" stackId="a" fill="#333" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-[#222] p-6 rounded-xl border border-gray-800 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4 flex-1">
            <p className="text-gray-500 text-sm">No recent activity loaded.</p>
          </div>

          <button
            onClick={() => navigate('/activity')}
            className="w-full mt-6 py-2 text-sm text-center text-gray-400 hover:text-[#1DCD9C] border border-dashed border-gray-700 hover:border-[#1DCD9C] rounded-lg transition-colors"
          >
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
