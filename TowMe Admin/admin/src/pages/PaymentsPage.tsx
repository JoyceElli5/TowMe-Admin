import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  Search,
  Download,
  Eye,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  WalletCards,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { financeApi } from '../lib/api';
import type { FinanceLedgerEntry } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/audit';

const getStatusColor = (status: FinanceLedgerEntry['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-500';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'failed':
      return 'bg-red-500/10 text-red-500';
  }
};

const getStatusIcon = (status: FinanceLedgerEntry['status']) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'pending':
      return Clock;
    case 'failed':
      return XCircle;
  }
};

const getTypeIcon = (type: FinanceLedgerEntry['type']) => {
  switch (type) {
    case 'payment':
      return ArrowDownLeft;
    case 'refund':
      return RefreshCcw;
    case 'payout':
      return ArrowUpRight;
  }
};

const getTypeColor = (type: FinanceLedgerEntry['type']) => {
  switch (type) {
    case 'payment':
      return 'text-green-500';
    case 'refund':
      return 'text-red-500';
    case 'payout':
      return 'text-blue-500';
  }
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManageRefunds = hasPermission('finance.manage_refunds');
  const [filter, setFilter] = useState<'all' | 'payment' | 'refund' | 'payout'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['finance-ledger'],
    queryFn: financeApi.getLedger,
  });

  const requestRefundMutation = useMutation({
    mutationFn: ({ paymentId, amount, reason }: { paymentId: string; amount: number; reason?: string }) =>
      financeApi.requestRefund(paymentId, amount, reason),
    onSuccess: async (_, variables) => {
      await logAuditEvent({
        action: 'finance.request_refund',
        resourceType: 'payment',
        resourceId: variables.paymentId,
        after: { amount: variables.amount, reason: variables.reason },
        metadata: { source: 'admin-web' },
      });
      queryClient.invalidateQueries({ queryKey: ['finance-ledger'] });
    },
  });

  const reviewRefundMutation = useMutation({
    mutationFn: ({
      refundId,
      decision,
      note,
    }: {
      refundId: string;
      decision: 'approve' | 'reject';
      note?: string;
    }) => (decision === 'approve' ? financeApi.approveRefund(refundId, note) : financeApi.rejectRefund(refundId, note)),
    onSuccess: async (_, variables) => {
      await logAuditEvent({
        action: variables.decision === 'approve' ? 'finance.approve_refund' : 'finance.reject_refund',
        resourceType: 'refund',
        resourceId: variables.refundId,
        after: { note: variables.note },
        metadata: { source: 'admin-web' },
      });
      queryClient.invalidateQueries({ queryKey: ['finance-ledger'] });
    },
  });

  const filteredPayments = payments.filter(p => {
    const matchesFilter = filter === 'all' || p.type === filter;
    const matchesSearch = 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.operatorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRequestRefund = (payment: FinanceLedgerEntry) => {
    if (!canManageRefunds || payment.type !== 'payment' || payment.status !== 'completed') {
      return;
    }

    const amountRaw = window.prompt(`Refund amount for ${payment.id}:`, payment.amount.toFixed(2));
    if (!amountRaw) return;
    const amount = Number(amountRaw);
    if (Number.isNaN(amount) || amount <= 0 || amount > payment.amount) return;
    const reason = window.prompt('Refund reason (optional):') || undefined;

    requestRefundMutation.mutate({ paymentId: payment.id, amount, reason });
  };

  const handleReviewRefund = (refund: FinanceLedgerEntry, decision: 'approve' | 'reject') => {
    if (!canManageRefunds || refund.type !== 'refund' || refund.status !== 'pending') {
      return;
    }

    const message = decision === 'approve' ? 'Approve this refund?' : 'Reject this refund?';
    if (!window.confirm(message)) return;
    const note = window.prompt('Decision note (optional):') || undefined;

    reviewRefundMutation.mutate({ refundId: refund.id, decision, note });
  };

  const handleExportCsv = () => {
    const headers = ['id', 'type', 'amount', 'status', 'requestId', 'userName', 'operatorName', 'method', 'date'];
    const rows = filteredPayments.map((entry) => [
      entry.id,
      entry.type,
      entry.amount.toFixed(2),
      entry.status,
      entry.requestId,
      entry.userName,
      entry.operatorName,
      entry.method,
      entry.date,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `finance-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalRevenue = payments
    .filter(p => p.type === 'payment' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunds = payments
    .filter(p => p.type === 'refund' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayouts = payments
    .filter(p => p.type === 'payout' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Transactions</h1>
          <p className="text-gray-500 mt-1">Manage payments, refunds, and operator payouts</p>
        </div>
        <button onClick={handleExportCsv} className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10">
              <ArrowDownLeft className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">GHS {totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10">
              <RefreshCcw className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Refunds</p>
              <p className="text-xl font-bold text-gray-900">GHS {totalRefunds.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <ArrowUpRight className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Operator Payouts</p>
              <p className="text-xl font-bold text-gray-900">GHS {totalPayouts.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">GHS {pendingAmount.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-2">
          {(['all', 'payment', 'refund', 'payout'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading finance ledger...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header px-6 py-4">Transaction ID</th>
                <th className="table-header px-6 py-4">Type</th>
                <th className="table-header px-6 py-4">Amount</th>
                <th className="table-header px-6 py-4">User</th>
                <th className="table-header px-6 py-4">Operator</th>
                <th className="table-header px-6 py-4">Method</th>
                <th className="table-header px-6 py-4">Status</th>
                <th className="table-header px-6 py-4">Date</th>
                <th className="table-header px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => {
                const TypeIcon = getTypeIcon(payment.type);
                const StatusIcon = getStatusIcon(payment.status);
                return (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900">{payment.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn('w-4 h-4', getTypeColor(payment.type))} />
                        <span className="text-gray-700 capitalize">{payment.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'font-semibold',
                        payment.type === 'refund' ? 'text-red-500' : 'text-gray-900'
                      )}>
                        {payment.type === 'refund' ? '-' : ''}GHS {payment.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{payment.userName}</td>
                    <td className="px-6 py-4 text-gray-700">{payment.operatorName}</td>
                    <td className="px-6 py-4 text-gray-700">{payment.method}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                        getStatusColor(payment.status)
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{payment.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.type === 'payment' && payment.status === 'completed' && (
                          <button
                            onClick={() => handleRequestRefund(payment)}
                            disabled={!canManageRefunds || requestRefundMutation.isPending}
                            className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Request Refund"
                          >
                            <WalletCards className="w-4 h-4" />
                          </button>
                        )}
                        {payment.type === 'refund' && payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReviewRefund(payment, 'approve')}
                              disabled={!canManageRefunds || reviewRefundMutation.isPending}
                              className="p-2 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Approve Refund"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReviewRefund(payment, 'reject')}
                              disabled={!canManageRefunds || reviewRefundMutation.isPending}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Reject Refund"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
