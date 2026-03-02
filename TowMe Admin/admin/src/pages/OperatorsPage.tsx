import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Phone,
  Star,
  Truck,
  FileText,
  X,
  AlertTriangle,
  User,
  Calendar,
  Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { operatorsApi } from '../lib/api';
import type { Operator } from '../types';

type OperatorStatus = 'all' | 'pending' | 'approved' | 'rejected';

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Clock },
    approved: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
    suspended: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: AlertTriangle },
  }[status] || { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: Clock };

  const Icon = config.icon;

  return (
    <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.bg, config.text)}>
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Document viewer modal
const DocumentModal = ({
  isOpen,
  onClose,
  operator,
}: {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator | null;
}) => {
  const [activeDoc, setActiveDoc] = useState<string>('ghana_card');

  if (!operator) return null;

  const documents = [
    { key: 'ghana_card', label: 'Ghana Card', url: operator.ghana_card_url },
    { key: 'drivers_license', label: "Driver's License", url: operator.drivers_license_url },
    { key: 'vehicle_registration', label: 'Vehicle Registration', url: operator.vehicle_registration_url },
    { key: 'insurance', label: 'Insurance', url: operator.insurance_url },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative bg-dark-800 rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden shadow-xl"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-dark-700 overflow-hidden">
                  {operator.profile_photo_url ? (
                    <img src={operator.profile_photo_url} alt={operator.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-dark-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{operator.full_name}</h2>
                  <p className="text-dark-400 text-sm">{operator.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Operator Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-dark-400 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <p className="text-white font-medium">{operator.phone}</p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-dark-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Registered</span>
                  </div>
                  <p className="text-white font-medium">
                    {new Date(operator.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-dark-400 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <StatusBadge status={operator.status} />
                </div>
              </div>

              {/* Document Tabs */}
              <div className="flex gap-2 mb-4 border-b border-dark-700 pb-4">
                {documents.map((doc) => (
                  <button
                    key={doc.key}
                    onClick={() => setActiveDoc(doc.key)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeDoc === doc.key
                        ? 'bg-primary-500 text-dark-900'
                        : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                    )}
                  >
                    {doc.label}
                  </button>
                ))}
              </div>

              {/* Document Viewer */}
              <div className="bg-dark-700 rounded-xl h-80 flex items-center justify-center">
                {documents.find((d) => d.key === activeDoc)?.url ? (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                    <p className="text-dark-400 mb-2">Document: {documents.find((d) => d.key === activeDoc)?.label}</p>
                    <p className="text-primary-500 text-sm">
                      {documents.find((d) => d.key === activeDoc)?.url}
                    </p>
                    <p className="text-dark-500 text-xs mt-2">
                      (In production, this would display the actual document image)
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                    <p className="text-dark-400">No document uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Approval confirmation modal
const ApprovalModal = ({
  isOpen,
  onClose,
  operator,
  action,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator | null;
  action: 'approve' | 'reject';
  onConfirm: () => void;
  isLoading: boolean;
}) => {
  if (!operator) return null;

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
            className="relative bg-dark-800 rounded-2xl w-full max-w-md mx-4 p-6"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              action === 'approve' ? 'bg-green-500/20' : 'bg-red-500/20'
            )}>
              {action === 'approve' ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-white text-center mb-2">
              {action === 'approve' ? 'Approve Operator' : 'Reject Operator'}
            </h3>
            <p className="text-dark-400 text-center mb-6">
              Are you sure you want to {action} <span className="text-white font-medium">{operator.full_name}</span>?
              {action === 'approve'
                ? ' They will be able to receive tow requests.'
                : ' Their application will be rejected.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-dark-700 text-white font-medium hover:bg-dark-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50',
                  action === 'approve'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                )}
              >
                {isLoading ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function OperatorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OperatorStatus>('all');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  const queryClient = useQueryClient();

  // Fetch operators
  const { data: operators = [], isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: operatorsApi.getAll,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      operatorsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      setIsApprovalModalOpen(false);
      setSelectedOperator(null);
    },
  });

  // Filter operators
  const filteredOperators = operators.filter((operator) => {
    const matchesSearch =
      operator.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || operator.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle approve/reject
  const handleApproveReject = (operator: Operator, action: 'approve' | 'reject') => {
    setSelectedOperator(operator);
    setApprovalAction(action);
    setIsApprovalModalOpen(true);
  };

  // Handle view documents
  const handleViewDocuments = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsDocModalOpen(true);
  };

  // Confirm approval/rejection
  const confirmAction = () => {
    if (selectedOperator) {
      updateStatusMutation.mutate({
        id: selectedOperator.id,
        status: approvalAction === 'approve' ? 'approved' : 'rejected',
      });
    }
  };

  const statusCounts = {
    all: operators.length,
    pending: operators.filter((o) => o.status === 'pending').length,
    approved: operators.filter((o) => o.status === 'approved').length,
    rejected: operators.filter((o) => o.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Operator Management</h1>
          <p className="text-dark-400 mt-1">
            Manage and approve tow truck operators
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as OperatorStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-primary-500 text-dark-900'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-dark-900/30 text-xs">
                {statusCounts[status]}
              </span>
            </button>
          ))}
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

      {/* Operators Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-400">Loading operators...</p>
          </div>
        ) : filteredOperators.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-400">No operators found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Operator</th>
                  <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Contact</th>
                  <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Stats</th>
                  <th className="text-left py-4 px-6 text-dark-400 font-medium text-sm">Registered</th>
                  <th className="text-right py-4 px-6 text-dark-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map((operator, index) => (
                  <motion.tr
                    key={operator.id}
                    className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Operator Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dark-700 overflow-hidden flex-shrink-0">
                          {operator.profile_photo_url ? (
                            <img
                              src={operator.profile_photo_url}
                              alt={operator.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-dark-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{operator.full_name}</p>
                          <p className="text-dark-400 text-sm">{operator.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-dark-300">
                        <Phone className="w-4 h-4 text-dark-400" />
                        {operator.phone}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <StatusBadge status={operator.status} />
                    </td>

                    {/* Stats */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-dark-300">
                          <Truck className="w-4 h-4 text-dark-400" />
                          {operator.total_trips} trips
                        </div>
                        {operator.rating > 0 && (
                          <div className="flex items-center gap-1 text-dark-300">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {operator.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-6">
                      <span className="text-dark-300 text-sm">
                        {new Date(operator.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDocuments(operator)}
                          className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-dark-400 hover:text-white"
                          title="View Documents"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {operator.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveReject(operator, 'approve')}
                              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors text-green-400"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleApproveReject(operator, 'reject')}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => {
          setIsDocModalOpen(false);
          setSelectedOperator(null);
        }}
        operator={selectedOperator}
      />

      {/* Approval Confirmation Modal */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedOperator(null);
        }}
        operator={selectedOperator}
        action={approvalAction}
        onConfirm={confirmAction}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}
