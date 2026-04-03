import { Fragment, useEffect, useState } from 'react';
import AsyncSelect from 'react-select/async';
import type { MultiValue } from 'react-select';
import type { Order, OrderStatus, Product } from '../types';
import { ordersApi, productsApi } from '../api';
import type { PaginationInfo } from '../api';
import { Plus, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

interface ProductOption {
  value: string;
  label: string;
  product: Product;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<MultiValue<ProductOption>>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    ordersApi
      .list({ status: filterStatus || undefined, page, limit: 20 })
      .then(({ data, pagination: pg }) => {
        if (cancelled) return;
        setOrders(data);
        setPagination(pg);
        setLoadingOrders(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingOrders(false);
      });
    return () => { cancelled = true; };
  }, [page, filterStatus]);

  function handleFilterStatus(s: OrderStatus | '') {
    setLoadingOrders(true);
    setFilterStatus(s);
    setPage(1);
  }

  function openModal() {
    setCustomerName('');
    setSelectedOptions([]);
    setQuantities({});
    setStockErrors({});
    setShowModal(true);
  }

  async function loadProductOptions(inputValue: string): Promise<ProductOption[]> {
    if (!inputValue.trim()) return [];
    const result = await productsApi.list({ q: inputValue, status: 'active', limit: 20 });
    return result.data.map(p => ({
      value: p.id,
      label: p.name,
      product: p,
    }));
  }

  function handleSelectChange(options: MultiValue<ProductOption>) {
    const newQtys = { ...quantities };
    const newErrors = { ...stockErrors };
    options.forEach(opt => {
      if (!(opt.value in newQtys)) newQtys[opt.value] = 1;
    });
    const currentIds = new Set(options.map(o => o.value));
    Object.keys(newQtys).forEach(id => {
      if (!currentIds.has(id)) {
        delete newQtys[id];
        delete newErrors[id];
      }
    });
    setQuantities(newQtys);
    setStockErrors(newErrors);
    setSelectedOptions(options);
  }

  function updateQty(productId: string, qty: number, stockQty: number, productName: string) {
    const safeQty = Math.max(1, qty);
    const errors = { ...stockErrors };
    if (safeQty > stockQty) {
      errors[productId] = `Only ${stockQty} in stock for "${productName}"`;
    } else {
      delete errors[productId];
    }
    setStockErrors(errors);
    setQuantities({ ...quantities, [productId]: safeQty });
  }

  function totalPrice() {
    return selectedOptions.reduce((sum, opt) => {
      const qty = quantities[opt.value] ?? 1;
      return sum + opt.product.price * qty;
    }, 0);
  }

  function canSubmit() {
    if (!customerName.trim() || selectedOptions.length === 0) return false;
    if (Object.keys(stockErrors).length > 0) return false;
    return true;
  }

  async function handleCreate() {
    if (!canSubmit()) return;
    const items = selectedOptions.map(opt => ({
      product_id: opt.value,
      quantity: quantities[opt.value] ?? 1,
    }));
    const order = await ordersApi.create(customerName, items);
    setOrders(prev => [order, ...prev]);
    setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    setShowModal(false);
  }

  async function updateStatus(id: string, status: OrderStatus) {
    const updated = await ordersApi.updateStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? updated : o));
  }

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      (o.orderId ?? o.id).toLowerCase().includes(q)
    );
  });

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
          onChange={e => handleFilterStatus(e.target.value as OrderStatus | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUS_FLOW.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loadingOrders ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Order ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Items</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Total</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {order.orderId ?? order.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-0.5">
                        {order.items.map((item, i) => (
                          <li key={i} className="text-gray-600 text-xs">
                            <span className="font-medium text-gray-800">
                              {item.productName ?? item.productId}
                            </span>
                            <span className="text-gray-400"> × {item.quantity}</span>
                            <span className="text-gray-400 ml-1">
                              (৳{(item.priceAtTime * item.quantity).toLocaleString()})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      ৳{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
                        {capitalize(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()}<br />
                      <span className="text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3">
                      {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                        <StatusDropdown
                          current={order.status}
                          onChange={s => updateStatus(order.id, s)}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loadingOrders && pagination.total > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {pagination.total} order{pagination.total !== 1 ? 's' : ''} total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setLoadingOrders(true); setPage(p => p - 1); }}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700 min-w-[80px] text-center">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => { setLoadingOrders(true); setPage(p => p + 1); }}
                disabled={page >= pagination.total_pages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Order</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  className={inputCls}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
                <AsyncSelect<ProductOption, true>
                  isMulti
                  cacheOptions
                  loadOptions={loadProductOptions}
                  value={selectedOptions}
                  onChange={handleSelectChange}
                  placeholder="Type to search products..."
                  noOptionsMessage={({ inputValue }) =>
                    inputValue ? 'No products found' : 'Start typing to search'
                  }
                  loadingMessage={() => 'Searching...'}
                  classNamePrefix="rselect"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                      borderRadius: '0.5rem',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
                      fontSize: '0.875rem',
                      minHeight: '40px',
                      '&:hover': { borderColor: '#3b82f6' },
                    }),
                    multiValue: base => ({
                      ...base,
                      backgroundColor: '#eff6ff',
                      borderRadius: '0.375rem',
                    }),
                    multiValueLabel: base => ({
                      ...base,
                      color: '#1d4ed8',
                      fontSize: '0.8rem',
                    }),
                    multiValueRemove: base => ({
                      ...base,
                      color: '#3b82f6',
                      '&:hover': { backgroundColor: '#dbeafe', color: '#1d4ed8' },
                    }),
                    menu: base => ({ ...base, borderRadius: '0.5rem', fontSize: '0.875rem' }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? '#eff6ff' : 'white',
                      color: '#111827',
                    }),
                  }}
                />
              </div>

              {/* Selected Products Table */}
              {selectedOptions.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Product</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Stock</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Unit Price</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Qty</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600">Subtotal</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOptions.map(opt => {
                        const p = opt.product;
                        const qty = quantities[p.id] ?? 1;
                        const hasError = !!stockErrors[p.id];
                        return (
                          <Fragment key={p.id}>
                            <tr className={`border-b border-gray-100 ${hasError ? 'bg-red-50' : ''}`}>
                              <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                              <td className="px-4 py-2.5">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  p.stock_quantity === 0
                                    ? 'bg-red-100 text-red-700'
                                    : p.stock_quantity <= p.minStockThreshold
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {p.stock_quantity}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">৳{p.price.toLocaleString()}</td>
                              <td className="px-4 py-2.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={p.stock_quantity}
                                  value={qty}
                                  onChange={e => updateQty(p.id, parseInt(e.target.value) || 1, p.stock_quantity, p.name)}
                                  className={`w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    hasError ? 'border-red-400' : 'border-gray-300'
                                  }`}
                                />
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-800">
                                ৳{(p.price * qty).toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5">
                                <button
                                  onClick={() => handleSelectChange(selectedOptions.filter(o => o.value !== p.id))}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X size={15} />
                                </button>
                              </td>
                            </tr>
                            {hasError && (
                              <tr key={`${p.id}-err`} className="bg-red-50">
                                <td colSpan={6} className="px-4 pb-2 text-xs text-red-600">
                                  ⚠ {stockErrors[p.id]}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{selectedOptions.length} product(s)</span>
                    <span className="text-base font-bold text-gray-900">
                      Total: ৳{totalPrice().toLocaleString()}
                    </span>
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
