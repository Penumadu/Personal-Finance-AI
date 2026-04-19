import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, DollarSign, TrendingUp, Calendar, Plus, Trophy, X } from 'lucide-react';
import Card from './ui/Card';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_DEBTS } from '../lib/sampleData';

interface Debt {
  id: string;
  name: string;
  balance: string;
  interest_rate: string;
  minimum_payment: string;
}

const DebtPayoffPlanner: React.FC = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      setDebts(SAMPLE_DEBTS);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'debts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setDebts(debtData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const [monthlyBudget, setMonthlyBudget] = useState('800');
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [result, setResult] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newDebt, setNewDebt] = useState<Debt>({
    id: '', name: '', balance: '', interest_rate: '', minimum_payment: ''
  });

  const calculatePayoff = () => {
    const sortedDebts = [...debts].sort((a, b) => {
      if (strategy === 'avalanche') {
        return parseFloat(b.interest_rate) - parseFloat(a.interest_rate);
      } else {
        return parseFloat(a.balance) - parseFloat(b.balance);
      }
    });

    const balances = sortedDebts.map(d => parseFloat(d.balance));
    const rates = sortedDebts.map(d => parseFloat(d.interest_rate) / 100 / 12);
    const payments = sortedDebts.map(d => parseFloat(d.minimum_payment));
    const budget = parseFloat(monthlyBudget);
    
    let month = 0;
    let totalInterest = 0;
    const projections = [];
    
    while (balances.some(b => b > 0) && month < 360) {
      month++;
      for (let i = 0; i < balances.length; i++) {
        if (balances[i] <= 0) continue;
        const interest = balances[i] * rates[i];
        totalInterest += interest;
        balances[i] += interest;
        let payment = payments[i];
        if (i === 0) {
          payment += Math.min(budget - payments.reduce((s, p, idx) => idx > 0 ? s + p : s, 0), budget * 0.5);
        }
        payment = Math.min(payment, balances[i]);
        balances[i] -= payment;
      }
      if (month % 6 === 0) {
        projections.push({ month, total: Math.round(balances.reduce((a, b) => a + b, 0)) });
      }
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + month);

    const milestones = [];
    const originalBalances = sortedDebts.map(d => parseFloat(d.balance));
    let runningBalances = [...originalBalances];
    
    for (let m = 1; m <= month && milestones.length < 5; m++) {
      for (let i = 0; i < runningBalances.length; i++) {
        if (runningBalances[i] > 0) {
          runningBalances[i] -= payments[i];
          if (runningBalances[i] <= 0 && originalBalances[i] > 0) {
            milestones.push({ month: m, celebration: `${sortedDebts[i].name} paid off!` });
          }
        }
      }
    }

    setResult({
      strategy,
      months_to_payoff: month,
      total_interest: Math.round(totalInterest),
      payoff_date: payoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      order: sortedDebts,
      milestones,
      projections
    });
  };

  const addDebt = async () => {
    if (newDebt.name && newDebt.balance && user) {
      try {
        await addDoc(collection(db, 'debts'), {
          ...newDebt,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
        setNewDebt({ id: '', name: '', balance: '', interest_rate: '', minimum_payment: '' });
        setShowAddModal(false);
      } catch (error) {
        console.error("Error adding debt: ", error);
      }
    }
  };

  const removeDebt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this debt?')) return;
    try {
      await deleteDoc(doc(db, 'debts', id));
    } catch (error) {
      console.error("Error removing debt: ", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Debt Payoff Planner</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Plan your debt-free journey with smart strategies</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />Add Debt
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Your Debts">
          <div className="space-y-3">
            {debts.map((debt, index) => (
              <div key={debt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                <button onClick={() => removeDebt(debt.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{debt.name}</h4>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">#{index + 1}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-gray-500">Balance</p><p className="font-semibold">${parseFloat(debt.balance).toLocaleString()}</p></div>
                  <div><p className="text-gray-500">APR</p><p className="font-semibold">{debt.interest_rate}%</p></div>
                  <div><p className="text-gray-500">Min Payment</p><p className="font-semibold">${debt.minimum_payment}</p></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">Payoff Strategy</h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setStrategy('avalanche')} className={`p-4 rounded-lg border-2 transition-colors flex-1 ${strategy === 'avalanche' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-blue-600" /><span className="font-semibold">Avalanche</span></div>
                <p className="text-xs text-gray-500">Highest APR first</p>
              </button>
              <button onClick={() => setStrategy('snowball')} className={`p-4 rounded-lg border-2 transition-colors flex-1 ${strategy === 'snowball' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-purple-600" /><span className="font-semibold">Snowball</span></div>
                <p className="text-xs text-gray-500">Smallest balance first</p>
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Debt Budget</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-lg" />
            </div>
          </div>

          <button onClick={calculatePayoff} className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" />Calculate Payoff Plan
          </button>
        </Card>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-medium">Debt-Free Date</p>
                    <p className="text-xl font-bold text-blue-900 mt-1">{result.payoff_date}</p>
                    <p className="text-xs text-blue-600 mt-1">{result.months_to_payoff} months</p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100">
                  <div className="text-center">
                    <p className="text-sm text-red-600 font-medium">Total Interest</p>
                    <p className="text-xl font-bold text-red-900 mt-1">${result.total_interest.toLocaleString()}</p>
                  </div>
                </Card>
              </div>

              <Card title="Payoff Projection">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.projections}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={10} />
                      <YAxis stroke="#6B7280" fontSize={10} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="#3B82F620" strokeWidth={2} name="Remaining Debt" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Payoff Order" subtitle={`Based on ${result.strategy} method`}>
                <div className="space-y-3">
                  {result.order.map((debt: any, index: number) => (
                    <div key={debt.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                      <div className="flex-1">
                        <h4 className="font-medium">{debt.name}</h4>
                        <p className="text-sm text-gray-500">${parseFloat(debt.balance).toLocaleString()}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">{debt.interest_rate}% APR</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Milestones" subtitle="Celebrate your progress">
                <div className="space-y-2">
                  {result.milestones.map((milestone: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <div>
                        <span className="text-sm font-bold text-green-800">Month {milestone.month}</span>
                        <p className="text-green-700 font-medium">{milestone.celebration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-400"><Target className="w-12 h-12 mx-auto mb-4" /><p>Add your debts and calculate your payoff plan</p></div>
            </Card>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Debt</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Debt Name</label><input type="text" value={newDebt.name} onChange={e => setNewDebt({ ...newDebt, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Credit Card" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Balance</label><input type="number" value={newDebt.balance} onChange={e => setNewDebt({ ...newDebt, balance: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">APR %</label><input type="number" step="0.01" value={newDebt.interest_rate} onChange={e => setNewDebt({ ...newDebt, interest_rate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Payment</label><input type="number" value={newDebt.minimum_payment} onChange={e => setNewDebt({ ...newDebt, minimum_payment: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              </div>
              <button onClick={addDebt} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Add Debt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtPayoffPlanner;