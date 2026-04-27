import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

// Map routes to page titles
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/operators': 'Operator Management',
  '/users': 'User Management',
  '/requests': 'Tow Requests',
  '/pricing': 'Pricing Configuration',
  '/payments': 'Payments & Refunds',
  '/notifications': 'Notifications',
  '/support': 'Support Tickets',
  '/settings': 'Settings',
  '/audit-logs': 'Audit Logs',
};

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.98,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    } 
  }
};

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { adminUser, loading } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  // Get current page title
  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!adminUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={cn('min-h-screen bg-transparent relative transition-colors duration-300', isDark ? 'dark' : '')}>
      {/* Background light gradient + subtle noise overlay */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className={cn(
            'absolute inset-0',
            isDark
              ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800'
              : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'
          )}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Header */}
      <Header
        title={currentTitle}
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content with Page Transitions */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          'pl-20 lg:pl-64'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
