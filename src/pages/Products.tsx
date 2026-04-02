import { useState } from 'react';
import type { Product, ProductStatus, Category } from '../types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface ProductForm {
  name: string;
  categoryId: string;
  price: string;
  stock: string;
  minStockThreshold: string;
  status: ProductStatus;
}

const emptyForm: ProductForm = {
  name: '', categoryId: '', price: '', stock: '', minStockThreshold: '5', status: 'active',
};

export default function Products() {
  const [products] = useState<Product[]>([]);
  const [categories] = useState<Category[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      price: String(p.price),
      stock: String(p.stock),
      minStockThreshold: String(p.minStockThreshold),
      status: p.status,
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.name || !form.categoryId || !form.price || !form.stock) return;
    setShowModal(false);
  }

  function handleDelete(_id: string) {
    confirm('Delete this product?');
  }

  function addCategory() {
    if (!catName.trim()) return;
    setCatName('');
    setShowCatModal(false);
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory ? p.categoryId === filterCategory : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Products</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatModal(true)}
            className="text-sm border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            + Category
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No products found.</td>
                </tr>
              )}
              {filtered.map(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                const isLow = p.stock < p.minStockThreshold && p.stock > 0;
                return (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{cat?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={isLow ? 'text-yellow-600 font-medium' : 'text-gray-700'}>
                        {p.stock}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">(min {p.minStockThreshold})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full
                          ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {p.status === 'active' ? 'Active' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {editingId ? 'Edit Product' : 'Add Product'}
            </h3>
            <div className="space-y-4">
              <Field label="Product Name">
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., iPhone 13"
                />
              </Field>
              <Field label="Category">
                <select
                  className={inputCls}
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price ($)">
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Stock Qty">
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                  />
                </Field>
              </div>
              <Field label="Min Stock Threshold">
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  value={form.minStockThreshold}
                  onChange={e => setForm({ ...form, minStockThreshold: e.target.value })}
                  placeholder="5"
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as ProductStatus })}
                >
                  <option value="active">Active</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </Field>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {editingId ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Category</h3>
            <input
              className={inputCls}
              value={catName}
              onChange={e => setCatName(e.target.value)}
              placeholder="Category name"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCatModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
