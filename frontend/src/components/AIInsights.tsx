import React from 'react';
import { Lightbulb, TrendingDown, TrendingUp, AlertCircle, ArrowRight, Wallet, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import Card from './ui/Card';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_INVESTMENTS, SAMPLE_INCOME, SAMPLE_CREDIT_CARDS, SAMPLE_DEBTS, SAMPLE_MORTGAGES, SAMPLE_TRANSACTIONS, SAMPLE_BUDGETS } from '../lib/sampleData';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';


interface Suggestion {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  category: 'mortgage' | 'debt' | 'savings' | 'investment' | 'tax';
  title: string;
  description: string;
  impact: string;
  action: string;
  icon: any;
}

const AIInsights: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({
    investments: [] as any[],
    income: [] as any[],
    creditCards: [] as any[],
    debts: [] as any[],
    mortgages: [] as any[],
    transactions: [] as any[],
    budgets: [] as any[]
  });

  React.useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      const savedTx = localStorage.getItem('guest_transactions');
      setData({
        investments: SAMPLE_INVESTMENTS,
        income: SAMPLE_INCOME,
        creditCards: SAMPLE_CREDIT_CARDS,
        debts: SAMPLE_DEBTS,
        mortgages: SAMPLE_MORTGAGES,
        transactions: savedTx ? JSON.parse(savedTx) : SAMPLE_TRANSACTIONS,
        budgets: SAMPLE_BUDGETS
      });
      setLoading(false);
      return;
    }

    const collections = ['investments', 'income_sources', 'credit_cards', 'debts', 'mortgages', 'transactions'];
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
    
    // Budgets are not stored in Firebase in the current implementation, using static samples
    setData(prev => ({ ...prev, budgets: SAMPLE_BUDGETS }));

    setLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // 1. Mortgage Refinance Suggestion
    const marketRate = 4.85; // Current demo market rate
    data.mortgages.forEach(m => {
      const currentRate = parseFloat(m.interestRate);
      if (currentRate > marketRate + 0.5) {
        const savings = (parseFloat(m.currentBalance) * (currentRate - marketRate) / 100) / 12;
        suggestions.push({
          id: `mortgage-${m.id}`,
          type: 'warning',
          category: 'mortgage',
          title: `Refinance Opportunity: ${m.name}`,
          description: `Your current rate is ${currentRate}%, but market rates are around ${marketRate}%. Refinancing could save you significant interest.`,
          impact: `Save ~$${Math.round(savings)}/month`,
          action: 'Calculate Refinance Savings',
          icon: TrendingDown
        });
      }
    });

    // 2. High Interest Debt Suggestion
    const highInterestCards = data.creditCards.filter(cc => parseFloat(cc.apr) > 15 && parseFloat(cc.balance) > 0);
    if (highInterestCards.length > 0) {
      const totalHighDebt = highInterestCards.reduce((sum, cc) => sum + parseFloat(cc.balance), 0);
      suggestions.push({
        id: 'high-interest-debt',
        type: 'critical',
        category: 'debt',
        title: 'Consolidate High-Interest Debt',
        description: `You have ${highInterestCards.length} credit cards with APRs over 15%. Total balance: $${totalHighDebt.toLocaleString()}.`,
        impact: 'Reduce interest costs by 60%+',
        action: 'Explore Balance Transfer Cards',
        icon: AlertCircle
      });
    }

    // 3. Emergency Fund Suggestion (Dynamic based on budget limits)
    const monthlyBudgetLimit = data.budgets.reduce((sum, b) => sum + parseFloat(b.limit || '0'), 0) || 3000;
    const savings = data.investments.filter(i => i.type === 'savings').reduce((sum, i) => sum + parseFloat(i.value), 0);
    
    if (savings < monthlyBudgetLimit * 3) {
      suggestions.push({
        id: 'emergency-fund',
        type: 'warning',
        category: 'savings',
        title: 'Boost Emergency Fund',
        description: `Your liquid savings ($${savings.toLocaleString()}) are below the recommended 3-6 months of expenses based on your budget (~$${Math.round(monthlyBudgetLimit * 3).toLocaleString()}).`,
        impact: 'Financial security & peace of mind',
        action: 'Set Up Automated Transfer',
        icon: ShieldCheck
      });
    }

    // 4. TFSA/RRSP Contribution
    const tfsa = data.investments.find(i => i.type === 'tfsa');
    if (!tfsa || parseFloat(tfsa.value) < 10000) {
      suggestions.push({
        id: 'tfsa-contribution',
        type: 'info',
        category: 'tax',
        title: 'Maximize TFSA Contribution',
        description: 'You may have unused TFSA contribution room. Investing in a TFSA allows your gains to grow tax-free.',
        impact: 'Tax-free growth on investments',
        action: 'View Contribution Limits',
        icon: Wallet
      });
    }

    // 5. Debt Payoff Strategy (Dynamic Snowball vs Avalanche)
    if (data.debts.length > 1) {
        const balances = data.debts.map(d => parseFloat(d.balance));
        const smallestBalance = Math.min(...balances);
        const hasSmallBalance = smallestBalance < 1000;

        if (hasSmallBalance) {
            suggestions.push({
                id: 'debt-strategy-snowball',
                type: 'success',
                category: 'debt',
                title: 'Psychological Win: Debt Snowball',
                description: `You have a small debt balance of $${smallestBalance}. Pay this off first (Snowball method) to build momentum before tackling larger debts.`,
                impact: 'Quick win & motivation boost',
                action: 'Set Up Payoff Plan',
                icon: Zap
            });
        } else {
            suggestions.push({
                id: 'debt-strategy-avalanche',
                type: 'success',
                category: 'debt',
                title: 'Optimize Debt Payoff Strategy',
                description: 'You have multiple large debts. Using the Avalanche method (highest interest first) is mathematically optimal and could save you months of payments.',
                impact: 'Be debt-free 15% faster',
                action: 'View Payoff Plan',
                icon: Zap
            });
        }
    }

    // 6. Budget Insights
    if (data.transactions.length > 0 && data.budgets.length > 0) {
        data.budgets.forEach(budget => {
            const spent = data.transactions
                .filter(tx => tx.category === budget.category)
                .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            
            if (spent > parseFloat(budget.limit)) {
                suggestions.push({
                    id: `budget-${budget.category}`,
                    type: 'critical',
                    category: 'savings',
                    title: `Over Budget: ${budget.category}`,
                    description: `You have spent $${spent.toFixed(2)} in ${budget.category}, exceeding your limit of $${budget.limit}. Consider reducing spending here next month.`,
                    impact: `Save $${(spent - parseFloat(budget.limit)).toFixed(2)} by adhering to budget`,
                    action: 'Review Budget',
                    icon: AlertCircle
                });
            }
        });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Financial Insights</h2>
          <p className="text-gray-500">Personalized recommendations based on your unique financial profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <Card 
              key={suggestion.id}
              className={`border-l-4 ${
                suggestion.type === 'critical' ? 'border-l-red-500' :
                suggestion.type === 'warning' ? 'border-l-amber-500' :
                suggestion.type === 'success' ? 'border-l-emerald-500' :
                'border-l-blue-500'
              } hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  suggestion.type === 'critical' ? 'bg-red-50 text-red-600' :
                  suggestion.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                  suggestion.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  <suggestion.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      suggestion.type === 'critical' ? 'bg-red-100 text-red-700' :
                      suggestion.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                      suggestion.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {suggestion.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mt-2">{suggestion.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {suggestion.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-gray-400">Potential Impact</span>
                      <span className={`text-sm font-bold ${
                        suggestion.type === 'critical' ? 'text-red-600' :
                        suggestion.type === 'warning' ? 'text-amber-600' :
                        suggestion.type === 'success' ? 'text-emerald-600' :
                        'text-blue-600'
                      }`}>
                        {suggestion.impact}
                      </span>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors group">
                      {suggestion.action}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Your Finances Look Great!</h3>
            <p className="text-gray-500 mt-2">We couldn't find any urgent issues. Keep up the good work!</p>
          </div>
        )}
      </div>

      {/* Market Commentary Card */}
      <Card className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold">Market Intelligence April 2026</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <h4 className="text-sm font-bold text-blue-300 mb-2 uppercase tracking-wider">Interest Rates</h4>
              <p className="text-sm leading-relaxed">Bank of Canada signaling a potential 25bps cut next month. Fixed rates are already pricing this in.</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <h4 className="text-sm font-bold text-blue-300 mb-2 uppercase tracking-wider">Inflation</h4>
              <p className="text-sm leading-relaxed">CPI stabilized at 2.1%. Cost of living pressures easing slightly, allowing for more aggressive debt payoff.</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <h4 className="text-sm font-bold text-blue-300 mb-2 uppercase tracking-wider">Housing Market</h4>
              <p className="text-sm leading-relaxed">Inventory rising in major urban centers. Equity growth slowing but rental demand remains at record highs.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIInsights;
