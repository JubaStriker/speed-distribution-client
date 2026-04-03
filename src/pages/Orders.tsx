import { useState } from 'react';
import type { Order, OrderItem, OrderStatus, Product } from '../types';
import { Plus, ChevronDown } from 'lucide-react';

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const [orders] = useState<Order[]>([]);
  const [products] = useState<Product[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [stockError, setStockError] = useState('');
  const [conflictError, setConflictError] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');

  function openModal() {
    setCustomerName('');
    setSelectedItems([]);
    setStockError('');
    setConflictError('');
    setShowModal(true);
  }

  function addItem(productId: string) {
    if (!productId) return;
    if (selectedItems.find(i => i.productId === productId)) {
      setConflictError('This product is already added to the order.');
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product || product.status === 'out_of_stock') {
      setConflictError('This product is currently unavailable.');
      return;
    }
    setConflictError('');
    setStockError('');
    setSelectedItems([...selectedItems, { productId, quantity: 1, priceAtTime: product.price }]);
  }

  function updateQty(productId: string, qty: number) {
    const product = products.find(p => p.id === productId)!;
    setStockError('');
    if (qty > product.stock) {
      setStockError(`Only ${product.stock} items available in stock for "${product.name}".`);
    }
    setSelectedItems(selectedItems.map(i =>
      i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i
    ));
  }

  function removeItem(productId: string) {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
    setStockError('');
    setConflictError('');
  }

  function totalPrice() {
    return selectedItems.reduce((sum, item) => sum + item.priceAtTime * item.quantity, 0);
  }

  function canSubmit() {
    if (!customerName.trim() || selectedItems.length === 0) return false;
    for (const item of selectedItems) {
      const product = products.find(p => p.id === item.productId)!;
      if (item.quantity > product.stock) return false;
    }
    return true;
  }

  function handleCreate() {
    if (!canSubmit()) return;
    setShowModal(false);
  }

  function updateStatus(_id: string, _status: OrderStatus) {
    // TODO: wire to Redux
  }

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeProducts = products.filter(p => p.status === 'active');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Orders</h2>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by customer or order ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as OrderStatus | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUS_FLOW.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
            No orders found.
          </div>
        )}
        {filtered.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{order.customerName}</span>
                  <span className="text-xs text-gray-400">#{order.id}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {new Date(order.createdAt).toLocaleString()}
                </div>
                <div className="mt-2 space-y-0.5">
                  {order.items.map(item => {
                    const p = products.find(p => p.id === item.productId);
                    return (
                      <div key={item.productId} className="text-sm text-gray-600">
                        {p?.name ?? item.productId} × {item.quantity} — ${(item.priceAtTime * item.quantity).toFixed(2)}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 font-semibold text-gray-900 text-sm">
                  Total: ${order.totalPrice.toFixed(2)}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
                  {capitalize(order.status)}
                </span>
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <StatusDropdown
                    current={order.status}
                    onChange={s => updateStatus(order.id, s)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-5">New Order</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  className={inputCls}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Product</label>
                <select
                  className={inputCls}
                  onChange={e => { addItem(e.target.value); e.target.value = ''; }}
                  defaultValue=""
                >
                  <option value="">Select a product to add...</option>
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.price} (stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {conflictError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {conflictError}
                </p>
              )}
              {stockError && (
                <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  ⚠ {stockError}
                </p>
              )}

              {selectedItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Qty</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Subtotal</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map(item => {
                        const p = products.find(p => p.id === item.productId)!;
                        return (
                          <tr key={item.productId} className="border-b border-gray-100">
                            <td className="px-3 py-2 text-gray-700">{p.name}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              ${(item.priceAtTime * item.quantity).toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="text-red-400 hover:text-red-600 text-xs"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-3 py-2 bg-gray-50 text-sm font-semibold text-gray-900 text-right">
                    Total: ${totalPrice().toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!canSubmit()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDropdown({ current, onChange }: { current: OrderStatus; onChange: (s: OrderStatus) => void }) {
  const [open, setOpen] = useState(false);
  const options = STATUS_FLOW.filter(s => s !== current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Update <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[130px]">
          {options.map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {capitalize(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
