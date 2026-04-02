import { useState } from 'react';
import type { ActivityLog as ActivityLogEntry } from '../types';
import { ClipboardList } from 'lucide-react';

export default function ActivityLog() {
  const [activityLogs] = useState<ActivityLogEntry[]>([]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {activityLogs.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="bg-gray-100 text-gray-400 p-4 rounded-full">
              <ClipboardList size={28} />
            </div>
            <p className="text-gray-400 text-sm">No activity recorded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {activityLogs.map((log, idx) => (
              <li key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <span className="text-xs text-gray-400 shrink-0 pt-0.5 w-16">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-1.5
                      ${idx === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                  />
                  <span className="text-sm text-gray-700">{log.message}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
