import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Truck,
  User,
  DollarSign,
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  type: 'operator' | 'user' | 'payment' | 'request' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const demoNotifications: Notification[] = [
  {
    id: '1',
    type: 'operator',
    title: 'New Operator Registration',
    message: 'Kwame Asante has applied to become an operator. Review their documents.',
    time: '5 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'request',
    title: 'Tow Request Completed',
    message: 'Request #1234 has been successfully completed by operator John Mensah.',
    time: '15 minutes ago',
    read: false,
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    message: 'GHS 150.00 received for tow request #1230 from Ama Serwaa.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '4',
    type: 'user',
    title: 'New User Signup',
    message: 'Kofi Boateng has registered as a new user.',
    time: '2 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur on Feb 10, 2026 from 2:00 AM to 4:00 AM.',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '6',
    type: 'operator',
    title: 'Operator Document Expired',
    message: 'License for operator Yaw Frimpong will expire in 7 days.',
    time: '5 hours ago',
    read: true,
  },
  {
    id: '7',
    type: 'payment',
    title: 'Refund Processed',
    message: 'Refund of GHS 50.00 has been processed for request #1225.',
    time: '1 day ago',
    read: true,
  },
  {
    id: '8',
    type: 'request',
    title: 'Request Cancelled',
    message: 'Request #1228 was cancelled by user Akua Mensah.',
    time: '1 day ago',
    read: true,
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'operator':
      return Truck;
    case 'user':
      return User;
    case 'payment':
      return DollarSign;
    case 'request':
      return Clock;
    case 'system':
      return AlertCircle;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'operator':
      return 'bg-blue-500/10 text-blue-500';
    case 'user':
      return 'bg-green-500/10 text-green-500';
    case 'payment':
      return 'bg-primary-500/10 text-primary-500';
    case 'request':
      return 'bg-purple-500/10 text-purple-500';
    case 'system':
      return 'bg-red-500/10 text-red-500';
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(demoNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            filter === 'all'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            filter === 'unread'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'glass-card p-4 flex items-start gap-4 group',
                  !notification.read && 'ring-1 ring-primary-500/20 bg-primary-500/5'
                )}
              >
                {/* Icon */}
                <div className={cn('p-3 rounded-xl', getNotificationColor(notification.type))}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={cn(
                        'font-medium',
                        notification.read 
                          ? 'text-gray-700' 
                          : 'text-gray-900'
                      )}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.time}
                      </p>
                    </div>
                    
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
