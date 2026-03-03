import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { TrendingUp, Receipt, Calculator, AlertCircle, ArrowRight, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); }
function fmtD(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }); }

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mt-0.5">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const m = data?.metrics || {};
  const urgent = data?.nextDue?.daysUntilDue <= 30;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome back, {user?.firstName} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">{new Date().getFullYear()} tax year overview</p>
      </div>

      {/* Due date alert */}
      {data?.nextDue && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${urgent ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${urgent ? 'text-amber-500' : 'text-blue-500'}`} />
          <div className="flex-1">
            <span className="font-medium text-sm text-gray-800">
              {data.nextDue.label} estimated tax payment due {data.nextDue.dueDate}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              ({data.nextDue.daysUntilDue > 0 ? `${data.nextDue.daysUntilDue} days away` : 'Overdue!'}) — estimated <strong>{fmtD(m.estimatedQuarterlyTax || 0)}</strong>
            </span>
          </div>
          <Link to="/tax" className="flex items-center gap-1 text-indigo-600 text-sm font-medium hover:text-indigo-700 whitespace-nowrap">
            View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Income" value={fmt(m.totalIncome || 0)} sub={`${m.incomeCount || 0} payments`} color="bg-emerald-500" />
        <StatCard icon={Receipt} label="Deductions" value={fmt(m.totalExpenses || 0)} sub={`${m.expenseCount || 0} expenses`} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Net Income" value={fmt(m.netIncome || 0)} sub="After deductions" color="bg-violet-500" />
        <StatCard icon={Calculator} label="Est. Tax Owed" value={fmt(m.estimatedAnnualTax || 0)} sub={m.effectiveRate ? `${(m.effectiveRate * 100).toFixed(1)}% effective rate` : 'Annual'} color="bg-rose-500" />
      </div>

      {/* Chart + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.monthly || []} barSize={8} barGap={2}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip formatter={(v: any) => fmtD(v)} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="income" name="Income" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Top Deduction Categories</h3>
          {data?.topCategories?.length > 0 ? (
            <div className="space-y-3">
              {data.topCategories.map((c: any) => (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 capitalize">{c.category.replace(/-/g, ' ')}</span>
                    <span className="font-medium text-gray-800">{fmt(c.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No expenses yet</p>
              <Link to="/expenses" className="mt-2 inline-block text-xs text-indigo-600 hover:text-indigo-700 font-medium">Add your first expense →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quarterly breakdown */}
      {data?.quarters && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Quarterly Breakdown</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.quarters.map((q: any) => (
              <div key={q.quarter} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 mb-2">{q.label}</div>
                <div className="text-sm font-bold text-gray-900">{fmtD(q.totalTax)}</div>
                <div className="text-xs text-gray-400 mt-0.5">est. tax</div>
                <div className="text-xs text-gray-500 mt-1">Due: {q.dueDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/expenses" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Receipt className="w-4 h-4" /> Add Expense
        </Link>
        <Link to="/income" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-colors">
          <DollarSign className="w-4 h-4" /> Log Income
        </Link>
        <Link to="/ai" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-colors">
          Ask AI Advisor →
        </Link>
      </div>
    </div>
  );
}
