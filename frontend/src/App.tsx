import React from 'react';
import { Home, CreditCard, DollarSign, TrendingUp, Target, Settings } from 'lucide-react';
import MortgageAnalyzer from './components/MortgageAnalyzer';
import CreditCardOptimizer from './components/CreditCardOptimizer';
import DebtPayoffPlanner from './components/DeadPayoffPlanner';
import IncomeTracker from './components/IncomeTracker';
import Dashboard from './components/Dashboard';

type Page = 'dashboard' | 'mortgage' | 'credit-card' | 'debt' | 'income';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState<Page>('dashboard');

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: Home },
    { id: 'mortgage' as Page, label: 'Mortgage', icon: TrendingUp },
    { id: 'credit-card' as Page, label: 'Credit Cards', icon: CreditCard },
    { id: 'debt' as Page, label: 'Debt Payoff', icon: Target },
    { id: 'income' as Page, label: 'Income', icon: DollarSign },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'mortgage':
        return <MortgageAnalyzer />;
      case 'credit-card':
        return <CreditCardOptimizer />;
      case 'debt':
        return <DebtPayoffPlanner />;
      case 'income':
        return <IncomeTracker />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Srini Personal FinanceAI</h1>
                <p className="text-xs text-gray-500">AI-Powered Financial Advisor</p>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;