import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Search, Eye, X, Download, Copy, Check } from 'lucide-react';
import { auditApi } from '../lib/api';
import type { AuditLogRecord } from '../types';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [copiedField, setCopiedField] = useState<'before' | 'after' | 'metadata' | null>(null);

  const { data: paginated, isLoading } = useQuery({
    queryKey: ['audit-logs', currentPage, pageSize, actionFilter, search, fromDate, toDate],
    queryFn: () =>
      auditApi.getPaginated({
        page: currentPage,
        limit: pageSize,
        action: actionFilter === 'all' ? undefined : actionFilter,
        search: search || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      }),
    refetchInterval: 30000,
  });

  const logs = paginated?.items || [];
  const totalCount = paginated?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const actionOptions = useMemo(() => {
    const values = Array.from(new Set((paginated?.items || []).map((log) => log.action))).sort();
    return ['all', ...values];
  }, [paginated?.items]);

  const formatJsonBlock = (value: unknown) => {
    if (value === undefined || value === null) {
      return 'N/A';
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const copyJson = async (field: 'before' | 'after' | 'metadata', value: unknown) => {
    const text = formatJsonBlock(value);
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
  };

  const exportCsv = () => {
    const headers = ['timestamp', 'action', 'resource_type', 'resource_id', 'actor_id'];
    const rows = logs.map((log) => [
      log.timestamp,
      log.action,
      log.resource_type,
      log.resource_id,
      log.actor_id || 'system',
    ]);

    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map((cell) => escapeCell(String(cell))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track admin actions for compliance and traceability</p>
        </div>
        <div className="glass-card px-4 py-2 text-sm text-gray-600">Total: {totalCount}</div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action, resource, actor or resource ID..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="input-field pl-12"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value);
            setCurrentPage(1);
          }}
          className="input-field max-w-[260px]"
        >
          {actionOptions.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'All actions' : value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            className="input-field"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            className="input-field"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button
          onClick={() => {
            setFromDate('');
            setToDate('');
            setActionFilter('all');
            setSearch('');
            setCurrentPage(1);
          }}
          className="btn-secondary"
        >
          Reset Filters
        </button>
        <button onClick={exportCsv} className="btn-primary inline-flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="table-header px-6 py-4">Timestamp</th>
                  <th className="table-header px-6 py-4">Action</th>
                  <th className="table-header px-6 py-4">Resource</th>
                  <th className="table-header px-6 py-4">Resource ID</th>
                  <th className="table-header px-6 py-4">Actor</th>
                  <th className="table-header px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-600">{formatDateTime(log.timestamp)}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-primary-500/10 text-primary-600">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">{log.resource_type}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{log.resource_id}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{log.actor_id || 'system'}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white/70">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="input-field !py-1.5 !px-2 text-sm"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}/page
                  </option>
                ))}
              </select>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="btn-secondary disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Audit Event Details</h2>
                <p className="text-sm text-gray-500 mt-0.5">{selectedLog.action}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Timestamp</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDateTime(selectedLog.timestamp)}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Actor</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedLog.actor_id || 'system'}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Resource Type</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedLog.resource_type}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Resource ID</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedLog.resource_id}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Before</h3>
                  <button
                    onClick={() => copyJson('before', selectedLog.before)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {copiedField === 'before' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'before' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words">
                  {formatJsonBlock(selectedLog.before)}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">After</h3>
                  <button
                    onClick={() => copyJson('after', selectedLog.after)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {copiedField === 'after' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'after' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words">
                  {formatJsonBlock(selectedLog.after)}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Metadata</h3>
                  <button
                    onClick={() => copyJson('metadata', selectedLog.metadata)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {copiedField === 'metadata' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'metadata' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words">
                  {formatJsonBlock(selectedLog.metadata)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
