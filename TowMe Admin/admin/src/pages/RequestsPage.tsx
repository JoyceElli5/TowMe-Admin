import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  User,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { requestsApi } from '../lib/api';
import type { TowRequest, RequestStatus } from '../types';

type FilterStatus = 'all' | RequestStatus;

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Clock },
    accepted: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: CheckCircle },
    en_route: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: Navigation },
    arrived: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', icon: MapPin },
    in_progress: { bg: 'bg-primary-500/10', text: 'text-primary-400', icon: PlayCircle },
    completed: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
  };

  const { bg, text, icon: Icon } = config[status] || config.pending;

  const formatStatus = (s: string) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', bg, text)}>
      <Icon className="w-3.5 h-3.5" />
      {formatStatus(status)}
    </span>
  );
};

// Request detail modal
const RequestDetailModal = ({
  isOpen,
  onClose,
  request,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: TowRequest | null;
}) => {
  if (!request) return null;

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            className="relative bg-dark-800 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <div>
                <h2 className="text-xl font-semibold text-white">Request Details</h2>
                <p className="text-dark-400 text-sm">ID: {request.id}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Status</span>
                <StatusBadge status={request.status} />
              </div>

              {/* User & Operator */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-dark-400 mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Customer</span>
                  </div>
                  <p className="text-white font-medium">{request.user_name}</p>
                  <p className="text-dark-400 text-sm">{request.user_phone}</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-dark-400 mb-2">
                    <Truck className="w-4 h-4" />
                    <span className="text-sm">Operator</span>
                  </div>
                  <p className="text-white font-medium">{request.operator_name || 'Not assigned'}</p>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-3">
                <div className="bg-dark-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Pickup Location</span>
                  </div>
                  <p className="text-white">{request.pickup_location.address}</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm font-medium">Destination</span>
                  </div>
                  <p className="text-white">{request.destination.address}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                  <p className="text-dark-400 text-sm mb-1">Vehicle Type</p>
                  <p className="text-white font-semibold">{request.vehicle_type}</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                  <p className="text-dark-400 text-sm mb-1">Distance</p>
                  <p className="text-white font-semibold">{request.distance_km} km</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                  <p className="text-dark-400 text-sm mb-1">Price</p>
                  <p className="text-primary-500 font-semibold">
                    GHS {request.final_price || request.estimated_price}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-dark-700/50 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-400">Created</span>
                    <span className="text-white">{formatDateTime(request.created_at)}</span>
                  </div>
                  {request.accepted_at && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Accepted</span>
                      <span className="text-white">{formatDateTime(request.accepted_at)}</span>
                    </div>
                  )}
                  {request.started_at && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Started</span>
                      <span className="text-white">{formatDateTime(request.started_at)}</span>
                    </div>
                  )}
                  {request.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Completed</span>
                      <span className="text-white">{formatDateTime(request.completed_at)}</span>
                    </div>
                  )}
                  {request.cancelled_at && (
                    <div className="flex justify-between">
                      <span className="text-dark-400">Cancelled</span>
                      <span className="text-white">{formatDateTime(request.cancelled_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancellation Reason */}
              {request.cancellation_reason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Cancellation Reason</span>
                  </div>
                  <p className="text-red-300 text-sm">{request.cancellation_reason}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function RequestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<TowRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.getAll,
  });

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.pickup_location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    cancelled: requests.filter((r) => r.status === 'cancelled').length,
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleViewDetails = (request: TowRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
            Tow Requests
          </h1>
          <p className="text-gray-500 mt-1">View and manage all towing requests</p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">Total:</span>
            <span className="text-gray-900 font-semibold">{requests.length}</span>
          </div>
          <div className="rounded-xl px-4 py-2 bg-green-500/10 border border-green-500/20">
            <span className="text-sm text-green-600">Completed: </span>
            <span className="font-semibold text-green-600">{statusCounts.completed}</span>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              statusFilter === status
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {status === 'all' ? 'All' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-dark-900/30 text-xs">
              {statusCounts[status as keyof typeof statusCounts] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, location, or request ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No requests found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="table-header px-6 py-4">Customer</th>
                    <th className="table-header px-6 py-4">Pickup</th>
                    <th className="table-header px-6 py-4">Operator</th>
                    <th className="table-header px-6 py-4">Status</th>
                    <th className="table-header px-6 py-4">Price</th>
                    <th className="table-header px-6 py-4">Time</th>
                    <th className="table-header px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Customer */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-gray-900 font-medium">{request.user_name}</p>
                          <p className="text-gray-500 text-sm">{request.user_phone}</p>
                        </div>
                      </td>

                      {/* Pickup */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-2 max-w-[200px]">
                          <MapPin className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 text-sm truncate">
                            {request.pickup_location.address}
                          </span>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-4 px-6">
                        <span className="text-gray-600">
                          {request.operator_name || (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusBadge status={request.status} />
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6">
                        <span className="text-primary-600 font-semibold">
                          GHS {request.final_price || request.estimated_price}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-4 px-6">
                        <span className="text-gray-500 text-sm">
                          {formatTime(request.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
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
                  {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{' '}
                  {filteredRequests.length} requests
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-dark-700 text-dark-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          'w-10 h-10 rounded-lg font-medium transition-colors',
                          currentPage === pageNum
                            ? 'bg-primary-500 text-dark-900'
                            : 'bg-dark-700 text-dark-300 hover:text-white'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
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

      {/* Request Detail Modal */}
      <RequestDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </div>
  );
}
