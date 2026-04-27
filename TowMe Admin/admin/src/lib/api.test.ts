import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./backend-api', () => {
  return {
    backendApi: {
      getNotifications: vi.fn(),
      markNotificationRead: vi.fn(),
      markAllNotificationsRead: vi.fn(),
      deleteNotification: vi.fn(),
      clearNotifications: vi.fn(),
      getAdminSettings: vi.fn(),
      updateAdminSettings: vi.fn(),
      changePassword: vi.fn(),
      updateTwoFactor: vi.fn(),
      getDashboardRevenueSeries: vi.fn(),
      getAuditLogs: vi.fn(),
    },
  };
});

import { backendApi } from './backend-api';
import { notificationsApi, settingsApi, securityApi } from './api';

const mockBackend = backendApi as unknown as {
  getNotifications: ReturnType<typeof vi.fn>;
  markNotificationRead: ReturnType<typeof vi.fn>;
  markAllNotificationsRead: ReturnType<typeof vi.fn>;
  deleteNotification: ReturnType<typeof vi.fn>;
  clearNotifications: ReturnType<typeof vi.fn>;
  getAdminSettings: ReturnType<typeof vi.fn>;
  updateAdminSettings: ReturnType<typeof vi.fn>;
  changePassword: ReturnType<typeof vi.fn>;
  updateTwoFactor: ReturnType<typeof vi.fn>;
};

describe('notificationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses backend notifications when available', async () => {
    mockBackend.getNotifications.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'x-1',
          type: 'request',
          title: 'Test',
          message: 'From backend',
          target: 'all',
          is_read: false,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const result = await notificationsApi.getAll();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('x-1');
    expect(result[0].message).toBe('From backend');
  });

  it('marks a notification read through backend', async () => {
    mockBackend.markNotificationRead.mockResolvedValue({ success: true });

    await notificationsApi.markRead('x-2');

    expect(mockBackend.markNotificationRead).toHaveBeenCalledWith('x-2');
  });
});

describe('settingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns backend settings when available', async () => {
    mockBackend.getAdminSettings.mockResolvedValue({
      success: true,
      data: {
        profile: { name: 'Ops Lead', email: 'ops@towme.com', phone: '+233200000000' },
        notifications: { emailNotifications: false, pushNotifications: true },
        system: { language: 'English', timezone: 'Africa/Accra', currency: 'GHS' },
      },
    });

    const result = await settingsApi.get();

    expect(result.profile.name).toBe('Ops Lead');
    expect(result.notifications.emailNotifications).toBe(false);
  });

  it('updates settings through backend', async () => {
    mockBackend.updateAdminSettings.mockResolvedValue({ success: true });

    await settingsApi.update({ profile: { name: 'Updated Admin' } });

    expect(mockBackend.updateAdminSettings).toHaveBeenCalled();
  });
});

describe('securityApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls backend password change', async () => {
    mockBackend.changePassword.mockResolvedValue({ success: true });

    await securityApi.changePassword('old-pass-1', 'new-pass-2');

    expect(mockBackend.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass-1',
      newPassword: 'new-pass-2',
    });
  });

  it('calls backend two-factor update', async () => {
    mockBackend.updateTwoFactor.mockResolvedValue({ success: true });

    await securityApi.setTwoFactorEnabled(true);

    expect(mockBackend.updateTwoFactor).toHaveBeenCalledWith({ enabled: true });
  });
});
