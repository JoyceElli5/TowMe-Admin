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
import type { WalletBalanceEntry } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/audit';
import { formatStatusLabel } from '../lib/status-label';

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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['finance-ledger'],
    queryFn: financeApi.getLedger,
  });

  const { data: payoutQueue = [] } = useQuery({
    queryKey: ['finance-payout-queue'],
    queryFn: financeApi.getPayoutQueue,
  });

  const { data: refundQueue = [] } = useQuery({
    queryKey: ['finance-refund-queue'],
    queryFn: financeApi.getRefundQueue,
  });

  const { data: walletBalances = [] } = useQuery({
    queryKey: ['finance-wallet-balances'],
    queryFn: financeApi.getWalletBalances,
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
      setFeedback({ type: 'success', message: `Refund request submitted for ${variables.paymentId}.` });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Refund request failed.' });
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
      setFeedback({
        type: 'success',
        message: variables.decision === 'approve' ? 'Refund approved successfully.' : 'Refund rejected successfully.',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Refund review failed.' });
    },
  });

  const payoutMutation = useMutation({
    mutationFn: ({ payoutId, action, note }: { payoutId: string; action: 'process' | 'retry'; note?: string }) =>
      action === 'process' ? financeApi.processPayout(payoutId, note) : financeApi.retryPayout(payoutId, note),
    onSuccess: async (_, variables) => {
      await logAuditEvent({
        action: variables.action === 'process' ? 'finance.process_payout' : 'finance.retry_payout',
        resourceType: 'payout',
        resourceId: variables.payoutId,
        after: { note: variables.note },
        metadata: { source: 'admin-web' },
      });
      queryClient.invalidateQueries({ queryKey: ['finance-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['finance-payout-queue'] });
      queryClient.invalidateQueries({ queryKey: ['finance-wallet-balances'] });
      setFeedback({
        type: 'success',
        message: variables.action === 'process' ? 'Payout marked as processed.' : 'Payout retry requested.',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Payout operation failed.' });
    },
  });

  const handleViewDetails = (payment: FinanceLedgerEntry) => {
    setFeedback({
      type: 'success',
      message: `Transaction ${payment.id}: ${payment.type} | ${payment.status} | GHS ${payment.amount.toFixed(2)} | ${payment.method}`,
    });
  };

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

  const handlePayoutAction = (entry: FinanceLedgerEntry, action: 'process' | 'retry') => {
    if (!canManageRefunds || entry.type !== 'payout') {
      return;
    }

    if (action === 'process' && entry.status !== 'pending') {
      return;
    }

    if (action === 'retry' && entry.status !== 'failed') {
      return;
    }

    const confirmation = action === 'process' ? 'Process this payout now?' : 'Retry this failed payout?';
    if (!window.confirm(confirmation)) return;

    const note = window.prompt('Add note (optional):') || undefined;
    payoutMutation.mutate({ payoutId: entry.id, action, note });
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
      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-medium opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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

      {/* Operational Queues */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Pending Refund Queue</h2>
            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">{refundQueue.length}</span>
          </div>
          {refundQueue.length === 0 ? (
            <p className="text-sm text-gray-500">No pending refunds in queue.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {refundQueue.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.id}</p>
                      <p className="text-xs text-gray-500">{entry.userName} • GHS {entry.amount.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewRefund(entry, 'approve')}
                        disabled={!canManageRefunds || reviewRefundMutation.isPending}
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewRefund(entry, 'reject')}
                        disabled={!canManageRefunds || reviewRefundMutation.isPending}
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Payout Queue</h2>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{payoutQueue.length}</span>
          </div>
          {payoutQueue.length === 0 ? (
            <p className="text-sm text-gray-500">No pending/failed payouts right now.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {payoutQueue.slice(0, 8).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.id}</p>
                      <p className="text-xs text-gray-500">{entry.operatorName} • GHS {entry.amount.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.status === 'pending' && (
                        <button
                          onClick={() => handlePayoutAction(entry, 'process')}
                          disabled={!canManageRefunds || payoutMutation.isPending}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40"
                        >
                          Process
                        </button>
                      )}
                      {entry.status === 'failed' && (
                        <button
                          onClick={() => handlePayoutAction(entry, 'retry')}
                          disabled={!canManageRefunds || payoutMutation.isPending}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-40"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wallet Balances */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Operator Wallet Balances</h2>
          <span className="text-xs text-gray-500">Derived from ledger entries</span>
        </div>
        {walletBalances.length === 0 ? (
          <p className="text-sm text-gray-500">No wallet balance data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header px-4 py-3 text-left">Operator</th>
                  <th className="table-header px-4 py-3 text-right">Payments</th>
                  <th className="table-header px-4 py-3 text-right">Payouts</th>
                  <th className="table-header px-4 py-3 text-right">Refund Adj.</th>
                  <th className="table-header px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {(walletBalances as WalletBalanceEntry[]).slice(0, 20).map((entry) => (
                  <tr key={entry.operatorKey} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.operatorName}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-700">GHS {entry.totalPayments.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-blue-700">GHS {entry.totalPayouts.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-700">GHS {entry.totalRefundAdjustments.toFixed(2)}</td>
                    <td className={cn('px-4 py-3 text-sm text-right font-semibold', entry.balance >= 0 ? 'text-gray-900' : 'text-red-600')}>
                      GHS {entry.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                        {formatStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{payment.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="View Details"
                        >
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
                        {payment.type === 'payout' && payment.status === 'pending' && (
                          <button
                            onClick={() => handlePayoutAction(payment, 'process')}
                            disabled={!canManageRefunds || payoutMutation.isPending}
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Process Payout"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        )}
                        {payment.type === 'payout' && payment.status === 'failed' && (
                          <button
                            onClick={() => handlePayoutAction(payment, 'retry')}
                            disabled={!canManageRefunds || payoutMutation.isPending}
                            className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Retry Payout"
                          >
                            <RefreshCcw className="w-4 h-4" />
                          </button>
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
