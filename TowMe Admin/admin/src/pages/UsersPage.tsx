import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  User,
  Phone,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  UserX,
  ShieldAlert,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { usersApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/audit';
import type { AppUser } from '../types';


export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { hasPermission, adminUser } = useAuth();
  const canModerateUsers = hasPermission('users.moderate');
  const isSuperAdmin = adminUser?.role === 'super_admin';

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const moderationMutation = useMutation({
    mutationFn: ({
      user,
      action,
      reason,
    }: {
      user: AppUser;
      action: 'soft_ban' | 'permanent_ban' | 'unblock';
      reason?: string;
    }) => usersApi.moderate(user.id, action, { reason }),
    onSuccess: async (_, variables) => {
      await logAuditEvent({
        action: `users.${variables.action}`,
        resourceType: 'app_user',
        resourceId: variables.user.id,
        before: {
          is_active: variables.user.is_active,
          moderation_status: variables.user.moderation_status,
        },
        after: {
          action: variables.action,
          reason: variables.reason,
        },
        metadata: { source: 'admin-web' },
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetAuthMutation = useMutation({
    mutationFn: (user: AppUser) => usersApi.resetAuth(user.id),
    onSuccess: async (_, user) => {
      await logAuditEvent({
        action: 'users.reset_auth',
        resourceType: 'app_user',
        resourceId: user.id,
        metadata: { source: 'admin-web' },
      });
    },
  });

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery));
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserStatusLabel = (user: AppUser) => {
    if (user.moderation_status === 'permanently_banned') {
      return { label: 'Permanently Banned', className: 'text-red-600', icon: ShieldAlert };
    }
    if (user.moderation_status === 'soft_banned' || !user.is_active) {
      return { label: 'Soft Banned', className: 'text-orange-600', icon: UserX };
    }
    return { label: 'Active', className: 'text-green-600', icon: CheckCircle };
  };

  const handleModeration = (user: AppUser, action: 'soft_ban' | 'permanent_ban' | 'unblock') => {
    if (!canModerateUsers || !usersApi.canModerate(user, action, isSuperAdmin)) {
      return;
    }

    if (action === 'unblock') {
      if (!window.confirm(`Unblock ${user.full_name}?`)) return;
      moderationMutation.mutate({ user, action });
      return;
    }

    const label = action === 'soft_ban' ? 'soft-ban' : 'permanently ban';
    if (!window.confirm(`Are you sure you want to ${label} ${user.full_name}?`)) return;
    const reason = window.prompt('Reason for moderation (optional):') || undefined;
    moderationMutation.mutate({ user, action, reason });
  };

  const handleResetAuth = (user: AppUser) => {
    if (!canModerateUsers) return;
    if (!window.confirm(`Trigger auth reset flow for ${user.full_name}?`)) return;
    resetAuthMutation.mutate(user);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="text-gray-500 mt-1">
            View and manage registered users
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">Total Users:</span>
            <span className="text-gray-900 font-semibold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="table-header px-6 py-4">User</th>
                    <th className="table-header px-6 py-4">Contact</th>
                    <th className="table-header px-6 py-4">Status</th>
                    <th className="table-header px-6 py-4">Total Trips</th>
                    <th className="table-header px-6 py-4">Joined</th>
                    <th className="table-header px-6 py-4">Last Active</th>
                    <th className="table-header px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">{user.full_name}</p>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {user.phone || 'N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {(() => {
                          const statusMeta = getUserStatusLabel(user);
                          const StatusIcon = statusMeta.icon;
                          return (
                            <span className={cn('flex items-center gap-1.5 text-sm', statusMeta.className)}>
                              <StatusIcon className="w-4 h-4" />
                              {statusMeta.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Total Trips */}
                      <td className="py-4 px-6">
                        <span className="text-gray-900 font-medium">{user.total_trips}</span>
                        <span className="text-gray-500 text-sm"> trips</span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-6">
                        <span className="text-gray-500 text-sm">
                          {formatDate(user.created_at)}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-4 px-6">
                        <span className="text-gray-500 text-sm">
                          {formatTime(user.last_login)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetAuth(user)}
                            disabled={!canModerateUsers || resetAuthMutation.isPending}
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Reset Auth Flow"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleModeration(user, 'soft_ban')}
                            disabled={!canModerateUsers || !usersApi.canModerate(user, 'soft_ban', isSuperAdmin) || moderationMutation.isPending}
                            className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Soft Ban"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleModeration(user, 'permanent_ban')}
                            disabled={!canModerateUsers || !usersApi.canModerate(user, 'permanent_ban', isSuperAdmin) || moderationMutation.isPending}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Permanent Ban"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleModeration(user, 'unblock')}
                            disabled={!canModerateUsers || !usersApi.canModerate(user, 'unblock', isSuperAdmin) || moderationMutation.isPending}
                            className="p-2 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Unblock"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-dark-700">
                <p className="text-dark-400 text-sm">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
                  {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-dark-700 text-dark-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'w-10 h-10 rounded-lg font-medium transition-colors',
                        currentPage === page
                          ? 'bg-primary-500 text-dark-900'
                          : 'bg-dark-700 text-dark-300 hover:text-white'
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-dark-700 text-dark-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
