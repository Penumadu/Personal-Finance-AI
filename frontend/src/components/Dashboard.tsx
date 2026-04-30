import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, CreditCard, Target, AlertTriangle, ArrowUpRight, Wallet, PiggyBank, PieChart as PieChartIcon, DollarSign } from 'lucide-react';
import Card from './ui/Card';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { SAMPLE_INVESTMENTS, SAMPLE_INCOME, SAMPLE_CREDIT_CARDS, SAMPLE_DEBTS, SAMPLE_MORTGAGES } from '../lib/sampleData';

// Type for navigation callback
interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  
  // State for fetched data
  const [data, setData] = React.useState({
    investments: [] as any[],
    income: [] as any[],
    creditCards: [] as any[],
    debts: [] as any[],
    mortgages: [] as any[]
  });

  React.useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      setData({
        investments: SAMPLE_INVESTMENTS,
        income: SAMPLE_INCOME,
        creditCards: SAMPLE_CREDIT_CARDS,
        debts: SAMPLE_DEBTS,
        mortgages: SAMPLE_MORTGAGES
      });
      setLoading(false);
      return;
    }

    const collections = ['investments', 'income_sources', 'credit_cards', 'debts', 'mortgages'];
    const unsubscribes: (() => void)[] = [];

    collections.forEach(colName => {
      const q = query(collection(db, colName), where('userId', '==', user.uid));
      const unsub = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(prev => ({
          ...prev,
          [colName === 'income_sources' ? 'income' : colName === 'credit_cards' ? 'creditCards' : colName]: docs
        }));
      });
      unsubscribes.push(unsub);
    });

    setLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  // Calculations
  const totalAssets = data.investments.reduce((sum, inv) => sum + parseFloat(inv.value || '0'), 0) +
                     data.mortgages.reduce((sum, m) => sum + parseFloat(m.propertyValue || '0'), 0);
  
  const totalDebts = data.creditCards.reduce((sum, cc) => sum + parseFloat(cc.balance || '0'), 0) +
                    data.debts.reduce((sum, d) => sum + parseFloat(d.balance || '0'), 0) +
                    data.mortgages.reduce((sum, m) => sum + parseFloat(m.currentBalance || '0'), 0);

  const netWorth = totalAssets - totalDebts;

  const monthlyIncome = data.income.reduce((sum, inc) => {
    const amount = parseFloat(inc.amount || '0');
    if (inc.frequency === 'weekly') return sum + amount * 4.33;
    if (inc.frequency === 'biweekly') return sum + amount * 2.17;
    if (inc.frequency === 'yearly') return sum + amount / 12;
    return sum + amount;
  }, 0);

  const monthlyDebtPayments = data.debts.reduce((sum, d) => sum + parseFloat(d.minimum_payment || '0'), 0) +
                             data.mortgages.reduce((sum, m) => sum + parseFloat(m.monthlyPayment || '0'), 0);

  // For demo purposes, we'll still use some realistic hardcoded values for historical trends 
  // until we implement a time-series collection in Firebase
  const cashFlowData = [
    { month: 'Jan', income: monthlyIncome * 0.95, expenses: monthlyIncome * 0.6, savings: monthlyIncome * 0.35 },
    { month: 'Feb', income: monthlyIncome * 0.98, expenses: monthlyIncome * 0.58, savings: monthlyIncome * 0.4 },
    { month: 'Mar', income: monthlyIncome * 1.02, expenses: monthlyIncome * 0.62, savings: monthlyIncome * 0.4 },
    { month: 'Apr', income: monthlyIncome, expenses: monthlyIncome * 0.6, savings: monthlyIncome * 0.4 },
  ];

  const debtBreakdown = [
    { name: 'Credit Cards', value: data.creditCards.reduce((sum, cc) => sum + parseFloat(cc.balance || '0'), 0), color: '#EF4444' },
    { name: 'Loans', value: data.debts.reduce((sum, d) => sum + parseFloat(d.balance || '0'), 0), color: '#F59E0B' },
    { name: 'Mortgages', value: data.mortgages.reduce((sum, m) => sum + parseFloat(m.currentBalance || '0'), 0), color: '#8B5CF6' },
  ].filter(d => d.value > 0);

  const assetBreakdown = [
    { name: 'Real Estate', value: data.mortgages.reduce((sum, m) => sum + parseFloat(m.propertyValue || '0'), 0), color: '#3B82F6' },
    { name: 'Investments', value: data.investments.reduce((sum, inv) => sum + parseFloat(inv.value || '0'), 0), color: '#10B981' },
  ].filter(a => a.value > 0);

  const quickStats = [
    { label: 'Net Worth', value: `$${(netWorth / 1000).toFixed(1)}K`, change: '+4.2%', trend: 'up', color: 'blue' },
    { label: 'Monthly Income', value: `$${monthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: '+3%', trend: 'up', color: 'green' },
    { label: 'Total Debt', value: `$${(totalDebts / 1000).toFixed(1)}K`, change: '-2.1%', trend: 'down', color: 'purple' },
    { label: 'Debt Ratio', value: `${((totalDebts / totalAssets) * 100 || 0).toFixed(1)}%`, change: 'On track', trend: 'neutral', color: 'orange' }
  ];

  const recentActivity = [
    { type: 'mortgage', title: 'Mortgage Rate Alert', description: 'Rates dropped 0.25% - Consider refinancing', time: '2 hours ago' },
    { type: 'credit', title: 'Credit Card Optimization', description: 'You could save $3,200 by transferring balance', time: '1 day ago' },
    { type: 'debt', title: 'Debt Payoff Milestone', description: 'Major progress on student loans!', time: '3 days ago' },
    { type: 'savings', title: 'Savings Goal Update', description: 'You are on track for your emergency fund', time: '5 days ago' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your financial overview - April 2026</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className={`bg-gradient-to-br ${
            stat.color === 'blue' ? 'from-blue-50/80 to-blue-100/50 border-blue-100' :
            stat.color === 'green' ? 'from-emerald-50/80 to-emerald-100/50 border-emerald-100' :
            stat.color === 'purple' ? 'from-indigo-50/80 to-indigo-100/50 border-indigo-100' :
            'from-amber-50/80 to-amber-100/50 border-amber-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <span className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' :
                stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Cash Flow Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Cash Flow Trend" subtitle="Last 6 months" className="lg:col-span-2">
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} name="Expenses" />
                <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} name="Savings" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Net Worth Card */}
        <Card title="Net Worth">
          <div className="space-y-4">
            <div className="flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">Total Net Worth</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600">Assets</p>
                <p className="text-lg font-bold text-blue-900">
                  ${(totalAssets/1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-red-600">Debts</p>
                <p className="text-lg font-bold text-red-900">
                  ${(totalDebts/1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Breakdown */}
        <Card title="Asset Allocation">
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {assetBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {assetBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium ml-auto">${(item.value/1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Debt Breakdown */}
        <Card title="Debt Distribution">
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={12} width={80} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {debtBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4">
            {debtBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Savings Goals */}
      <Card title="Savings Goals Progress">
        <div className="space-y-4">
          {[
            { name: 'Emergency Fund', current: data.investments.reduce((sum, i) => i.type === 'savings' ? sum + parseFloat(i.value) : sum, 0), target: 30000, color: '#3B82F6' },
            { name: 'Investment Goal', current: data.investments.reduce((sum, i) => i.type !== 'savings' ? sum + parseFloat(i.value) : sum, 0), target: 250000, color: '#10B981' }
          ].filter(goal => goal.current > 0 || goal.target > 0).map((goal, index) => {
            const progress = Math.min(100, (goal.current / goal.target) * 100);
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{goal.name}</span>
                  <span className="text-sm text-gray-500">
                    ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: goal.color }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-right">{progress.toFixed(0)}% complete</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card title="Recent Recommendations" subtitle="AI-powered insights for your finances">
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === 'mortgage' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'credit' ? 'bg-purple-100 text-purple-600' :
                    activity.type === 'debt' ? 'bg-green-100 text-green-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {activity.type === 'mortgage' && <TrendingUp className="w-5 h-5" />}
                    {activity.type === 'credit' && <CreditCard className="w-5 h-5" />}
                    {activity.type === 'debt' && <Target className="w-5 h-5" />}
                    {activity.type === 'savings' && <PiggyBank className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{activity.title}</h4>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate?.('mortgage')} className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors group">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold">Analyze Mortgage</h4>
              <p className="text-xs text-gray-500 mt-1">Check refinance options</p>
            </button>
            <button onClick={() => onNavigate?.('credit-card')} className="p-4 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors group">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold">Optimize Cards</h4>
              <p className="text-xs text-gray-500 mt-1">Reduce credit card debt</p>
            </button>
            <button onClick={() => onNavigate?.('debt')} className="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors group">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold">Debt Payoff Plan</h4>
              <p className="text-xs text-gray-500 mt-1">Create payoff strategy</p>
            </button>
            <button onClick={() => onNavigate?.('investments')} className="p-4 bg-orange-50 rounded-lg text-left hover:bg-orange-100 transition-colors group">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PieChartIcon className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold">Track Investments</h4>
              <p className="text-xs text-gray-500 mt-1">Manage your portfolio</p>
            </button>
          </div>
        </Card>
      </div>

      {/* Alert Banner */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-4">
        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-900">Opportunity: Lower Your Mortgage Rate</h4>
          <p className="text-sm text-yellow-700">
            Current rates are 0.5% lower than your existing rate. You could save $200/month by refinancing.
          </p>
        </div>
        <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default Dashboard;