import { useEffect, useState } from 'react';
import api from '../services/api';
import { Calculator, CheckCircle, AlertCircle } from 'lucide-react';

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }); }
function pct(n: number) { return (n * 100).toFixed(1) + '%'; }

function Row({ label, value, highlight, sub }: any) {
  return (
    <div className={`flex justify-between items-baseline py-2.5 border-b border-gray-50 last:border-0 ${highlight ? 'mt-2 pt-3 border-t-2 border-gray-200' : ''}`}>
      <div>
        <span className={`text-sm ${highlight ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</span>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
      <span className={`font-semibold ${highlight ? 'text-lg text-gray-900' : 'text-gray-800'}`}>{fmt(value)}</span>
    </div>
  );
}

export default function TaxEstimate() {
  const [annual, setAnnual] = useState<any>(null);
  const [quarters, setQuarters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      api.get('/tax/annual', { params: { year } }),
      api.get('/tax/quarterly', { params: { year } })
    ]).then(([a, q]) => {
      setAnnual(a.data);
      setQuarters(q.data.quarters);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tax Estimate</h1>
        <p className="text-sm text-gray-500 mt-0.5">{year} — estimates based on your logged income and expenses</p>
      </div>

      {annual?.totalIncome === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Add some income and expenses to get accurate tax estimates.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Annual breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Annual Calculation</h2>
          </div>

          {annual && (
            <div>
              <Row label="Gross Income" value={annual.totalIncome} />
              <Row label="Business Deductions" value={-annual.totalDeductions} sub="Expenses you can deduct" />
              <Row label="Net Business Income" value={annual.netIncome} />
              <Row label="SE Tax Deduction (½)" value={-annual.seDeduction} sub="Deduct half of self-employment tax" />
              <Row label="Standard Deduction" value={-annual.standardDeduction} sub={`2024: $${annual.standardDeduction?.toLocaleString()}`} />
              <Row label="Taxable Income" value={annual.taxableIncome} highlight />

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-0">
                <Row label="Federal Income Tax" value={annual.federalTax} />
                <Row label="Self-Employment Tax" value={annual.selfEmploymentTax} sub="15.3% on 92.35% of net income" />
                <Row label="State Income Tax" value={annual.stateTax} />
                <Row label="Total Tax Liability" value={annual.totalTax} highlight />
              </div>

              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-indigo-700">Effective Tax Rate</span>
                  <span className="font-bold text-indigo-700">{pct(annual.effectiveRate || 0)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-indigo-600">Quarterly Est. Payment</span>
                  <span className="font-bold text-indigo-900">{fmt(annual.quarterlyPayment || 0)}</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-400 text-center">Estimates only. Consult a CPA for actual filing.</p>
            </div>
          )}
        </div>

        {/* Quarterly schedule */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Quarterly Payment Schedule</h2>
          <div className="space-y-3">
            {quarters.map(q => {
              const isPast = q.dueDate < today;
              const isNext = !isPast && quarters.filter(x => x.dueDate < today).length === quarters.indexOf(q);
              return (
                <div key={q.quarter} className={`p-3.5 rounded-xl border ${isNext ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isPast ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className={`w-4 h-4 rounded-full border-2 ${isNext ? 'border-indigo-500' : 'border-gray-300'}`} />
                      )}
                      <span className={`text-sm font-medium ${isNext ? 'text-indigo-700' : 'text-gray-700'}`}>{q.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${isNext ? 'text-indigo-700' : 'text-gray-800'}`}>{fmt(q.totalTax)}</span>
                  </div>
                  <div className="flex justify-between text-xs ml-6">
                    <span className="text-gray-400">Due {q.dueDate}</span>
                    <span className="text-gray-500">Income: {fmt(q.income)} | Deductions: {fmt(q.deductions)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3.5 bg-rose-50 rounded-xl border border-rose-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-rose-700">Total Annual Tax</span>
              <span className="font-bold text-rose-700">{fmt(annual?.totalTax || 0)}</span>
            </div>
            <p className="text-xs text-rose-500 mt-1">Set aside {pct((annual?.effectiveRate || 0.27))} of each payment to be safe</p>
          </div>
        </div>
      </div>

      {/* Tax tips */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-3">💡 Tax Saving Opportunities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            <span><strong>SEP-IRA:</strong> Contribute up to 25% of net income (max $69,000) — fully deductible</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            <span><strong>Health insurance:</strong> 100% deductible if you pay your own premiums</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            <span><strong>Home office:</strong> $5/sq ft (up to 300 sq ft) or actual expenses</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            <span><strong>Mileage:</strong> Track every business mile at $0.67/mile (2024 rate)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
