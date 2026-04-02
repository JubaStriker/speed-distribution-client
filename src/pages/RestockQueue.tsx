import { useState } from 'react';
import type { RestockItem, Product } from '../types';
import { AlertTriangle, ArrowUp } from 'lucide-react';

const PRIORITY_COLOR = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
};

export default function RestockQueue() {
  const [restockQueue] = useState<RestockItem[]>([]);
  const [products] = useState<Product[]>([]);

  const [restockAmounts, setRestockAmounts] = useState<Record<string, string>>({});

  function handleRestock(productId: string) {
    const qty = parseInt(restockAmounts[productId] || '0');
    if (!qty || qty <= 0) return;
    setRestockAmounts(prev => ({ ...prev, [productId]: '' }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">Restock Queue</h2>
        {restockQueue.length > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {restockQueue.length} item{restockQueue.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {restockQueue.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3 text-center">
          <div className="bg-green-50 text-green-600 p-4 rounded-full">
            <ArrowUp size={28} />
          </div>
          <p className="font-semibold text-gray-700">All products are well stocked!</p>
          <p className="text-sm text-gray-400">Items below their minimum threshold will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restockQueue.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;
            return (
              <div
                key={item.productId}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-50 text-red-500 p-2 rounded-lg mt-0.5">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{product.name}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLOR[item.priority]}`}>
                          {item.priority} priority
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        Current: <span className="font-medium text-red-600">{product.stock}</span>
                        {' '}/ Threshold: {product.minStockThreshold}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Added {new Date(item.addedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                      onClick={() => handleRestock(item.productId)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
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
