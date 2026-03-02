import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  User,
  Phone,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { usersApi } from '../lib/api';


export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-dark-400 mt-1">
            View and manage registered users
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-2">
            <span className="text-dark-400 text-sm">Total Users: </span>
            <span className="text-white font-semibold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">User</th>
                    <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Contact</th>
                    <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Status</th>
                    <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Total Trips</th>
                    <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Joined</th>
                    <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden flex-shrink-0">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-dark-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.full_name}</p>
                            <p className="text-dark-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-dark-300">
                          <Phone className="w-4 h-4 text-dark-400" />
                          {user.phone || 'N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {user.is_active ? (
                          <span className="flex items-center gap-1.5 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-dark-400 text-sm">
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Total Trips */}
                      <td className="py-4 px-6">
                        <span className="text-white font-medium">{user.total_trips}</span>
                        <span className="text-dark-400 text-sm"> trips</span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-6">
                        <span className="text-dark-300 text-sm">
                          {formatDate(user.created_at)}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-4 px-6">
                        <span className="text-dark-300 text-sm">
                          {formatTime(user.last_login)}
                        </span>
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
