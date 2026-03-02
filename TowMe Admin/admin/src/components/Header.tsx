import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  title: string;
  sidebarCollapsed: boolean;
  onMenuClick?: () => void;
}

export default function Header({ title, sidebarCollapsed, onMenuClick }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, title: 'New operator registration', message: 'John Doe has applied to become an operator', time: '5 min ago', unread: true },
    { id: 2, title: 'Tow request completed', message: 'Request #1234 has been completed', time: '15 min ago', unread: true },
    { id: 3, title: 'Payment received', message: 'GHS 150 received for request #1230', time: '1 hour ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white/90 dark:bg-dark-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-dark-700 z-30 flex items-center justify-between px-6 transition-all duration-300 shadow-sm dark:shadow-none',
        sidebarCollapsed ? 'left-20' : 'left-64'
      )}
    >
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operators, users, requests..."
            className="w-full bg-gray-100 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600 rounded-xl pl-12 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-700/50 dark:hover:bg-dark-700 text-gray-500 hover:text-gray-700 dark:text-dark-400 dark:hover:text-white transition-all"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-700/50 dark:hover:bg-dark-700 text-gray-500 hover:text-gray-700 dark:text-dark-400 dark:hover:text-white transition-all relative"
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
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <button className="text-primary-500 text-sm hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b border-gray-100 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30 cursor-pointer transition-colors',
                          notification.unread && 'bg-primary-500/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                          )}
                          <div className={cn(!notification.unread && 'pl-5')}>
                            <p className="text-gray-900 dark:text-white font-medium text-sm">{notification.title}</p>
                            <p className="text-gray-500 dark:text-dark-400 text-sm mt-0.5">{notification.message}</p>
                            <p className="text-gray-400 dark:text-dark-500 text-xs mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-dark-700">
                    <button className="w-full text-center text-primary-500 text-sm hover:underline">
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
