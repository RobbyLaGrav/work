import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { CheckCircle } from 'lucide-react';

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function Settings() {
  const { user, loadProfile } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', businessType: '', country: 'US', state: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName || '', lastName: user.lastName || '', businessType: user.businessType || '', country: 'US', state: '' });
  }, [user]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      await loadProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const plans = [
    { name: 'Free', price: '$0', features: ['Expense tracking', 'Basic tax calc', '5 AI questions/month', 'CSV export'], current: user?.subscriptionTier === 'free', color: 'border-gray-200' },
    { name: 'Basic', price: '$15/mo', features: ['Everything in Free', 'Unlimited expenses', '20 AI questions/month', 'PDF reports', 'Priority support'], current: user?.subscriptionTier === 'basic', color: 'border-indigo-200', badge: 'Popular' },
    { name: 'Premium', price: '$30/mo', features: ['Everything in Basic', 'Unlimited AI guidance', 'Multi-currency support', 'Advanced reports', 'Deduction optimizer'], current: user?.subscriptionTier === 'premium', color: 'border-violet-200' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">First Name</label>
              <input value={form.firstName} onChange={set('firstName')} placeholder="John"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Last Name</label>
              <input value={form.lastName} onChange={set('lastName')} placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input value={user?.email || ''} disabled
              className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Business Type</label>
              <select value={form.businessType} onChange={set('businessType')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="writer">Writer</option>
                <option value="consultant">Consultant</option>
                <option value="marketer">Marketer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">State (for tax calc)</label>
              <select value={form.state} onChange={set('state')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
                <CheckCircle className="w-4 h-4" /> Saved!
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">Subscription Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map(plan => (
            <div key={plan.name} className={`border-2 rounded-xl p-4 relative ${plan.current ? 'border-indigo-400 bg-indigo-50' : plan.color + ' bg-white'}`}>
              {plan.badge && !plan.current && (
                <span className="absolute -top-2.5 left-3 text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">{plan.badge}</span>
              )}
              {plan.current && (
                <span className="absolute -top-2.5 left-3 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Current Plan</span>
              )}
              <div className="font-bold text-gray-900">{plan.name}</div>
              <div className="text-lg font-bold text-indigo-600 mt-1 mb-3">{plan.price}</div>
              <ul className="space-y-1.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="text-emerald-500 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button className="mt-4 w-full py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Payments coming soon via Stripe. Contact us to upgrade early.</p>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 p-5">
        <h2 className="font-semibold text-red-700 text-sm mb-3">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-3">Permanently delete your account and all data. This cannot be undone.</p>
        <button className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
}
