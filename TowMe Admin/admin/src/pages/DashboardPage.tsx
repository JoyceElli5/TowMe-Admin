import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Truck,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '../lib/utils';
import { dashboardApi } from '../lib/api';
import { REQUEST_STATUSES } from '../lib/contracts';
import { formatStatusLabel } from '../lib/status-label';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconBg: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, change, icon: Icon, iconBg, onClick }: StatCardProps) => (
  <motion.div
    className={cn(
      'glass-card p-6',
      onClick && 'cursor-pointer hover:shadow-[0_20px_55px_rgba(15,23,42,0.18)]'
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={onClick ? { y: -2 } : undefined}
    onClick={onClick}
  >
    <div className="flex items-start justify-between gap-4">
      <div className={cn('p-3 rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.10)]', iconBg)}>
        <Icon className="w-6 h-6" />
      </div>
      {change !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg',
          change >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
        )}>
          {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
  </motion.div>
);

const getStatusBadge = (status: string) => {
  const REQUEST_STATUS = {
    pending: REQUEST_STATUSES[0],
    inProgress: REQUEST_STATUSES[4],
    completed: REQUEST_STATUSES[5],
    cancelled: REQUEST_STATUSES[6],
  } as const;

  switch (status) {
    case REQUEST_STATUS.completed:
      return (
        <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" />
          {formatStatusLabel(status)}
        </span>
      );
    case REQUEST_STATUS.inProgress:
      return (
        <span className="flex items-center gap-1 text-primary-500 bg-primary-500/10 px-2 py-1 rounded-lg text-sm">
          <Clock className="w-4 h-4" />
          {formatStatusLabel(status)}
        </span>
      );
    case REQUEST_STATUS.pending:
      return (
        <span className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg text-sm">
          <Clock className="w-4 h-4" />
          {formatStatusLabel(status)}
        </span>
      );
    case REQUEST_STATUS.cancelled:
      return (
        <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4" />
          {formatStatusLabel(status)}
        </span>
      );
    default:
      return null;
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  // Fetch recent requests
  const { data: recentRequests = [] } = useQuery({
    queryKey: ['dashboard-recent-requests'],
    queryFn: dashboardApi.getRecentRequests,
  });

  // Fetch pending operators
  const { data: pendingOperators = [] } = useQuery({
    queryKey: ['dashboard-pending-operators'],
    queryFn: dashboardApi.getPendingOperators,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: dashboardApi.getAlerts,
    refetchInterval: 30000,
  });

  const { data: revenueSeries = [] } = useQuery({
    queryKey: ['dashboard-revenue-series'],
    queryFn: () => dashboardApi.getRevenueSeries(7),
    refetchInterval: 60000,
  });

  // Chart data based on stats
  const requestsByStatus = [
    { name: 'Completed', value: stats?.completedRequests || 0, color: '#22c55e' },
    { name: 'In Progress', value: stats?.activeRequests || 0, color: '#F5A623' },
    { name: 'Pending', value: stats?.pendingRequests || 0, color: '#eab308' },
  ];

  const revenueData = revenueSeries.map((point) => ({
    name: new Date(point.date).toLocaleDateString('en-GB', { weekday: 'short' }),
    revenue: Math.round(point.revenue),
    trips: point.trips,
  }));

  const statCards = [
    {
      title: 'Active Requests',
      value: stats?.activeRequests || 0,
      icon: MapPin,
      iconBg: 'bg-purple-500/20 text-purple-500',
      onClick: () => navigate('/requests'),
    },
    {
      title: 'Completion Rate',
      value: `${stats?.completionRate || 0}%`,
      icon: CheckCircle,
      iconBg: 'bg-green-500/20 text-green-500',
    },
    {
      title: 'Cancellation Rate',
      value: `${stats?.cancellationRate || 0}%`,
      icon: AlertTriangle,
      iconBg: 'bg-red-500/20 text-red-500',
    },
    {
      title: 'Online Operators',
      value: stats?.onlineOperators || 0,
      icon: Truck,
      iconBg: 'bg-primary-500/20 text-primary-500',
      onClick: () => navigate('/operators'),
    },
    {
      title: 'Revenue Today',
      value: `GHS ${stats?.revenueToday?.toLocaleString() || 0}`,
      icon: DollarSign,
      iconBg: 'bg-green-500/20 text-green-400',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      iconBg: 'bg-blue-500/20 text-blue-400',
      onClick: () => navigate('/users'),
    },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Operators Alert */}
      {stats?.pendingOperators && stats.pendingOperators > 0 && (
        <motion.div
          className="glass-card border border-yellow-500/20 bg-yellow-50/80 flex items-center justify-between p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-yellow-700 font-medium">
                {stats.pendingOperators} operator{stats.pendingOperators > 1 ? 's' : ''} awaiting approval
              </p>
              <p className="text-yellow-600/80 text-sm">Review and approve new operator registrations</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/operators')}
            className="px-4 py-2 bg-yellow-500/90 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors shadow-[0_10px_30px_rgba(234,179,8,0.45)]"
          >
            Review Now
          </button>
        </motion.div>
      )}

      {/* Operational Alerts */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Operational Alerts</h3>
          <span className="text-sm text-gray-500">Auto refresh: 30s</span>
        </div>
        {alerts.length === 0 ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-green-700 font-medium">No critical alerts right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => navigate(alert.route)}
                className={cn(
                  'w-full text-left rounded-xl p-4 border transition-colors',
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                    : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-lg text-xs font-semibold',
                    alert.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  )}>
                    {alert.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          className="lg:col-span-2 glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                  </linearGradient>
                </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      color: '#111827',
                    }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F5A623"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Request Status Pie Chart */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Request Status</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={requestsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {requestsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {requestsByStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
            <button
              onClick={() => navigate('/requests')}
              className="text-primary-500 text-sm hover:underline flex items-center gap-1"
            >
              View All
              <Eye className="w-4 h-4" />
            </button>
          </div>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/70 border border-gray-200/60 hover:shadow-[0_14px_40px_rgba(15,23,42,0.16)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(15,23,42,0.10)]">
                      <MapPin className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{request.user_name}</p>
                      <p className="text-gray-500 text-sm truncate max-w-[200px]">
                        {request.pickup_location.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(request.status)}
                    <p className="text-primary-600 font-medium mt-1">
                      GHS {request.final_price || request.estimated_price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Operator Approvals */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
              {pendingOperators.length > 0 && (
                <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full shadow-[0_10px_30px_rgba(59,130,246,0.35)]">
                  {pendingOperators.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/operators')}
              className="text-primary-500 text-sm hover:underline flex items-center gap-1"
            >
              View All
              <Eye className="w-4 h-4" />
            </button>
          </div>
          {pendingOperators.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">All operators approved</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOperators.map((operator) => (
                <div
                  key={operator.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/80 border border-primary-100/70 hover:shadow-[0_16px_45px_rgba(15,23,42,0.20)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center overflow-hidden shadow-[0_10px_30px_rgba(59,130,246,0.35)]">
                      {operator.profile_photo_url ? (
                        <img
                          src={operator.profile_photo_url}
                          alt={operator.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Truck className="w-5 h-5 text-primary-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{operator.full_name}</p>
                      <p className="text-gray-500 text-sm">{operator.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/operators')}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors shadow-[0_14px_40px_rgba(59,130,246,0.55)]"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
