import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Ticket,
  Briefcase,
  Clock,

  DollarSign,
  MessageSquare,
  Folder,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { GloovIcon, GloovLogoFull } from './Logos';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { label: 'Projects', icon: Briefcase, path: '/projects' },
  { label: 'Tickets', icon: Ticket, path: '/tickets' },

  { label: 'Attendance', icon: Clock, path: '/attendance' },
  { label: 'Payroll', icon: DollarSign, path: '/payroll' },
  { label: 'Team Chat', icon: MessageSquare, path: '/chat' },
  { label: 'Assets', icon: Folder, path: '/files' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile overlay state
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse state
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { user, profile, signOut } = useAuth();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const handleViewAllNotifications = () => {
    setNotificationsOpen(false);
    navigate('/notifications');
  };

  const goToDashboard = () => {
    navigate('/');
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Notification Overlay for closing dropdown */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setNotificationsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 
          bg-[#111111] border-r border-[#222] 
          transition-all duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          lg:${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Sidebar Header / Logo Area */}
        <div className={`
          h-20 flex items-center flex-shrink-0 transition-all duration-300 border-b border-[#222] lg:border-none relative
          ${isCollapsed ? 'justify-center px-0' : 'justify-center px-6'}
        `}>
          <div
            onClick={goToDashboard}
            className="flex items-center justify-center w-full cursor-pointer py-4"
          >
            {/* Desktop Logic */}
            <div className="hidden lg:block">
              {isCollapsed ? (
                <GloovIcon className="h-10 w-auto mx-auto object-contain" />
              ) : (
                <GloovLogoFull className="h-8 w-auto object-contain" />
              )}
            </div>
            {/* Mobile Logic (Always show full logo in sidebar) */}
            <div className="lg:hidden">
              <GloovLogoFull className="h-8 w-auto" />
            </div>
          </div>

          <button onClick={toggleSidebar} className="lg:hidden text-gray-400 absolute right-4">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {NAV_ITEMS.filter(item => {
            if (item.label === 'Projects') {
              return profile?.role === 'admin' || profile?.role === 'manager';
            }
            return true;
          }).map((item) => {
            const isActive = location.pathname === item.path;

            // ... (rest of mapping logic)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? item.label : ''}
                aria-label={item.label}
                className={`
                  flex items-center rounded-lg transition-all duration-200 h-11 relative
                  ${isActive
                    ? 'bg-[#1DCD9C]/10 text-[#1DCD9C]'
                    : 'text-gray-400 hover:bg-[#222] hover:text-white'}
                  ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}
                `}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                  <item.icon size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </div>

                {/* Active Indicator Line for Collapsed State */}
                {isActive && isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1DCD9C] rounded-r-full" />
                )}

                {/* Badge Logic */}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <>
                    {!isCollapsed ? (
                      <span className="bg-[#1DCD9C] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {unreadCount}
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-[#1DCD9C] rounded-full border border-[#111]" />
                    )}
                  </>
                )}

                {/* Active Border for Expanded State */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1DCD9C] rounded-l-lg" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Footer */}
        <div className="p-4 border-t border-[#222]">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 mb-4 overflow-hidden">
              <img
                src={profile?.avatar_url || "https://ui-avatars.com/api/?name=" + (profile?.full_name || "User")}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-[#333] shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-[#1DCD9C] truncate">{profile?.role || 'Employee'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <img
                src={profile?.avatar_url || "https://ui-avatars.com/api/?name=" + (profile?.full_name || "User")}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-[#333]"
              />
            </div>
          )}

          <button
            onClick={handleSignOut}
            className={`w-full flex items-center text-xs text-gray-500 hover:text-red-400 transition-colors
             ${isCollapsed ? 'justify-center' : 'justify-center gap-2'}`}
          >
            <LogOut size={16} /> {!isCollapsed && "Sign Out"}
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex items-center justify-center h-10 border-t border-[#222] text-gray-500 hover:text-white hover:bg-[#222] transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-black/50 backdrop-blur-md border-b border-[#222] flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>

            {/* Header Logo (Desktop & Mobile) - Always Full Logo */}
            <button onClick={goToDashboard} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <GloovLogoFull className="h-8 w-auto" />
            </button>
          </div>

          <div className="flex items-center gap-6 ml-auto">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className={`relative transition-colors ${notificationsOpen ? 'text-[#1DCD9C]' : 'text-gray-400 hover:text-[#1DCD9C]'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1DCD9C] rounded-full border border-black flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DCD9C] opacity-75"></span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-[#333] flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-[#1DCD9C]/20 text-[#1DCD9C] px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(notification => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id)}
                          className={`p-4 border-b border-[#222] hover:bg-[#222] cursor-pointer transition-colors relative ${!notification.isRead ? 'bg-[#1DCD9C]/5' : ''
                            }`}
                        >
                          {!notification.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1DCD9C]" />
                          )}
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm ${!notification.isRead ? 'text-white font-semibold' : 'text-gray-300'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">{notification.time}</span>
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">{notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={handleViewAllNotifications}
                    className="w-full p-3 text-center text-xs text-gray-400 hover:text-white hover:bg-[#222] border-t border-[#333] transition-colors flex items-center justify-center gap-1"
                  >
                    View all notifications <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;