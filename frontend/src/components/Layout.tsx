import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Receipt, TrendingUp, Calculator, Bot, Settings, LogOut, DollarSign, Menu } from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/income', icon: DollarSign, label: 'Income' },
  { to: '/tax', icon: Calculator, label: 'Tax Estimate' },
  { to: '/ai', icon: Bot, label: 'AI Advisor' },
  { to: '/reports', icon: TrendingUp, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b border-indigo-700">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">Freelancer</div>
          <div className="text-indigo-300 text-xs">Tax AI</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-white/20 text-white' : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-indigo-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 bg-indigo-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.firstName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.firstName} {user?.lastName}</div>
            <div className="text-indigo-300 text-xs truncate">{user?.subscriptionTier}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-indigo-700 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-56 h-full bg-indigo-700 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-800">Freelancer Tax AI</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
