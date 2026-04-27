import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Camera,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { readinessApi, securityApi, settingsApi } from '../lib/api';
import { flushAuditQueue, getPendingAuditEventCount } from '../lib/audit';
import type { AdminSettings } from '../types';
import type { BackendReadinessCheck } from '../lib/api';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Globe },
] as const;

const defaultSettings: AdminSettings = {
  profile: {
    name: 'Admin User',
    email: 'admin@towme.com',
    phone: '+233 24 123 4567',
    avatar_url: null,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    newOperators: true,
    newRequests: true,
    payments: true,
    systemAlerts: true,
  },
  system: {
    language: 'English',
    timezone: 'Africa/Accra',
    currency: 'GHS',
  },
};

export default function SettingsPage() {
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('profile');
  const { theme, toggleTheme, isDark } = useTheme();
  const { adminUser } = useAuth();

  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pendingAuditCount, setPendingAuditCount] = useState(0);

  const { data: remoteSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: settingsApi.get,
  });

  const { data: readinessChecks = [], isFetching: readinessLoading, refetch: refetchReadiness } = useQuery({
    queryKey: ['backend-readiness-checks'],
    queryFn: readinessApi.checkModules,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (remoteSettings) {
      setSettings(remoteSettings);
    }
  }, [remoteSettings]);

  useEffect(() => {
    setPendingAuditCount(getPendingAuditEventCount());
  }, []);

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<AdminSettings>) => settingsApi.update(payload),
    onSuccess: () => setSaveMessage({ type: 'success', text: 'Settings saved successfully.' }),
    onError: () => setSaveMessage({ type: 'error', text: 'Failed to save settings.' }),
  });

  const passwordMutation = useMutation({
    mutationFn: () => securityApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaveMessage({ type: 'success', text: 'Password updated successfully.' });
    },
    onError: (error: Error) => {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update password.' });
    },
  });

  const twoFactorMutation = useMutation({
    mutationFn: (enabled: boolean) => securityApi.setTwoFactorEnabled(enabled),
    onSuccess: (_, enabled) => {
      setTwoFactorEnabled(enabled);
      setSaveMessage({ type: 'success', text: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}.` });
    },
    onError: () => setSaveMessage({ type: 'error', text: 'Failed to update two-factor authentication.' }),
  });

  const flushAuditMutation = useMutation({
    mutationFn: () => flushAuditQueue(),
    onSuccess: () => {
      setPendingAuditCount(getPendingAuditEventCount());
      setSaveMessage({ type: 'success', text: 'Queued audit events synced.' });
    },
    onError: () => setSaveMessage({ type: 'error', text: 'Failed to sync queued audit events.' }),
  });

  const profileInitial = useMemo(() => settings.profile.name.charAt(0).toUpperCase(), [settings.profile.name]);

  const readinessSummary = useMemo(() => {
    const healthy = readinessChecks.filter((entry) => entry.status === 'healthy').length;
    const warning = readinessChecks.filter((entry) => entry.status === 'warning').length;
    const down = readinessChecks.filter((entry) => entry.status === 'down').length;
    return { healthy, warning, down };
  }, [readinessChecks]);

  const getReadinessStyles = (status: BackendReadinessCheck['status']) => {
    if (status === 'healthy') {
      return {
        badge: 'bg-green-100 text-green-700',
        icon: CheckCircle,
      };
    }

    if (status === 'warning') {
      return {
        badge: 'bg-yellow-100 text-yellow-700',
        icon: AlertTriangle,
      };
    }

    return {
      badge: 'bg-red-100 text-red-700',
      icon: XCircle,
    };
  };

  const saveProfile = () => {
    updateSettingsMutation.mutate({ profile: settings.profile });
  };

  const handleAvatarSelect: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveMessage({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        setSaveMessage({ type: 'error', text: 'Could not read selected image.' });
        return;
      }

      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar_url: result,
        },
      }));
      setSaveMessage({ type: 'success', text: 'Avatar updated. Save changes to persist.' });
    };

    reader.readAsDataURL(file);
  };

  const saveSystemSettings = () => {
    updateSettingsMutation.mutate({
      notifications: settings.notifications,
      system: settings.system,
    });
  };

  const updatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Please complete all password fields.' });
      return;
    }

    if (newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSaveMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    passwordMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {saveMessage && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            saveMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{saveMessage.text}</span>
            <button
              onClick={() => setSaveMessage(null)}
              className="text-xs font-medium opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center justify-between">
        <span>Pending audit sync: {pendingAuditCount}</span>
        <button
          onClick={() => flushAuditMutation.mutate()}
          disabled={flushAuditMutation.isPending || pendingAuditCount === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          Sync now
        </button>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Backend Readiness</h2>
            <p className="text-sm text-gray-500">Checks critical admin modules every 60s.</p>
          </div>
          <button
            onClick={() => refetchReadiness()}
            disabled={readinessLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', readinessLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 text-xs">
          <span className="px-2 py-1 rounded bg-green-100 text-green-700">Healthy: {readinessSummary.healthy}</span>
          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Warning: {readinessSummary.warning}</span>
          <span className="px-2 py-1 rounded bg-red-100 text-red-700">Down: {readinessSummary.down}</span>
        </div>

        {readinessChecks.length === 0 ? (
          <p className="text-sm text-gray-500">No readiness data yet.</p>
        ) : (
          <div className="space-y-2">
            {readinessChecks.map((entry) => {
              const styles = getReadinessStyles(entry.status);
              const Icon = styles.icon;

              return (
                <div key={entry.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{entry.label}</p>
                      <p className="text-xs text-gray-500 truncate">{entry.message}</p>
                    </div>
                    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium', styles.badge)}>
                      <Icon className="w-3.5 h-3.5" />
                      {entry.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                  activeTab === tab.id ? 'bg-primary-500/10 text-primary-500' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="glass-card p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading settings...</p>
            </div>
          ) : null}

          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>

              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                    {settings.profile.avatar_url ? (
                      <img src={settings.profile.avatar_url} alt={settings.profile.name} className="w-full h-full object-cover" />
                    ) : (
                      profileInitial || 'A'
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Upload avatar"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{settings.profile.name}</h3>
                  <p className="text-sm text-gray-500">{adminUser?.role || 'Super Admin'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={settings.profile.name}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, profile: { ...prev.profile, name: e.target.value } }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, profile: { ...prev.profile, email: e.target.value } }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    value={settings.profile.phone || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, profile: { ...prev.profile, phone: e.target.value } }))
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={saveProfile} className="btn-primary flex items-center gap-2" disabled={updateSettingsMutation.isPending}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>

              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-500">
                        Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            [key]: !value,
                          },
                        }))
                      }
                      className={cn('relative w-12 h-6 rounded-full transition-colors', value ? 'bg-primary-500' : 'bg-gray-300')}
                    >
                      <div
                        className={cn(
                          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                          value ? 'left-7' : 'left-1'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>

              <div>
                <p className="font-medium text-gray-900 mb-4">Theme</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => isDark && toggleTheme()}
                    className={cn('p-4 rounded-xl border-2 transition-all', !isDark ? 'border-primary-500 bg-primary-500/5' : 'border-gray-200')}
                  >
                    <div className="w-full h-20 rounded-lg bg-gray-100 mb-3 flex items-center justify-center">
                      <div className="w-3/4 h-12 bg-white rounded shadow-sm" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Light</p>
                  </button>
                  <button
                    onClick={() => !isDark && toggleTheme()}
                    className={cn('p-4 rounded-xl border-2 transition-all', isDark ? 'border-primary-500 bg-primary-500/5' : 'border-gray-200')}
                  >
                    <div className="w-full h-20 rounded-lg bg-gray-800 mb-3 flex items-center justify-center">
                      <div className="w-3/4 h-12 bg-gray-700 rounded shadow-sm" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Dark</p>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3">Current theme: {theme}</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        className="input-field"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="********"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        className="input-field"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="********"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="input-field"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="********"
                      />
                    </div>
                  </div>
                  <button onClick={updatePassword} className="btn-primary mt-4" disabled={passwordMutation.isPending}>
                    Update Password
                  </button>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account.</p>
                  <button
                    onClick={() => twoFactorMutation.mutate(!twoFactorEnabled)}
                    className={cn('btn-secondary', twoFactorEnabled && 'bg-green-100 text-green-700 border-green-200')}
                    disabled={twoFactorMutation.isPending}
                  >
                    {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    className="input-field"
                    value={settings.system.language}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, system: { ...prev.system, language: e.target.value } }))
                    }
                  >
                    <option>English</option>
                    <option>French</option>
                    <option>Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    className="input-field"
                    value={settings.system.timezone}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, system: { ...prev.system, timezone: e.target.value } }))
                    }
                  >
                    <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                    <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    className="input-field"
                    value={settings.system.currency}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, system: { ...prev.system, currency: e.target.value } }))
                    }
                  >
                    <option value="GHS">GHS - Ghana Cedi</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={saveSystemSettings} className="btn-primary flex items-center gap-2" disabled={updateSettingsMutation.isPending}>
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