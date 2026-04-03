import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { setRestockCount } from '../store/authSlice';
import type { RestockItem } from '../types';
import { restockApi } from '../api';
import { AlertTriangle, PackageOpen, RefreshCw } from 'lucide-react';

const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
};

export default function RestockQueue() {
  const dispatch = useDispatch<AppDispatch>();
  const [restockQueue, setRestockQueue] = useState<RestockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restockAmounts, setRestockAmounts] = useState<Record<string, string>>({});
  const [restocking, setRestocking] = useState<Record<string, boolean>>({});

  async function fetchQueue() {
    setLoading(true);
    setError(null);
    try {
      const items = await restockApi.list();
      setRestockQueue(items);
      dispatch(setRestockCount(items.length));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load restock queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchQueue(); }, []);

  async function handleRestock(item: RestockItem) {
    const qty = parseInt(restockAmounts[item.productId] || '0');
    if (!qty || qty <= 0) return;
    setRestocking(prev => ({ ...prev, [item.productId]: true }));
    try {
      await restockApi.restock(item.productId, qty);
      setRestockAmounts(prev => ({ ...prev, [item.productId]: '' }));
      await fetchQueue();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Restock failed');
    } finally {
      setRestocking(prev => ({ ...prev, [item.productId]: false }));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Restock Queue</h2>
          {restockQueue.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {restockQueue.length} item{restockQueue.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-400">Loading restock queue…</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 py-12 flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={28} className="text-red-500" />
          <p className="font-semibold text-gray-700">{error}</p>
          <button onClick={fetchQueue} className="text-sm text-blue-600 hover:underline">Try again</button>
        </div>
      ) : restockQueue.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3 text-center">
          <div className="bg-green-50 text-green-600 p-4 rounded-full">
            <PackageOpen size={28} />
          </div>
          <p className="font-semibold text-gray-700">All products are well stocked!</p>
          <p className="text-sm text-gray-400">Items below their minimum threshold will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restockQueue.map(item => {
            const deficit = item.min_stock_threshold - item.stock_quantity;
            const isRestocking = restocking[item.productId];
            return (
              <div
                key={item.restock_id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-50 text-red-500 p-2 rounded-lg mt-0.5 shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[item.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                          {item.priority} priority
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="text-gray-500">
                          Stock:{' '}
                          <span className="font-semibold text-red-600">{item.stock_quantity}</span>
                          <span className="text-gray-400"> / min {item.min_stock_threshold}</span>
                        </span>
                        {deficit > 0 && (
                          <span className="text-orange-600 font-medium text-xs bg-orange-50 px-2 py-0.5 rounded-full">
                            {deficit} needed
                          </span>
                        )}
                        {item.category_name && (
                          <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {item.category_name}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-400">
                        Added {new Date(item.addedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={restockAmounts[item.productId] ?? ''}
                      onChange={e =>
                        setRestockAmounts(prev => ({ ...prev, [item.productId]: e.target.value }))
                      }
                      className="w-20 border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRestock(item)}
                      disabled={isRestocking || !restockAmounts[item.productId]}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isRestocking && <RefreshCw size={13} className="animate-spin" />}
                      Restock
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
