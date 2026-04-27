import { useEffect, useState } from 'react';
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
import { OPERATOR_STATUSES } from '../lib/contracts';
import type { OperatorStatus as ContractOperatorStatus } from '../lib/contracts';
import { formatStatusLabel } from '../lib/status-label';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/audit';
import { supabase } from '../lib/supabase';

type OperatorStatus = 'all' | ContractOperatorStatus;
type OperatorAction = 'approve' | 'reject' | 'suspend' | 'reactivate';

const OPERATOR_STATUS = {
  pending: OPERATOR_STATUSES[0],
  approved: OPERATOR_STATUSES[1],
  rejected: OPERATOR_STATUSES[2],
  suspended: OPERATOR_STATUSES[3],
} as const;

const OPERATOR_FILTERS: OperatorStatus[] = [
  'all',
  OPERATOR_STATUS.pending,
  OPERATOR_STATUS.approved,
  OPERATOR_STATUS.rejected,
  OPERATOR_STATUS.suspended,
];

const COMMON_DOCUMENT_BUCKETS = [
  'operator_documents',
  'operator-documents',
  'operatordocuments',
  'operator_docs',
  'documents',
] as const;

const OPERATOR_DOCUMENT_BUCKET = 'operator_documents';
type OperatorDocumentKey = 'ghana_card' | 'drivers_license' | 'vehicle_registration' | 'insurance';

function buildDocumentUrlCandidates(url?: string | null): string[] {
  if (!url) {
    return [];
  }

  const candidates: string[] = [url];
  const publicPrefix = '/storage/v1/object/public/';
  const publicIndex = url.indexOf(publicPrefix);

  if (publicIndex === -1) {
    return candidates;
  }

  const base = url.slice(0, publicIndex + publicPrefix.length);
  const remainder = url.slice(publicIndex + publicPrefix.length);
  const firstSlash = remainder.indexOf('/');

  if (firstSlash === -1) {
    return candidates;
  }

  const bucket = remainder.slice(0, firstSlash);
  const objectPath = remainder.slice(firstSlash + 1);
  const bucketVariants = new Set<string>([
    bucket,
    bucket.replace(/_/g, '-'),
    bucket.replace(/-/g, '_'),
    ...COMMON_DOCUMENT_BUCKETS,
  ]);

  bucketVariants.forEach((bucketVariant) => {
    const candidate = `${base}${bucketVariant}/${objectPath}`;
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  });

  return candidates;
}

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
      {formatStatusLabel(status)}
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
  const [activeDoc, setActiveDoc] = useState<OperatorDocumentKey>('ghana_card');
  const [docUrlIndex, setDocUrlIndex] = useState<Record<OperatorDocumentKey, number>>({} as Record<OperatorDocumentKey, number>);
  const [resolvedDocUrls, setResolvedDocUrls] = useState<Record<OperatorDocumentKey, string>>({} as Record<OperatorDocumentKey, string>);
  const [isResolvingDocuments, setIsResolvingDocuments] = useState(false);

  const documents = [
    {
      key: 'ghana_card',
      label: 'Ghana Card',
      url: resolvedDocUrls.ghana_card || operator?.ghana_card_url,
    },
    {
      key: 'drivers_license',
      label: "Driver's License",
      url: resolvedDocUrls.drivers_license || operator?.drivers_license_url,
    },
    {
      key: 'vehicle_registration',
      label: 'Vehicle Registration',
      url: resolvedDocUrls.vehicle_registration || operator?.vehicle_registration_url,
    },
    {
      key: 'insurance',
      label: 'Insurance',
      url: resolvedDocUrls.insurance || operator?.insurance_url,
    },
  ];

  const selectedDocument = documents.find((d) => d.key === activeDoc);
  const selectedDocumentUrlCandidates = buildDocumentUrlCandidates(selectedDocument?.url);
  const selectedDocumentAttemptIndex = docUrlIndex[activeDoc] || 0;
  const activeImageUrl = selectedDocumentUrlCandidates[selectedDocumentAttemptIndex];

  const handleSelectDocument = (docKey: OperatorDocumentKey) => {
    setActiveDoc(docKey);
    setDocUrlIndex((previous) => ({ ...previous, [docKey]: 0 }));
  };

  const handleDocumentImageError = () => {
    const nextIndex = selectedDocumentAttemptIndex + 1;
    if (nextIndex < selectedDocumentUrlCandidates.length) {
      setDocUrlIndex((previous) => ({ ...previous, [activeDoc]: nextIndex }));
    } else {
      setDocUrlIndex((previous) => ({ ...previous, [activeDoc]: selectedDocumentUrlCandidates.length }));
    }
  };

  useEffect(() => {
    setResolvedDocUrls({} as Record<OperatorDocumentKey, string>);
    setDocUrlIndex({} as Record<OperatorDocumentKey, number>);
    setActiveDoc('ghana_card');

    if (!isOpen || !operator) {
      return;
    }

    const ownerFolder = operator.user_id || operator.id;
    if (!ownerFolder) {
      return;
    }

    let isMounted = true;

    const resolveFromStorageFolder = async () => {
      setIsResolvingDocuments(true);
      try {
        const { data, error } = await supabase.storage
          .from(OPERATOR_DOCUMENT_BUCKET)
          .list(ownerFolder, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'desc' },
          });

        if (error || !data?.length) {
          return;
        }

        const normalized = data
          .filter((file) => Boolean(file.name))
          .map((file) => ({
            name: file.name,
            lowerName: file.name.toLowerCase(),
          }));

        const pickFile = (keyword: string) =>
          normalized.find((file) => file.lowerName.includes(keyword))?.name;

        const candidates: Record<OperatorDocumentKey, string | undefined> = {
          ghana_card: pickFile('ghana_card'),
          drivers_license: pickFile('drivers_license') || pickFile('license'),
          vehicle_registration:
            pickFile('vehicle_registration') || pickFile('registration') || pickFile('vehicle'),
          insurance: pickFile('insurance'),
        };

        const nextResolved: Record<OperatorDocumentKey, string> = {} as Record<OperatorDocumentKey, string>;
        for (const [docType, fileName] of Object.entries(candidates)) {
          if (!fileName) {
            continue;
          }

          const filePath = `${ownerFolder}/${fileName}`;
          const { data: signedData, error: signedError } = await supabase.storage
            .from(OPERATOR_DOCUMENT_BUCKET)
            .createSignedUrl(filePath, 60 * 60);

          if (!signedError && signedData?.signedUrl) {
            nextResolved[docType as OperatorDocumentKey] = signedData.signedUrl;
            continue;
          }

          const { data: publicData } = supabase.storage
            .from(OPERATOR_DOCUMENT_BUCKET)
            .getPublicUrl(filePath);

          if (publicData?.publicUrl) {
            nextResolved[docType as OperatorDocumentKey] = publicData.publicUrl;
          }
        }

        if (isMounted && Object.keys(nextResolved).length > 0) {
          setResolvedDocUrls(nextResolved);
        }
      } catch {
        // Keep modal usable even if storage lookup fails.
      } finally {
        if (isMounted) {
          setIsResolvingDocuments(false);
        }
      }
    };

    void resolveFromStorageFolder();

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    operator?.id,
    operator?.user_id,
    operator?.ghana_card_url,
    operator?.drivers_license_url,
    operator?.vehicle_registration_url,
    operator?.insurance_url,
  ]);

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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950" onClick={onClose} />

            {/* Modal */}
          <motion.div
            className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden shadow-xl"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden">
                  {operator.profile_photo_url ? (
                    <img src={operator.profile_photo_url} alt={operator.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{operator.full_name}</h2>
                  <p className="text-slate-400 text-sm">{operator.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Operator Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <p className="text-white font-medium">{operator.phone}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Registered</span>
                  </div>
                  <p className="text-white font-medium">
                    {new Date(operator.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <StatusBadge status={operator.status} />
                </div>
              </div>

              {/* Document Tabs */}
              <div className="flex gap-2 mb-4 border-b border-slate-700 pb-4">
                {documents.map((doc) => (
                  <button
                    key={doc.key as OperatorDocumentKey}
                    onClick={() => handleSelectDocument(doc.key as OperatorDocumentKey)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeDoc === doc.key
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    {doc.label}
                  </button>
                ))}
              </div>

              {/* Document Viewer */}
              <div className="bg-slate-800 rounded-xl h-80 overflow-hidden">
                {selectedDocument?.url ? (
                  activeImageUrl ? (
                    <img
                      src={activeImageUrl}
                      alt={`${operator.full_name} ${selectedDocument.label}`}
                      className="w-full h-full object-contain bg-slate-900"
                      onError={handleDocumentImageError}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-300 mb-2">Could not load image preview for this document.</p>
                      <p className="text-slate-500 text-sm">Please confirm the storage bucket and file path for this upload.</p>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-300">
                      {isResolvingDocuments ? 'Loading document preview...' : 'No document uploaded'}
                    </p>
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
  action: OperatorAction;
  onConfirm: () => void;
  isLoading: boolean;
}) => {
  if (!operator) return null;

  const actionConfig: Record<OperatorAction, {
    title: string;
    description: string;
    iconBg: string;
    icon: React.ElementType;
    buttonClass: string;
    buttonText: string;
  }> = {
    approve: {
      title: 'Approve Operator',
      description: 'They will be able to receive tow requests.',
      iconBg: 'bg-green-500/20',
      icon: CheckCircle,
      buttonClass: 'bg-green-500 text-white hover:bg-green-600',
      buttonText: 'Approve',
    },
    reject: {
      title: 'Reject Operator',
      description: 'Their application will be rejected.',
      iconBg: 'bg-red-500/20',
      icon: XCircle,
      buttonClass: 'bg-red-500 text-white hover:bg-red-600',
      buttonText: 'Reject',
    },
    suspend: {
      title: 'Suspend Operator',
      description: 'They will not be able to receive new tow requests until reactivated.',
      iconBg: 'bg-orange-500/20',
      icon: AlertTriangle,
      buttonClass: 'bg-orange-500 text-white hover:bg-orange-600',
      buttonText: 'Suspend',
    },
    reactivate: {
      title: 'Reactivate Operator',
      description: 'They will be restored to active approved status.',
      iconBg: 'bg-blue-500/20',
      icon: CheckCircle,
      buttonClass: 'bg-blue-500 text-white hover:bg-blue-600',
      buttonText: 'Reactivate',
    },
  };

  const config = actionConfig[action];
  const ActionIcon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-950" onClick={onClose} />
          <motion.div
            className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md mx-4 p-6"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              config.iconBg
            )}>
              <ActionIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white text-center mb-2">
              {config.title}
            </h3>
            <p className="text-slate-300 text-center mb-6">
              Are you sure you want to {action} <span className="text-white font-medium">{operator.full_name}</span>?
              {' '}
              {config.description}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50',
                  config.buttonClass
                )}
              >
                {isLoading ? 'Processing...' : config.buttonText}
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
  const [approvalAction, setApprovalAction] = useState<OperatorAction>('approve');

  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canVerifyOperators = hasPermission('operators.verify');
  const canSuspendOperators = hasPermission('operators.suspend');

  // Fetch operators
  const { data: operators = [], isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: operatorsApi.getAll,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      currentStatus,
    }: {
      id: string;
      status: 'approved' | 'rejected' | 'suspended';
      currentStatus: Operator['status'];
      action: OperatorAction;
    }) => operatorsApi.updateStatus(id, status, currentStatus),
    onSuccess: async (_, variables) => {
      const operatorBefore = operators.find((operator) => operator.id === variables.id);

      await logAuditEvent({
        action: `operators.${variables.action}`,
        resourceType: 'operator',
        resourceId: variables.id,
        before: operatorBefore
          ? {
              status: operatorBefore.status,
              full_name: operatorBefore.full_name,
            }
          : undefined,
        after: {
          status: variables.status,
        },
        metadata: {
          source: 'admin-web',
        },
      });

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
  const getActionTargetStatus = (action: OperatorAction): 'approved' | 'rejected' | 'suspended' => {
    const map: Record<OperatorAction, 'approved' | 'rejected' | 'suspended'> = {
      approve: 'approved',
      reject: 'rejected',
      suspend: 'suspended',
      reactivate: 'approved',
    };

    return map[action];
  };

  const canRunAction = (action: OperatorAction) => {
    if (action === 'approve' || action === 'reject') {
      return canVerifyOperators;
    }

    return canSuspendOperators;
  };

  // Handle lifecycle action request
  const handleLifecycleAction = (operator: Operator, action: OperatorAction) => {
    if (!canRunAction(action)) {
      return;
    }

    const nextStatus = getActionTargetStatus(action);
    if (!operatorsApi.canTransitionStatus(operator.status, nextStatus)) {
      return;
    }

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
      const nextStatus = getActionTargetStatus(approvalAction);

      if (!operatorsApi.canTransitionStatus(selectedOperator.status, nextStatus)) {
        return;
      }

      updateStatusMutation.mutate({
        id: selectedOperator.id,
        status: nextStatus,
        currentStatus: selectedOperator.status,
        action: approvalAction,
      });
    }
  };

  const statusCounts = {
    all: operators.length,
    pending: operators.filter((o) => o.status === OPERATOR_STATUS.pending).length,
    approved: operators.filter((o) => o.status === OPERATOR_STATUS.approved).length,
    rejected: operators.filter((o) => o.status === OPERATOR_STATUS.rejected).length,
    suspended: operators.filter((o) => o.status === OPERATOR_STATUS.suspended).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
            Operator Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and approve tow truck operators
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2">
          {OPERATOR_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {status === 'all' ? 'All' : formatStatusLabel(status)}
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-gray-200 text-xs text-gray-600">
                {statusCounts[status]}
              </span>
            </button>
          ))}
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

      {/* Operators Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading operators...</p>
          </div>
        ) : filteredOperators.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No operators found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header px-6 py-4">Operator</th>
                  <th className="table-header px-6 py-4">Contact</th>
                  <th className="table-header px-6 py-4">Status</th>
                  <th className="table-header px-6 py-4">Stats</th>
                  <th className="table-header px-6 py-4">Registered</th>
                  <th className="table-header px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map((operator, index) => (
                  <motion.tr
                    key={operator.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Operator Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                          {operator.profile_photo_url ? (
                            <img
                              src={operator.profile_photo_url}
                              alt={operator.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{operator.full_name}</p>
                          <p className="text-gray-500 text-sm">{operator.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
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
                        <div className="flex items-center gap-1 text-gray-600">
                          <Truck className="w-4 h-4 text-gray-400" />
                          {operator.total_trips} trips
                        </div>
                        {operator.rating > 0 && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {operator.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-6">
                      <span className="text-gray-500 dark:text-dark-300 text-sm">
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
                        {operator.status === OPERATOR_STATUS.pending && (
                          <>
                            <button
                              onClick={() => handleLifecycleAction(operator, 'approve')}
                              disabled={!canVerifyOperators}
                              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors text-green-400 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleLifecycleAction(operator, 'reject')}
                              disabled={!canVerifyOperators}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {operator.status === OPERATOR_STATUS.approved && (
                          <button
                            onClick={() => handleLifecycleAction(operator, 'suspend')}
                            disabled={!canSuspendOperators}
                            className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Suspend"
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </button>
                        )}
                        {operator.status === OPERATOR_STATUS.suspended && (
                          <button
                            onClick={() => handleLifecycleAction(operator, 'reactivate')}
                            disabled={!canSuspendOperators}
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Reactivate"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
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
