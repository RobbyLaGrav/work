import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, X, Search } from 'lucide-react';

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }

const CATEGORIES = [
  { id: 'software', label: 'Software & Subscriptions', icon: '💻' },
  { id: 'equipment', label: 'Equipment & Hardware', icon: '🖥️' },
  { id: 'meals', label: 'Meals & Entertainment', icon: '🍽️' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'home-office', label: 'Home Office', icon: '🏠' },
  { id: 'phone', label: 'Phone & Internet', icon: '📱' },
  { id: 'education', label: 'Education & Training', icon: '📚' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'professional-services', label: 'Professional Services', icon: '⚖️' },
  { id: 'insurance', label: 'Business Insurance', icon: '🛡️' },
  { id: 'vehicle', label: 'Vehicle & Mileage', icon: '🚗' },
  { id: 'other', label: 'Other', icon: '📦' },
];

const EMPTY = { date: new Date().toISOString().split('T')[0], amount: '', category: 'software', description: '', vendor: '', notes: '', isDeductible: true, deductionPercentage: 100 };

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [year] = useState(new Date().getFullYear());

  const load = () => {
    setLoading(true);
    api.get('/expenses', { params: { taxYear: year, limit: 200 } })
      .then(r => { setExpenses(r.data.data); setTotal(r.data.pagination.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: k === 'amount' || k === 'deductionPercentage' ? e.target.value : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: parseFloat(form.amount as any) });
      setShowForm(false);
      setForm({ ...EMPTY });
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    setExpenses(ex => ex.filter(e => e.id !== id));
  };

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.description.toLowerCase().includes(q) || (e.vendor || '').toLowerCase().includes(q);
    const matchCat = !filterCat || e.category === filterCat;
    return matchSearch && matchCat;
  });

  const deductibleTotal = filtered.reduce((s, e) => s + (e.deductibleAmount || 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} expenses — {fmt(deductibleTotal)} deductible</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No expenses found</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-indigo-600 text-sm hover:text-indigo-700 font-medium">Add your first expense →</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Deductible</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(e => {
                  const cat = CATEGORIES.find(c => c.id === e.category);
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{e.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{e.description}</div>
                        {e.vendor && <div className="text-xs text-gray-400">{e.vendor}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                          {cat?.icon} {cat?.label || e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">{fmt(e.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        {e.isDeductible ? (
                          <span className="text-emerald-600 font-medium">{fmt(e.deductibleAmount)}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not deductible</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => remove(e.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={3} className="px-4 py-3 text-xs font-medium text-gray-500">Total ({filtered.length} items)</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{fmt(filtered.reduce((s, e) => s + e.amount, 0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt(deductibleTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add Expense</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={set('date')} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount ($)</label>
                  <input type="number" value={form.amount} onChange={set('amount')} required min="0.01" step="0.01" placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <select value={form.category} onChange={set('category')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={set('description')} required placeholder="e.g. Adobe Creative Cloud"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Vendor (optional)</label>
                <input type="text" value={form.vendor} onChange={set('vendor')} placeholder="e.g. Adobe Inc"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="deductible" checked={form.isDeductible}
                  onChange={e => setForm(f => ({ ...f, isDeductible: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="deductible" className="text-sm text-gray-700">Business deductible</label>
              </div>

              {form.isDeductible && form.category === 'meals' && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                  💡 Meal expenses are typically only 50% deductible for business. Deduction % auto-set.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors">
                  {saving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
