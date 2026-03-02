import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  Search,
  Download,
  Eye,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Payment {
  id: string;
  type: 'payment' | 'refund' | 'payout';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  requestId: string;
  userName: string;
  operatorName: string;
  method: string;
  date: string;
}

const demoPayments: Payment[] = [
  {
    id: 'PAY-001',
    type: 'payment',
    amount: 150.00,
    status: 'completed',
    requestId: 'REQ-1234',
    userName: 'Ama Serwaa',
    operatorName: 'John Mensah',
    method: 'Mobile Money',
    date: '2026-02-05 14:30',
  },
  {
    id: 'PAY-002',
    type: 'payment',
    amount: 200.00,
    status: 'completed',
    requestId: 'REQ-1233',
    userName: 'Kofi Boateng',
    operatorName: 'Kwame Asante',
    method: 'Card',
    date: '2026-02-05 12:15',
  },
  {
    id: 'PAY-003',
    type: 'refund',
    amount: 50.00,
    status: 'completed',
    requestId: 'REQ-1225',
    userName: 'Akua Mensah',
    operatorName: 'Yaw Frimpong',
    method: 'Mobile Money',
    date: '2026-02-04 16:45',
  },
  {
    id: 'PAY-004',
    type: 'payout',
    amount: 850.00,
    status: 'completed',
    requestId: '-',
    userName: '-',
    operatorName: 'John Mensah',
    method: 'Bank Transfer',
    date: '2026-02-04 10:00',
  },
  {
    id: 'PAY-005',
    type: 'payment',
    amount: 175.00,
    status: 'pending',
    requestId: 'REQ-1235',
    userName: 'Kwesi Appiah',
    operatorName: 'Samuel Osei',
    method: 'Mobile Money',
    date: '2026-02-05 15:00',
  },
  {
    id: 'PAY-006',
    type: 'payment',
    amount: 125.00,
    status: 'failed',
    requestId: 'REQ-1236',
    userName: 'Efua Owusu',
    operatorName: 'John Mensah',
    method: 'Card',
    date: '2026-02-05 15:30',
  },
];

const getStatusColor = (status: Payment['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-500 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    case 'failed':
      return 'bg-red-500/10 text-red-500 dark:text-red-400';
  }
};

const getStatusIcon = (status: Payment['status']) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'pending':
      return Clock;
    case 'failed':
      return XCircle;
  }
};

const getTypeIcon = (type: Payment['type']) => {
  switch (type) {
    case 'payment':
      return ArrowDownLeft;
    case 'refund':
      return RefreshCcw;
    case 'payout':
      return ArrowUpRight;
  }
};

const getTypeColor = (type: Payment['type']) => {
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
  const [payments] = useState(demoPayments);
  const [filter, setFilter] = useState<'all' | 'payment' | 'refund' | 'payout'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = payments.filter(p => {
    const matchesFilter = filter === 'all' || p.type === filter;
    const matchesSearch = 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.operatorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments & Transactions</h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">Manage payments, refunds, and operator payouts</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
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
              <p className="text-sm text-gray-500 dark:text-dark-400">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">GHS {totalRevenue.toFixed(2)}</p>
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
              <p className="text-sm text-gray-500 dark:text-dark-400">Total Refunds</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">GHS {totalRefunds.toFixed(2)}</p>
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
              <p className="text-sm text-gray-500 dark:text-dark-400">Operator Payouts</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">GHS {totalPayouts.toFixed(2)}</p>
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
              <p className="text-sm text-gray-500 dark:text-dark-400">Pending</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">GHS {pendingAmount.toFixed(2)}</p>
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
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}s
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-700">
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
                    className="border-b border-gray-100 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900 dark:text-white">{payment.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn('w-4 h-4', getTypeColor(payment.type))} />
                        <span className="text-gray-700 dark:text-dark-300 capitalize">{payment.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'font-semibold',
                        payment.type === 'refund' ? 'text-red-500' : 'text-gray-900 dark:text-white'
                      )}>
                        {payment.type === 'refund' ? '-' : ''}GHS {payment.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-dark-300">{payment.userName}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-dark-300">{payment.operatorName}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-dark-300">{payment.method}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                        getStatusColor(payment.status)
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-dark-400 text-sm">{payment.date}</td>
                    <td className="px-6 py-4">
                      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
