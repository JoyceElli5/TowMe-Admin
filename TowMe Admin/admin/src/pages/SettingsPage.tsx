import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Save,
  Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Globe },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { toggleTheme, isDark } = useTheme();
  const { adminUser } = useAuth();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: adminUser?.name || 'Admin User',
    email: adminUser?.email || 'admin@towme.com',
    phone: '+233 24 123 4567',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newOperators: true,
    newRequests: true,
    payments: true,
    systemAlerts: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-dark-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-500/10 text-primary-500'
                    : 'text-gray-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-2xl font-bold text-white">
                    {profileForm.name.charAt(0)}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-dark-700 rounded-full shadow-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors">
                    <Camera className="w-4 h-4 text-gray-600 dark:text-dark-300" />
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{profileForm.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-400">{adminUser?.role || 'Super Admin'}</p>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
              
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-dark-400">
                        Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [key]: !value })}
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-colors',
                        value ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                        value ? 'left-7' : 'left-1'
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
              
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-4">Theme</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => isDark && toggleTheme()}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all',
                      !isDark 
                        ? 'border-primary-500 bg-primary-500/5' 
                        : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                    )}
                  >
                    <div className="w-full h-20 rounded-lg bg-gray-100 mb-3 flex items-center justify-center">
                      <div className="w-3/4 h-12 bg-white rounded shadow-sm" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Light</p>
                  </button>
                  <button
                    onClick={() => !isDark && toggleTheme()}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all',
                      isDark 
                        ? 'border-primary-500 bg-primary-500/5' 
                        : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                    )}
                  >
                    <div className="w-full h-20 rounded-lg bg-gray-800 mb-3 flex items-center justify-center">
                      <div className="w-3/4 h-12 bg-gray-700 rounded shadow-sm" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dark</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Current Password</label>
                      <input type="password" className="input-field" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">New Password</label>
                      <input type="password" className="input-field" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Confirm New Password</label>
                      <input type="password" className="input-field" placeholder="••••••••" />
                    </div>
                  </div>
                  <button className="btn-primary mt-4">Update Password</button>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-dark-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn-secondary">Enable 2FA</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Language</label>
                  <select className="input-field">
                    <option>English</option>
                    <option>French</option>
                    <option>Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Timezone</label>
                  <select className="input-field">
                    <option>Africa/Accra (GMT+0)</option>
                    <option>Africa/Lagos (GMT+1)</option>
                    <option>Europe/London (GMT+0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Currency</label>
                  <select className="input-field">
                    <option>GHS - Ghana Cedi</option>
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
