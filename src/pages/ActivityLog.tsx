import { useState, useEffect } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { activityApi, type PaginatedActivityLog } from '../api';

const LIMIT = 20;

export default function ActivityLog() {
  const [result, setResult] = useState<PaginatedActivityLog | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    activityApi.list({ page, limit: LIMIT })
      .then(data => { if (!cancelled) { setResult(data); setError(null); } })
      .catch(e => { if (!cancelled) setError(e.message ?? 'Failed to load activity logs'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  function goToPage(next: number) {
    setLoading(true);
    setPage(next);
  }

  const totalPages = result?.pagination.total_pages ?? 1;
  const logs = result?.data ?? [];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-400">Loading activity logs…</p>
        </div>
      ) : (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-left font-semibold text-gray-600 w-8">#</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Message</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">User</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="py-16 flex flex-col items-center gap-3 text-center">
                    <div className="bg-gray-100 text-gray-400 p-4 rounded-full">
                      <ClipboardList size={28} />
                    </div>
                    <p className="text-gray-400 text-sm">No activity recorded yet.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => {
                const rowNum = (page - 1) * LIMIT + idx + 1;
                const date = new Date(log.timestamp);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400">{rowNum}</td>
                    <td className="px-5 py-3 text-gray-700">{log.message}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{log.userEmail ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
              {result?.pagination.total ? ` · ${result.pagination.total} entries` : ''}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => goToPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
