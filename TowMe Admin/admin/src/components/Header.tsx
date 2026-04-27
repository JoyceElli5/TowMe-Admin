import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { notificationsApi } from '../lib/api';

interface HeaderProps {
  title: string;
  sidebarCollapsed: boolean;
  onMenuClick?: () => void;
}

export default function Header({ title, sidebarCollapsed: _sidebarCollapsed, onMenuClick }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: notifications = [] } = useQuery({
    queryKey: ['header-notifications'],
    queryFn: () => notificationsApi.getAll(false),
    refetchInterval: 20000,
  });

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-GB');
  };

  const handleNotificationClick = (id: string, actionUrl?: string) => {
    markOneReadMutation.mutate(id);
    if (actionUrl) {
      navigate(actionUrl);
      setShowNotifications(false);
    }
  };

  const handleSearchSubmit = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (q.includes('request')) {
      navigate('/requests');
      return;
    }
    if (q.includes('operator')) {
      navigate('/operators');
      return;
    }
    if (q.includes('user')) {
      navigate('/users');
      return;
    }
    if (q.includes('payment') || q.includes('refund')) {
      navigate('/payments');
      return;
    }
    if (q.includes('support') || q.includes('ticket')) {
      navigate('/support');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 backdrop-blur-2xl z-30 flex items-center justify-between px-4 sm:px-6 transition-all duration-300',
        isDark
          ? 'bg-slate-900/80 border-b border-slate-700'
          : 'bg-white/80 border-b border-gray-200',
        'left-20 lg:left-64'
      )}
    >
      {/* Left Side */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuClick}
          className={cn(
            'lg:hidden p-2 rounded-lg transition-colors',
            isDark
              ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
              : 'hover:bg-white/70 text-gray-500 hover:text-gray-700'
          )}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className={cn('text-xl font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{title}</h1>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            placeholder="Search operators, users, requests..."
            className={cn(
              'w-full backdrop-blur-xl border rounded-xl pl-12 pr-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all',
              isDark
                ? 'bg-slate-800/90 border-slate-700 text-slate-100'
                : 'bg-white/80 border-gray-200 text-gray-900'
            )}
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2.5 rounded-xl transition-all border',
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
              : 'bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 border-gray-200'
          )}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'p-2.5 rounded-xl transition-all relative border',
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                : 'bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 border-gray-200'
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  className={cn(
                    'absolute right-0 top-full mt-2 w-80 backdrop-blur-2xl rounded-2xl shadow-[0_22px_55px_rgba(15,23,42,0.45)] z-50 overflow-hidden border',
                    isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/90 border-white/40'
                  )}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={cn('p-4 border-b flex items-center justify-between', isDark ? 'border-slate-700' : 'border-gray-200')}>
                    <h3 className={cn('font-semibold', isDark ? 'text-slate-100' : 'text-gray-900')}>Notifications</h3>
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-primary-500 text-sm hover:underline disabled:opacity-50"
                      disabled={markAllReadMutation.isPending || notifications.length === 0}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                        className={cn(
                          'w-full text-left p-4 border-b cursor-pointer transition-colors',
                          isDark ? 'border-slate-800 hover:bg-slate-800/70' : 'border-gray-100 hover:bg-gray-50',
                          !notification.is_read && 'bg-primary-500/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                          )}
                          <div className={cn(notification.is_read && 'pl-5')}>
                            <p className={cn('font-medium text-sm', isDark ? 'text-slate-100' : 'text-gray-900')}>{notification.title}</p>
                            <p className={cn('text-sm mt-0.5', isDark ? 'text-slate-300' : 'text-gray-500')}>{notification.message}</p>
                            <p className="text-gray-400 text-xs mt-1">{formatRelativeTime(notification.created_at)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className={cn('p-3 border-t', isDark ? 'border-slate-700' : 'border-gray-200')}>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/notifications');
                      }}
                      className="w-full text-center text-primary-500 text-sm hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
