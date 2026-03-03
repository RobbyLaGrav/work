import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, X } from 'lucide-react';

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }

const EMPTY = { date: new Date().toISOString().split('T')[0], amount: '', clientName: '', projectName: '', incomeType: 'project', notes: '' };

export default function Income() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const year = new Date().getFullYear();

  const load = () => {
    setLoading(true);
    api.get('/income', { params: { taxYear: year } }).then(r => setRecords(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/income', { ...form, amount: parseFloat(form.amount as any) });
      setShowForm(false);
      setForm({ ...EMPTY });
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this income record?')) return;
    await api.delete(`/income/${id}`);
    setRecords(r => r.filter(x => x.id !== id));
  };

  const total = records.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Income</h1>
          <p className="text-sm text-gray-500 mt-0.5">{records.length} payments — {fmt(total)} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Log Income
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No income records yet</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-indigo-600 text-sm hover:text-indigo-700 font-medium">Log your first payment →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{r.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.clientName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.projectName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full capitalize">{r.incomeType}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt(r.amount)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={4} className="px-4 py-3 text-xs font-medium text-gray-500">Total</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Log Income</h2>
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
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Client Name</label>
                <input type="text" value={form.clientName} onChange={set('clientName')} placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Project / Description</label>
                <input type="text" value={form.projectName} onChange={set('projectName')} placeholder="e.g. Website redesign"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Income Type</label>
                <select value={form.incomeType} onChange={set('incomeType')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="project">Project / One-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="retainer">Retainer</option>
                  <option value="product">Product Sale</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg">
                  {saving ? 'Saving...' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
