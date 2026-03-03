import { useEffect, useState } from 'react';
import api from '../services/api';
import { FileText, Download } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/expenses', { params: { taxYear: year, limit: 500 } })
    ]).then(([d, e]) => { setData(d.data); setExpenses(e.data.data); }).finally(() => setLoading(false));
  }, []);

  const categoryTotals = Object.values(
    expenses.reduce((acc: any, e) => {
      if (!acc[e.category]) acc[e.category] = { name: e.category.replace(/-/g, ' '), value: 0 };
      acc[e.category].value += e.deductibleAmount || 0;
      return acc;
    }, {})
  ).filter((c: any) => c.value > 0) as any[];

  const handleExport = () => {
    if (!data || !expenses.length) return;
    const rows = [
      ['Date', 'Category', 'Description', 'Vendor', 'Amount', 'Deductible Amount'],
      ...expenses.map(e => [e.date, e.category, e.description, e.vendor || '', e.amount, e.deductibleAmount || 0])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `freelancer-tax-${year}.csv`; a.click();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const m = data?.metrics || {};

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">{year} tax year summary</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gross Income', value: m.totalIncome || 0, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total Deductions', value: m.totalExpenses || 0, color: 'bg-blue-50 text-blue-700' },
          { label: 'Net Income', value: m.netIncome || 0, color: 'bg-violet-50 text-violet-700' },
          { label: 'Estimated Tax', value: m.estimatedAnnualTax || 0, color: 'bg-rose-50 text-rose-700' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-xl p-4`}>
            <div className="text-xs font-medium opacity-70 uppercase tracking-wide">{c.label}</div>
            <div className="text-xl font-bold mt-1">{fmt(c.value)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Deductions by Category</h2>
          {categoryTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryTotals} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryTotals.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No expenses to display</div>
          )}
        </div>

        {/* Detailed category table */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Category Details</h2>
          <div className="space-y-2">
            {categoryTotals.sort((a, b) => b.value - a.value).map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="flex-1 flex justify-between">
                  <span className="text-sm text-gray-600 capitalize">{c.name}</span>
                  <span className="text-sm font-medium text-gray-800">{fmt(c.value)}</span>
                </div>
              </div>
            ))}
            {categoryTotals.length === 0 && <div className="text-sm text-gray-400 text-center py-4">No expenses added yet</div>}
          </div>
          {categoryTotals.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Deductions</span>
              <span className="text-sm font-bold text-indigo-600">{fmt(categoryTotals.reduce((s, c) => s + c.value, 0))}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quarterly summary */}
      {data?.quarters && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Quarterly Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Quarter</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Est. Tax</th>
                  <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.quarters.map((q: any) => (
                  <tr key={q.quarter}>
                    <td className="py-3 font-medium text-gray-800">{q.label}</td>
                    <td className="py-3 text-right text-emerald-600">{fmt(q.income)}</td>
                    <td className="py-3 text-right text-blue-600">{fmt(q.deductions)}</td>
                    <td className="py-3 text-right text-gray-800">{fmt(q.netIncome)}</td>
                    <td className="py-3 text-right font-semibold text-rose-600">{fmt(q.totalTax)}</td>
                    <td className="py-3 text-right text-gray-500 text-xs">{q.dueDate}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-3 font-bold text-gray-800">Annual Total</td>
                  <td className="py-3 text-right font-bold text-emerald-600">{fmt(m.totalIncome || 0)}</td>
                  <td className="py-3 text-right font-bold text-blue-600">{fmt(m.totalExpenses || 0)}</td>
                  <td className="py-3 text-right font-bold text-gray-800">{fmt(m.netIncome || 0)}</td>
                  <td className="py-3 text-right font-bold text-rose-600">{fmt(m.estimatedAnnualTax || 0)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tax disclaimer */}
      <div className="flex items-start gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500">
          These reports are estimates based on the data you've entered. They are not tax returns and should not be filed with the IRS.
          Always consult a licensed CPA or tax professional for official filings.
        </p>
      </div>
    </div>
  );
}
