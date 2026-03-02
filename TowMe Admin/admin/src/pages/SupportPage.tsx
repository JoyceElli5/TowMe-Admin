import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  User,
  Send,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  userName: string;
  userEmail: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'payment' | 'technical' | 'complaint';
  createdAt: string;
  updatedAt: string;
}

const demoTickets: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'Payment not received',
    message: 'I made a payment for my tow request but it shows as pending. Please help.',
    userName: 'Ama Serwaa',
    userEmail: 'ama.serwaa@email.com',
    status: 'open',
    priority: 'high',
    category: 'payment',
    createdAt: '2026-02-05 14:30',
    updatedAt: '2026-02-05 14:30',
  },
  {
    id: 'TKT-002',
    subject: 'App not loading properly',
    message: 'The app crashes when I try to view my request history.',
    userName: 'Kofi Boateng',
    userEmail: 'kofi.boateng@email.com',
    status: 'in_progress',
    priority: 'medium',
    category: 'technical',
    createdAt: '2026-02-05 10:15',
    updatedAt: '2026-02-05 12:00',
  },
  {
    id: 'TKT-003',
    subject: 'Driver was rude',
    message: 'The tow truck operator was very unprofessional during my service.',
    userName: 'Akua Mensah',
    userEmail: 'akua.mensah@email.com',
    status: 'in_progress',
    priority: 'high',
    category: 'complaint',
    createdAt: '2026-02-04 16:45',
    updatedAt: '2026-02-05 09:00',
  },
  {
    id: 'TKT-004',
    subject: 'How to update my profile?',
    message: 'I cannot find where to update my phone number in the app.',
    userName: 'Yaw Frimpong',
    userEmail: 'yaw.frimpong@email.com',
    status: 'resolved',
    priority: 'low',
    category: 'general',
    createdAt: '2026-02-03 11:00',
    updatedAt: '2026-02-03 14:30',
  },
  {
    id: 'TKT-005',
    subject: 'Refund request',
    message: 'I want to request a refund for my cancelled service.',
    userName: 'Efua Owusu',
    userEmail: 'efua.owusu@email.com',
    status: 'closed',
    priority: 'medium',
    category: 'payment',
    createdAt: '2026-02-02 09:30',
    updatedAt: '2026-02-03 10:00',
  },
];

const getStatusColor = (status: Ticket['status']) => {
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

const getPriorityColor = (priority: Ticket['priority']) => {
  switch (priority) {
    case 'low':
      return 'bg-gray-500/10 text-gray-500 dark:text-gray-400';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    case 'high':
      return 'bg-red-500/10 text-red-500 dark:text-red-400';
  }
};

export default function SupportPage() {
  const [tickets] = useState(demoTickets);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;

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
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {tickets.filter(t => t.status === 'resolved').length}
              </p>
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length}
              </p>
            </div>
          </div>
        </div>
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
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
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
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
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
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    getPriorityColor(ticket.priority)
                  )}>
                    {ticket.priority}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">{ticket.subject}</h3>
                <p className="text-sm text-gray-500 dark:text-dark-400 line-clamp-1">{ticket.message}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-700 dark:text-dark-300">{ticket.userName}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400">{ticket.createdAt}</p>
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
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
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
                  <p className="font-medium text-gray-900 dark:text-white">{selectedTicket.userName}</p>
                  <p className="text-sm text-gray-500 dark:text-dark-400">{selectedTicket.userEmail}</p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-gray-50 dark:bg-dark-700/50 rounded-xl p-4">
                <p className="text-gray-700 dark:text-dark-300">{selectedTicket.message}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400 mt-2">{selectedTicket.createdAt}</p>
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
                onClick={() => setSelectedTicket(null)}
                className="btn-secondary"
              >
                Close
              </button>
              <button className="btn-primary flex items-center gap-2">
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
