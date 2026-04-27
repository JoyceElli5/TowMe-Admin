import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  User,
  Send,
  X,
  ShieldAlert,
  UserCheck,
  Timer,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supportApi } from '../lib/api';
import type { SupportDisputeDecision } from '../lib/api';
import type { SupportTicket } from '../types';
import { SUPPORT_PRIORITIES, SUPPORT_STATUSES } from '../lib/contracts';
import type { SupportPriority, SupportStatus } from '../lib/contracts';
import { formatStatusLabel } from '../lib/status-label';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/audit';

const getStatusColor = (status: SupportTicket['status']) => {
  switch (status) {
    case 'open':
      return 'bg-blue-500/10 text-blue-500 dark:text-blue-400';
    case 'in_progress':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    case 'resolved':
      return 'bg-green-500/10 text-green-500 dark:text-green-400';
    case 'closed':
      return 'bg-gray-500/10 text-gray-500 dark:text-gray-400';
  }
};

const getPriorityColor = (priority: SupportTicket['priority']) => {
  switch (priority) {
    case 'low':
      return 'bg-gray-500/10 text-gray-500 dark:text-gray-400';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    case 'high':
      return 'bg-red-500/10 text-red-500 dark:text-red-400';
    case 'urgent':
      return 'bg-red-600/20 text-red-600 dark:text-red-300';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const STATUS_OPTIONS: Array<SupportStatus> = [...SUPPORT_STATUSES];
const PRIORITY_OPTIONS: Array<SupportPriority> = [...SUPPORT_PRIORITIES];
const SUPPORT_FILTERS: Array<'all' | SupportStatus> = ['all', ...SUPPORT_STATUSES];
const ACTIVE_SUPPORT_STATUSES: SupportStatus[] = [SUPPORT_STATUSES[0], SUPPORT_STATUSES[1]];
const HIGH_SUPPORT_PRIORITIES: SupportPriority[] = [SUPPORT_PRIORITIES[2], SUPPORT_PRIORITIES[3]];

export default function SupportPage() {
  const queryClient = useQueryClient();
  const { adminUser, hasPermission } = useAuth();
  const canManageSupport = hasPermission('support.manage');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: supportApi.getTickets,
    refetchInterval: 30000,
  });

  const { data: supportStats } = useQuery({
    queryKey: ['support-stats'],
    queryFn: supportApi.getStats,
    refetchInterval: 30000,
  });

  const [filter, setFilter] = useState<'all' | SupportStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const updateTicketMutation = useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: {
        status?: SupportTicket['status'];
        priority?: SupportTicket['priority'];
        assigned_to?: string;
        assigned_to_name?: string;
        sla_due_at?: string;
        resolution_summary?: string;
      };
    }) => supportApi.updateTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      supportApi.addReply(ticketId, message, adminUser?.id),
    onSuccess: () => {
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: ({
      ticket,
      decision,
      note,
      refundAmount,
    }: {
      ticket: SupportTicket;
      decision: SupportDisputeDecision;
      note?: string;
      refundAmount?: number;
    }) => supportApi.resolveDispute(ticket.id, decision, note, refundAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
    },
  });

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [filter, searchQuery, tickets]);

  const trustSafetyQueue = useMemo(() => {
    return tickets.filter((ticket) => {
      const content = `${ticket.subject} ${ticket.message}`.toLowerCase();
      const hasSafetyKeyword = /(fraud|safety|threat|assault|emergency|abuse|incident)/i.test(content);
      const isTrustCategory = ticket.category === 'complaint' || ticket.category === 'dispute';
      const isActive = ACTIVE_SUPPORT_STATUSES.includes(ticket.status);

      return isActive && (isTrustCategory || hasSafetyKeyword || ticket.priority === SUPPORT_PRIORITIES[3]);
    });
  }, [tickets]);

  const openCount = supportStats?.open ?? tickets.filter((ticket) => ticket.status === SUPPORT_STATUSES[0]).length;
  const inProgressCount = supportStats?.inProgress ?? tickets.filter((ticket) => ticket.status === SUPPORT_STATUSES[1]).length;
  const resolvedCount = supportStats?.resolved ?? tickets.filter((ticket) => ticket.status === SUPPORT_STATUSES[2]).length;
  const highPriorityCount =
    supportStats?.highPriorityOpen ??
    tickets.filter((ticket) => HIGH_SUPPORT_PRIORITIES.includes(ticket.priority) && ticket.status !== SUPPORT_STATUSES[3]).length;

  const closeModal = () => {
    setSelectedTicket(null);
    setReplyMessage('');
  };

  const handleTicketUpdate = async (
    ticket: SupportTicket,
    payload: {
      status?: SupportTicket['status'];
      priority?: SupportTicket['priority'];
      assigned_to?: string;
      assigned_to_name?: string;
      sla_due_at?: string;
      resolution_summary?: string;
    },
    action: string
  ) => {
    if (!canManageSupport) return;

    updateTicketMutation.mutate({ ticketId: ticket.id, payload });

    await logAuditEvent({
      action,
      resourceType: 'support_ticket',
      resourceId: ticket.id,
      before: {
        status: ticket.status,
        priority: ticket.priority,
        assigned_to: ticket.assigned_to,
        sla_due_at: ticket.sla_due_at,
      },
      after: payload,
      metadata: { source: 'admin-web' },
    });
  };

  const handleAssignToMe = (ticket: SupportTicket) => {
    if (!adminUser) return;

    void handleTicketUpdate(
      ticket,
      {
        assigned_to: adminUser.id,
        assigned_to_name: adminUser.name,
        status: ticket.status === SUPPORT_STATUSES[0] ? SUPPORT_STATUSES[1] : ticket.status,
      },
      'support.assign_ticket'
    );
  };

  const handleSetSla = (ticket: SupportTicket) => {
    const raw = window.prompt('Set SLA due date (ISO format, e.g. 2026-03-26T18:00:00Z):', ticket.sla_due_at || '');
    if (!raw) return;
    if (Number.isNaN(new Date(raw).getTime())) return;

    void handleTicketUpdate(ticket, { sla_due_at: raw }, 'support.set_sla');
  };

  const handleSendReply = async (ticket: SupportTicket) => {
    if (!replyMessage.trim() || !canManageSupport) return;

    replyMutation.mutate({ ticketId: ticket.id, message: replyMessage.trim() });
    await logAuditEvent({
      action: 'support.reply_ticket',
      resourceType: 'support_ticket',
      resourceId: ticket.id,
      after: { message: replyMessage.trim() },
      metadata: { source: 'admin-web' },
    });
  };

  const handleResolveDispute = async (ticket: SupportTicket, decision: SupportDisputeDecision) => {
    if (!canManageSupport || !ticket.dispute_id) return;

    let refundAmount: number | undefined;
    if (decision === 'approve_refund' || decision === 'partial_refund') {
      const amountRaw = window.prompt('Refund amount (GHS):');
      if (!amountRaw) return;
      const parsedAmount = Number(amountRaw);
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
      refundAmount = parsedAmount;
    }

    const note = window.prompt('Decision note (optional):') || undefined;

    resolveDisputeMutation.mutate({ ticket, decision, note, refundAmount });

    await logAuditEvent({
      action: 'support.resolve_dispute',
      resourceType: 'support_dispute',
      resourceId: ticket.dispute_id,
      after: { decision, note, refundAmount },
      metadata: { source: 'admin-web', ticketId: ticket.id },
    });
  };

  const handleEscalateToRisk = async (ticket: SupportTicket) => {
    if (!canManageSupport) return;

    const note = window.prompt('Escalation note for risk/safety team (required):');
    if (!note?.trim()) return;

    updateTicketMutation.mutate({
      ticketId: ticket.id,
      payload: {
        priority: SUPPORT_PRIORITIES[3],
        status: ticket.status === SUPPORT_STATUSES[0] ? SUPPORT_STATUSES[1] : ticket.status,
        resolution_summary: ticket.resolution_summary || `Escalated to risk: ${note.trim()}`,
      },
    });

    await logAuditEvent({
      action: 'support.escalate_to_risk',
      resourceType: 'support_ticket',
      resourceId: ticket.id,
      before: {
        status: ticket.status,
        priority: ticket.priority,
      },
      after: {
        status: ticket.status === SUPPORT_STATUSES[0] ? SUPPORT_STATUSES[1] : ticket.status,
        priority: SUPPORT_PRIORITIES[3],
        escalation_note: note.trim(),
      },
      metadata: { source: 'admin-web' },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">
            {openCount} open, {inProgressCount} in progress
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-dark-400">Open</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{openCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-dark-400">In Progress</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{inProgressCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-dark-400">Resolved</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{resolvedCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-dark-400">High Priority</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{highPriorityCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-dark-400">Open Disputes</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{supportStats?.disputeOpen ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-dark-400">SLA Breached</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{supportStats?.slaBreached ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-dark-400">Assigned Tickets</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {tickets.filter((ticket) => !!ticket.assigned_to && ACTIVE_SUPPORT_STATUSES.includes(ticket.status)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Safety Queue */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trust & Safety Queue</h2>
            <p className="text-xs text-gray-500 dark:text-dark-400">Active high-risk complaints/disputes and safety-keyword tickets</p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
            {trustSafetyQueue.length}
          </span>
        </div>

        {trustSafetyQueue.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-dark-400">No trust/safety escalations pending.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {trustSafetyQueue.slice(0, 10).map((ticket) => (
              <div key={`risk-${ticket.id}`} className="rounded-xl border border-gray-200 dark:border-dark-700 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.id} • {ticket.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">{ticket.user_name} • {formatStatusLabel(ticket.status, { titleCase: false })}</p>
                  </div>
                  <button
                    onClick={() => void handleEscalateToRisk(ticket)}
                    disabled={!canManageSupport || updateTicketMutation.isPending}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-200 disabled:opacity-40"
                  >
                    Escalate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {SUPPORT_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              )}
            >
              {formatStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-gray-500 dark:text-dark-400">Loading tickets...</p>}
        {!isLoading && filteredTickets.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-dark-400">No tickets match the current filter.</p>
        )}
        {filteredTickets.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedTicket(ticket)}
            className="glass-card p-5 cursor-pointer hover:ring-1 hover:ring-primary-500/30 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-gray-500 dark:text-dark-400">{ticket.id}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(ticket.status)
                  )}>
                    {formatStatusLabel(ticket.status, { titleCase: false })}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    getPriorityColor(ticket.priority)
                  )}>
                    {ticket.priority}
                  </span>
                  {(ticket.category === 'complaint' || ticket.category === 'dispute') && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-300">
                      trust-safety
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">{ticket.subject}</h3>
                <p className="text-sm text-gray-500 dark:text-dark-400 line-clamp-1">{ticket.message}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-2">
                  Category: {ticket.category} {ticket.dispute_id ? '• Dispute' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-700 dark:text-dark-300">{ticket.user_name}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400">{formatDate(ticket.created_at)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm text-gray-500 dark:text-dark-400">{selectedTicket.id}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(selectedTicket.status)
                  )}>
                    {formatStatusLabel(selectedTicket.status, { titleCase: false })}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh]">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500 dark:text-dark-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedTicket.user_name}</p>
                  <p className="text-sm text-gray-500 dark:text-dark-400">{selectedTicket.user_email || '-'}</p>
                </div>
              </div>

              {/* Assignment & SLA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-dark-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 dark:text-dark-400 mb-1">Assigned Agent</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.assigned_to_name || 'Unassigned'}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">SLA Due: {formatDate(selectedTicket.sla_due_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAssignToMe(selectedTicket)}
                    disabled={!canManageSupport || updateTicketMutation.isPending}
                    className="btn-secondary text-sm"
                  >
                    Assign To Me
                  </button>
                  <button
                    onClick={() => handleSetSla(selectedTicket)}
                    disabled={!canManageSupport || updateTicketMutation.isPending}
                    className="btn-secondary text-sm"
                  >
                    Set SLA
                  </button>
                </div>
              </div>

              {/* Status/Priority controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          if (selectedTicket.status === status) return;
                          void handleTicketUpdate(selectedTicket, { status }, 'support.update_status');
                        }}
                        disabled={!canManageSupport || updateTicketMutation.isPending}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium',
                          selectedTicket.status === status ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300'
                        )}
                      >
                        {formatStatusLabel(status, { titleCase: false })}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Priority</label>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITY_OPTIONS.map((priority) => (
                      <button
                        key={priority}
                        onClick={() => {
                          if (selectedTicket.priority === priority) return;
                          void handleTicketUpdate(selectedTicket, { priority }, 'support.update_priority');
                        }}
                        disabled={!canManageSupport || updateTicketMutation.isPending}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium',
                          selectedTicket.priority === priority ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300'
                        )}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={() => void handleEscalateToRisk(selectedTicket)}
                  disabled={!canManageSupport || updateTicketMutation.isPending}
                  className="btn-secondary text-sm"
                >
                  Escalate To Risk Team
                </button>
              </div>

              {/* Dispute controls */}
              {selectedTicket.dispute_id && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-300">Dispute Workflow</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">Dispute ID: {selectedTicket.dispute_id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void handleResolveDispute(selectedTicket, 'approve_refund')}
                      disabled={!canManageSupport || resolveDisputeMutation.isPending}
                      className="btn-secondary text-sm"
                    >
                      Approve Refund
                    </button>
                    <button
                      onClick={() => void handleResolveDispute(selectedTicket, 'partial_refund')}
                      disabled={!canManageSupport || resolveDisputeMutation.isPending}
                      className="btn-secondary text-sm"
                    >
                      Partial Refund
                    </button>
                    <button
                      onClick={() => void handleResolveDispute(selectedTicket, 'reject_claim')}
                      disabled={!canManageSupport || resolveDisputeMutation.isPending}
                      className="btn-secondary text-sm"
                    >
                      Reject Claim
                    </button>
                    <button
                      onClick={() => void handleResolveDispute(selectedTicket, 'operator_penalty')}
                      disabled={!canManageSupport || resolveDisputeMutation.isPending}
                      className="btn-secondary text-sm"
                    >
                      Operator Penalty
                    </button>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="bg-gray-50 dark:bg-dark-700/50 rounded-xl p-4">
                <p className="text-gray-700 dark:text-dark-300">{selectedTicket.message}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-2">Created: {formatDate(selectedTicket.created_at)}</p>
                {selectedTicket.resolution_summary && (
                  <p className="text-xs text-green-600 dark:text-green-300 mt-2">Resolution: {selectedTicket.resolution_summary}</p>
                )}
              </div>

              {/* Reply Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Reply</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => void handleSendReply(selectedTicket)}
                disabled={!canManageSupport || !replyMessage.trim() || replyMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Reply
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
