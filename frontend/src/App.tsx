import React from 'react';
import { Home, CreditCard, DollarSign, TrendingUp, Target, Settings, PieChart, X, User, Bell, Shield, Moon } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/auth/LoginPage';
import MortgageAnalyzer from './components/MortgageAnalyzer';
import CreditCardOptimizer from './components/CreditCardOptimizer';
import DebtPayoffPlanner from './components/DebtPayoffPlanner';
import IncomeTracker from './components/IncomeTracker';
import InvestmentsTracker from './components/InvestmentsTracker';
import Dashboard from './components/Dashboard';

type Page = 'dashboard' | 'mortgage' | 'credit-card' | 'debt' | 'income' | 'investments';

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = React.useState<Page>('dashboard');
  const [showSettings, setShowSettings] = React.useState(false);

  if (!user) {
    return <LoginPage />;
  }

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: Home },
    { id: 'mortgage' as Page, label: 'Mortgage', icon: TrendingUp },
    { id: 'credit-card' as Page, label: 'Credit Cards', icon: CreditCard },
    { id: 'debt' as Page, label: 'Debt Payoff', icon: Target },
    { id: 'investments' as Page, label: 'Investments', icon: PieChart },
    { id: 'income' as Page, label: 'Income', icon: DollarSign },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'mortgage':
        return <MortgageAnalyzer />;
      case 'credit-card':
        return <CreditCardOptimizer />;
      case 'debt':
        return <DebtPayoffPlanner />;
      case 'investments':
        return <InvestmentsTracker />;
      case 'income':
        return <IncomeTracker />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-gray-900 tracking-tight">FinanceAI</h1>
                <p className="text-[11px] font-medium text-blue-600 tracking-wide uppercase">AI-Powered Advisor</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-xs font-medium text-gray-500">Welcome,</p>
                <p className="text-sm font-bold text-gray-900">{user.email?.split('@')[0]}</p>
              </div>
              <button onClick={logout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="Logout">
                <div className="relative">
                  <Target className="w-5 h-5 rotate-45" />
                </div>
              </button>
              <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100/50 rounded-full transition-all">
                <Settings className="w-5 h-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center cursor-pointer">
                <span className="text-white text-xs font-bold">SR</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <nav className="w-64 hidden lg:block py-8 pr-8">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group relative ${
                    currentPage === item.id
                      ? 'bg-white shadow-sm border border-gray-200/50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 font-medium'
                  }`}
                >
                  {currentPage === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                  )}
                  <Icon className={`w-5 h-5 ${currentPage === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 py-8 overflow-hidden">
          <div className="w-full mx-auto">{renderPage()}</div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-heading font-semibold text-slate-800">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex h-[400px]">
              <div className="w-1/3 border-r border-slate-100 p-4 space-y-1 bg-slate-50/50">
                <button className="w-full flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
                  <Bell className="w-4 h-4" /> Notifications
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
                  <Shield className="w-4 h-4" /> Security
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
                  <Moon className="w-4 h-4" /> Appearance
                </button>
              </div>
              
              <div className="w-2/3 p-6 overflow-y-auto">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input type="text" defaultValue="Srini Finance" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input type="email" defaultValue="srini@finance.ai" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency Preference</label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                      <option>CAD ($)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;