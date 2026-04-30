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
  // Rich detail fields for expanded guidance
  steps?: string[];
  breakdown?: { label: string; value: string; highlight?: boolean }[];
  lenderTip?: string;
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

    // 1. Mortgage Refinance Suggestion (Detailed)
    const marketRate = 4.85; // Current demo market rate
    data.mortgages.forEach(m => {
      const currentRate = parseFloat(m.interestRate);
      const balance = parseFloat(m.currentBalance);
      const termMonths = parseInt(m.termMonths) || 300;
      const renewalDate = m.renewalDate ? new Date(m.renewalDate) : null;
      const monthsToRenewal = renewalDate
        ? Math.max(0, Math.round((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
        : 99;

      if (currentRate > marketRate + 0.5) {
        const monthlySavings = (balance * (currentRate - marketRate) / 100) / 12;
        const yearlySavings = monthlySavings * 12;
        const remainingMonths = Math.min(termMonths, 240);
        const totalInterestSaved = monthlySavings * remainingMonths;
        const estClosingCosts = 2500;
        const breakEvenMonths = Math.ceil(estClosingCosts / monthlySavings);
        const rateGap = (currentRate - marketRate).toFixed(2);

        if (monthsToRenewal >= 6) {
          const estimatedPenalty = Math.round(balance * 0.03);
          suggestions.push({
            id: `mortgage-${m.id}`,
            type: 'warning',
            category: 'mortgage',
            title: `Refinance Opportunity: ${m.name}`,
            description: `Your rate of ${currentRate}% is ${rateGap}% above today's market rate (~${marketRate}%). You are ${monthsToRenewal} months from renewal. Refinancing now could save you money, but involves a prepayment penalty estimated at ~$${estimatedPenalty.toLocaleString()}. Review the break-even analysis below before acting.`,
            impact: `~$${Math.round(monthlySavings).toLocaleString()}/mo · $${Math.round(yearlySavings).toLocaleString()}/yr`,
            action: 'Get a Rate Quote Today',
            icon: TrendingDown,
            steps: [
              'Request a mortgage statement from your lender to confirm your exact prepayment penalty (IRD or 3-month interest rule).',
              `Shop competing lenders: Try RateHub.ca, Nesto, or your bank's mortgage specialist for rates around ${marketRate}%.`,
              `Calculate break-even: With ~$${estClosingCosts.toLocaleString()} in costs + ~$${estimatedPenalty.toLocaleString()} penalty, you need ~${Math.ceil((estClosingCosts + estimatedPenalty) / monthlySavings)} months to break even.`,
              'Ask your current lender about a "blend-and-extend" — it lets you blend your old and new rate without a full prepayment penalty.',
              'Lock in a fixed rate before any Bank of Canada rate increases. Consider a 3- or 5-year fixed term.'
            ],
            breakdown: [
              { label: 'Current Rate', value: `${currentRate}%` },
              { label: 'Market Rate (est.)', value: `${marketRate}%` },
              { label: 'Monthly Savings', value: `$${Math.round(monthlySavings).toLocaleString()}`, highlight: true },
              { label: 'Yearly Savings', value: `$${Math.round(yearlySavings).toLocaleString()}`, highlight: true },
              { label: 'Est. Prepayment Penalty', value: `~$${estimatedPenalty.toLocaleString()}` },
              { label: 'Closing Costs', value: `~$${estClosingCosts.toLocaleString()}` },
              { label: 'Break-Even Period', value: `~${Math.ceil((estClosingCosts + estimatedPenalty) / monthlySavings)} months` },
              { label: 'Net Savings (after break-even)', value: `~$${Math.round(totalInterestSaved - estClosingCosts - estimatedPenalty).toLocaleString()}`, highlight: true }
            ],
            lenderTip: '💡 Tip: Ask your current lender for a "blend-and-extend" — it lets you combine your old and new rate without a full prepayment penalty. A mortgage broker at Dominion Lending Centres can shop 50+ lenders for free.'
          });
        } else {
          suggestions.push({
            id: `mortgage-${m.id}`,
            type: 'critical',
            category: 'mortgage',
            title: `Act Now — Renewal Approaching: ${m.name}`,
            description: `Your mortgage renews in ${monthsToRenewal} months. Your current rate of ${currentRate}% is ${rateGap}% above market. This is the BEST time to shop — you can switch lenders with no prepayment penalty.`,
            impact: `~$${Math.round(monthlySavings).toLocaleString()}/mo · $${Math.round(yearlySavings).toLocaleString()}/yr · ~$${Math.round(totalInterestSaved).toLocaleString()} over term`,
            action: 'Start Rate Shopping Now',
            icon: TrendingDown,
            steps: [
              'Start shopping NOW — lenders allow you to lock in a rate 120 days before renewal with no penalty.',
              'Compare offers from at least 3 sources: your current lender, a mortgage broker (e.g., Dominion Lending), and a digital lender (e.g., Nesto, True North Mortgage).',
              `Request written rate offers. Target ${marketRate}% or lower for a 5-year fixed.`,
              'Review the full terms — look at prepayment privileges (10-20% extra annually?), portability, and early-break penalties.',
              'If keeping the property long-term, choose a 5-year fixed. If you may sell in 2–3 years, consider a 3-year fixed or variable.'
            ],
            breakdown: [
              { label: 'Months to Renewal', value: `${monthsToRenewal} months` },
              { label: 'Current Rate', value: `${currentRate}%` },
              { label: 'Target Rate', value: `${marketRate}%` },
              { label: 'Monthly Savings', value: `$${Math.round(monthlySavings).toLocaleString()}`, highlight: true },
              { label: 'Yearly Savings', value: `$${Math.round(yearlySavings).toLocaleString()}`, highlight: true },
              { label: 'Prepayment Penalty', value: '✅ None (at renewal)', highlight: true },
              { label: 'Est. Savings Over Full Term', value: `~$${Math.round(totalInterestSaved).toLocaleString()}`, highlight: true }
            ],
            lenderTip: '💡 Tip: A mortgage broker shops 50+ lenders for free and can often beat your bank\'s posted rate by 0.5%+. Start at RateHub.ca or call Dominion Lending Centres.'
          });
        }
      } else if (monthsToRenewal <= 18) {
        suggestions.push({
          id: `mortgage-renewal-${m.id}`,
          type: 'info',
          category: 'mortgage',
          title: `Plan Your Renewal: ${m.name}`,
          description: `Your ${m.name} mortgage (${currentRate}%) renews in ~${monthsToRenewal} months. Your rate is competitive, but auto-renewing without shopping is the most common mortgage mistake Canadians make.`,
          impact: 'Protect your rate & avoid auto-renewal hike',
          action: 'Plan Your Renewal',
          icon: TrendingUp,
          steps: [
            `Start shopping 120 days before ${m.renewalDate} — lenders allow early rate locks with no penalty.`,
            'Your lender\'s renewal notice (~21 days before) is rarely their best offer. Never sign without comparing.',
            'Use RateHub.ca or a mortgage broker to benchmark your lender\'s offer.',
            'Call your lender\'s retention team and use competing quotes as negotiating leverage.',
            'Decide on your term: 5-year fixed for stability; variable if you expect rates to fall.'
          ],
          breakdown: [
            { label: 'Current Rate', value: `${currentRate}%` },
            { label: 'Market Rate (est.)', value: `${marketRate}%` },
            { label: 'Months to Renewal', value: `${monthsToRenewal}` },
            { label: 'Remaining Balance', value: `$${balance.toLocaleString()}` }
          ],
          lenderTip: '💡 Tip: Even negotiating 0.1% off your rate saves thousands over a 5-year term on a $500K mortgage.'
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

                  {/* Financial Breakdown Table */}
                  {suggestion.breakdown && suggestion.breakdown.length > 0 && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-gray-100">
                      <div className="bg-gray-50 px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Financial Breakdown</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {suggestion.breakdown.map((row, i) => (
                          <div key={i} className={`flex items-center justify-between px-3 py-2 ${
                            row.highlight ? 'bg-emerald-50' : 'bg-white'
                          }`}>
                            <span className="text-xs text-gray-500">{row.label}</span>
                            <span className={`text-xs font-bold ${
                              row.highlight ? 'text-emerald-700' : 'text-gray-800'
                            }`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step-by-step Action Plan */}
                  {suggestion.steps && suggestion.steps.length > 0 && (
                    <div className="mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Your Action Plan</span>
                      <ol className="mt-2 space-y-2">
                        {suggestion.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                              suggestion.type === 'critical' ? 'bg-red-100 text-red-700' :
                              suggestion.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>{i + 1}</span>
                            <span className="text-xs text-gray-600 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Lender Tip */}
                  {suggestion.lenderTip && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs text-blue-700 leading-relaxed">{suggestion.lenderTip}</p>
                    </div>
                  )}

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
