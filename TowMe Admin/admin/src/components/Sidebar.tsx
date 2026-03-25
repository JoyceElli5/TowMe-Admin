
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardSquare01Icon,
  UserAccountIcon,
  Car01Icon,
  Location01Icon,
  MoneySend01Icon,
  Notification01Icon,
  Settings01Icon,
  Logout01Icon,
  Shield01Icon,
  Message01Icon,
  GiftCardIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from 'hugeicons-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import type { AdminPermission } from '../lib/rbac';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: DashboardSquare01Icon, label: 'Dashboard', path: '/dashboard', permission: 'dashboard.view' as AdminPermission },
  { icon: Car01Icon, label: 'Operators', path: '/operators', permission: 'operators.view' as AdminPermission },
  { icon: UserAccountIcon, label: 'Users', path: '/users', permission: 'users.view' as AdminPermission },
  { icon: Location01Icon, label: 'Requests', path: '/requests', permission: 'requests.view' as AdminPermission },
  { icon: MoneySend01Icon, label: 'Pricing', path: '/pricing', permission: 'pricing.view' as AdminPermission },
  { icon: GiftCardIcon, label: 'Payments', path: '/payments', permission: 'finance.view' as AdminPermission },
  { icon: Notification01Icon, label: 'Notifications', path: '/notifications', permission: 'notifications.view' as AdminPermission },
  { icon: Message01Icon, label: 'Support', path: '/support', permission: 'support.view' as AdminPermission },
];

const bottomItems = [
  { icon: Settings01Icon, label: 'Settings', path: '/settings', permission: 'settings.view' as AdminPermission },
];

// Navigation item animation variants
const navItemVariants = {
  initial: { x: -10, opacity: 0 },
  animate: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' }
  }),
  hover: { x: 5, transition: { duration: 0.2 } }
};

const labelVariants = {
  hidden: { opacity: 0, width: 0 },
  visible: { opacity: 1, width: 'auto', transition: { duration: 0.2 } }
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { adminUser, signOut, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-primary-500/20 text-primary-600';
      case 'operator_manager':
        return 'bg-blue-500/20 text-blue-600';
      case 'support_staff':
        return 'bg-green-500/20 text-green-600';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300',
        'bg-white/90 backdrop-blur-2xl border-r border-gray-200',
        collapsed ? 'w-20' : 'w-64'
      )}
      initial={false}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/40 relative">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Car01Icon className="w-6 h-6 text-white" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="text-xl font-bold text-gray-900"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                Tow<span className="text-primary-500">Me</span>
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
        <motion.button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/70 text-gray-400 hover:text-gray-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {collapsed ? (
            <ArrowRight01Icon className="w-5 h-5" />
          ) : (
            <ArrowLeft01Icon className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative">
        {menuItems.filter((item) => hasPermission(item.permission)).map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <motion.div
              key={item.path}
              custom={index}
              variants={navItemVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <NavLink
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group',
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {/* Active background with glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-primary-50 rounded-xl border border-primary-100"
                    layoutId="activeNavBg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full"
                    layoutId="activeNavIndicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Hover glow effect */}
                <div className={cn(
                  'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                  !isActive && 'bg-gray-50 border border-gray-200'
                )} />
                
                <motion.div
                  className="relative z-10"
                  whileHover={{ rotate: isActive ? 0 : 5 }}
                >
                  <item.icon className={cn(
                    'w-5 h-5 flex-shrink-0 transition-all duration-300',
                    isActive && 'drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]'
                  )} />
                </motion.div>
                
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="font-medium relative z-10"
                      variants={labelVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 space-y-1 relative">
        {bottomItems.filter((item) => hasPermission(item.permission)).map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <motion.div
              key={item.path}
              whileHover={{ x: 5 }}
            >
              <NavLink
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative',
                  isActive
                    ? 'bg-primary-500/10 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span 
                      className="font-medium"
                      variants={labelVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          );
        })}

        <motion.button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 w-full group"
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div whileHover={{ rotate: -10 }}>
            <Logout01Icon className="w-5 h-5 flex-shrink-0" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                className="font-medium"
                variants={labelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* User Profile */}
      {adminUser && (
        <motion.div 
          className="p-4 border-t border-gray-200 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-primary-500/20"
              whileHover={{ scale: 1.1 }}
            >
              {adminUser.avatar_url ? (
                <img
                  src={adminUser.avatar_url}
                  alt={adminUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Shield01Icon className="w-5 h-5 text-primary-500" />
              )}
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <p className="text-gray-900 font-medium truncate">
                    {adminUser.name}
                  </p>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full inline-block mt-1',
                    getRoleBadgeColor(adminUser.role)
                  )}>
                    {formatRole(adminUser.role)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}
