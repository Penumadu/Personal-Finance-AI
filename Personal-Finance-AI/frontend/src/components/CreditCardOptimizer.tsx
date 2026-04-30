import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CreditCard, ArrowUpRight, Zap, Target, Plus, X } from 'lucide-react';
import Card from './ui/Card';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_CREDIT_CARDS } from '../lib/sampleData';

interface CardData {
  card_name: string;
  balance: string;
  apr: string;
  credit_limit: string;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const CreditCardOptimizer: React.FC = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      setCards(SAMPLE_CREDIT_CARDS);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'credit_cards'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cardData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setCards(cardData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);
  
  const [activeTab, setActiveTab] = useState<'cards' | 'optimize' | 'transfer'>('cards');
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [balanceTransferResult, setBalanceTransferResult] = useState<any>(null);
  
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState<CardData>({ card_name: '', balance: '', apr: '', credit_limit: '' });
  const [optimizeForm, setOptimizeForm] = useState({ total_debt: '9500', monthly_payment: '500', credit_score: '720' });
  const [transferForm, setTransferForm] = useState({ current_balance: '5000', current_apr: '24.99', promo_apr: '0', promo_months: '18', transfer_fee: '3' });

  const handleAddCard = async () => {
    if (!newCard.card_name || !user) return;
    
    if (user.isAnonymous) {
      const id = Math.random().toString(36).substring(7);
      setCards([...cards, { ...newCard, id } as any]);
      setShowAddCard(false);
      setNewCard({ card_name: '', balance: '', apr: '', credit_limit: '' });
      return;
    }

    try {
      await addDoc(collection(db, 'credit_cards'), {
        ...newCard,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      setShowAddCard(false);
      setNewCard({ card_name: '', balance: '', apr: '', credit_limit: '' });
    } catch (error) {
      console.error("Error adding card: ", error);
      alert("Failed to add card. " + (user.isAnonymous ? "Guest mode issue." : "Check permissions."));
    }
  };

  const removeCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    
    if (user?.isAnonymous) {
      setCards(cards.filter((c: any) => c.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'credit_cards', id));
    } catch (error) {
      console.error("Error removing card: ", error);
    }
  };

  const optimizeCards = () => {
    setOptimizationResult({
      current_state: { total_debt: parseFloat(optimizeForm.total_debt), average_apr: 22.5, monthly_interest: (parseFloat(optimizeForm.total_debt) * 22.5) / 100 / 12 },
      recommendations: [
        { type: 'balance_transfer', title: 'Balance Transfer', description: 'Transfer to 0% APR card for 18 months', savings: 3200, icon: 'transfer' },
        { type: 'rate_negotiation', title: 'Negotiate Rate', description: 'Call issuer to lower your APR', savings: 1500, icon: 'phone' },
        { type: 'avalanche', title: 'Use Avalanche Method', description: 'Pay highest APR first for maximum savings', savings: 800, icon: 'fire' }
      ],
      action_plan: [
        { step: 1, action: 'Apply for balance transfer card', impact: 'high' },
        { step: 2, action: 'Call to negotiate rates', impact: 'medium' },
        { step: 3, action: 'Implement avalanche strategy', impact: 'medium' }
      ]
    });
  };

  const calculateBalanceTransfer = () => {
    const balance = parseFloat(transferForm.current_balance);
    const currentApr = parseFloat(transferForm.current_apr);
    const promoApr = parseFloat(transferForm.promo_apr);
    const promoMonths = parseInt(transferForm.promo_months);
    const fee = parseFloat(transferForm.transfer_fee);

    const currentMonthlyInterest = (balance * currentApr / 100) / 12;
    const promoMonthlyInterest = promoApr === 0 ? 0 : (balance * promoApr / 100) / 12;
    const feeAmount = balance * (fee / 100);
    const savings = (currentMonthlyInterest - promoMonthlyInterest) * promoMonths - feeAmount;

    setBalanceTransferResult({ current_balance: balance, current_monthly_interest: currentMonthlyInterest, promo_monthly_interest: promoMonthlyInterest, transfer_fee: feeAmount, total_savings: savings, recommendation: savings > 500 ? 'Recommended' : 'Consider alternatives' });
  };

  const getCardsPieData = () => cards.map(card => ({ name: card.card_name, value: parseFloat(card.balance) }));

  const totalDebt = cards.reduce((sum, c) => sum + parseFloat(c.balance || '0'), 0);
  const avgApr = cards.length > 0 ? cards.reduce((sum, c) => sum + parseFloat(c.apr || '0'), 0) / cards.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Card Optimizer</h2>
            <p className="text-xs sm:text-sm text-gray-500">Analyze and optimize your credit card debt</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {['cards', 'optimize', 'transfer'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab === 'transfer' ? 'Balance Transfer' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Your Credit Cards" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card: any, index) => {
                const utilization = (parseFloat(card.balance) / parseFloat(card.credit_limit)) * 100;
                return (
                  <div key={card.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 relative group">
                    <button onClick={() => removeCard(card.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><CreditCard className="w-5 h-5 text-white" /></div>
                        <h4 className="font-semibold">{card.card_name}</h4>
                      </div>
                      <span className={`text-sm font-medium ${utilization > 50 ? 'text-red-600' : utilization > 30 ? 'text-yellow-600' : 'text-green-600'}`}>{utilization.toFixed(0)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><p className="text-gray-500">Balance</p><p className="font-semibold">${parseFloat(card.balance).toLocaleString()}</p></div>
                      <div><p className="text-gray-500">APR</p><p className="font-semibold">{card.apr}%</p></div>
                      <div><p className="text-gray-500">Limit</p><p className="font-semibold">${parseFloat(card.credit_limit).toLocaleString()}</p></div>
                    </div>
                  </div>
                );
              })}
              <div className="p-4 border border-dashed border-gray-300 rounded-lg flex items-center justify-center min-h-[140px]">
                <button onClick={() => setShowAddCard(true)} className="flex flex-col items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors">
                  <Plus className="w-8 h-8" />
                  <span className="text-sm font-medium">Add New Card</span>
                </button>
              </div>
            </div>
          </Card>

          {showAddCard && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Add Credit Card</h3>
                  <button onClick={() => setShowAddCard(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Name</label>
                    <input type="text" placeholder="e.g. TD Cash Back" value={newCard.card_name} onChange={e => setNewCard({...newCard, card_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Balance ($)</label>
                      <input type="number" value={newCard.balance} onChange={e => setNewCard({...newCard, balance: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">APR (%)</label>
                      <input type="number" step="0.01" value={newCard.apr} onChange={e => setNewCard({...newCard, apr: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit ($)</label>
                    <input type="number" value={newCard.credit_limit} onChange={e => setNewCard({...newCard, credit_limit: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <button onClick={handleAddCard} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20">Save Card</button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Card title="Summary">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center"><p className="text-sm text-red-600 font-medium">Total Debt</p><p className="text-2xl font-bold text-red-900">${totalDebt.toLocaleString()}</p></div>
                <div className="p-4 bg-blue-50 rounded-lg text-center"><p className="text-sm text-blue-600 font-medium">Avg APR</p><p className="text-2xl font-bold text-blue-900">{avgApr.toFixed(1)}%</p></div>
              </div>
            </Card>
            <Card title="Debt Distribution">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={getCardsPieData()} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value">
                      {getCardsPieData().map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {cards.map((card, index) => <div key={index} className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{card.card_name}</div>)}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'optimize' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Optimization Settings">
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Debt</label><input type="number" value={optimizeForm.total_debt} onChange={e => setOptimizeForm({ ...optimizeForm, total_debt: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment</label><input type="number" value={optimizeForm.monthly_payment} onChange={e => setOptimizeForm({ ...optimizeForm, monthly_payment: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Credit Score</label><input type="number" value={optimizeForm.credit_score} onChange={e => setOptimizeForm({ ...optimizeForm, credit_score: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <button onClick={optimizeCards} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"><Zap className="w-5 h-5" />Optimize Cards</button>
            </div>
          </Card>
          {optimizationResult && (
            <Card title="Optimization Results">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Monthly Interest Cost</p><p className="text-2xl font-bold text-gray-900">${optimizationResult.current_state.monthly_interest.toFixed(2)}</p></div>
                {optimizationResult.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                    <div><h4 className="font-semibold">{rec.title}</h4><p className="text-sm text-gray-600">{rec.description}</p></div>
                    <span className="text-green-600 font-bold flex items-center gap-1"><ArrowUpRight className="w-4 h-4" />${rec.savings.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Balance Transfer Calculator">
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label><input type="number" value={transferForm.current_balance} onChange={e => setTransferForm({ ...transferForm, current_balance: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Current APR %</label><input type="number" step="0.01" value={transferForm.current_apr} onChange={e => setTransferForm({ ...transferForm, current_apr: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Promo APR %</label><input type="number" step="0.01" value={transferForm.promo_apr} onChange={e => setTransferForm({ ...transferForm, promo_apr: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Promo Months</label><input type="number" value={transferForm.promo_months} onChange={e => setTransferForm({ ...transferForm, promo_months: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Transfer Fee %</label><input type="number" step="0.1" value={transferForm.transfer_fee} onChange={e => setTransferForm({ ...transferForm, transfer_fee: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <button onClick={calculateBalanceTransfer} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"><Target className="w-5 h-5" />Calculate Savings</button>
            </div>
          </Card>
          {balanceTransferResult && (
            <Card title="Transfer Analysis">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg"><p className="text-sm text-red-600">Current Monthly Interest</p><p className="text-xl font-bold text-red-900">${balanceTransferResult.current_monthly_interest.toFixed(2)}</p></div>
                  <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm text-green-600">Promo Monthly Interest</p><p className="text-xl font-bold text-green-900">${balanceTransferResult.promo_monthly_interest.toFixed(2)}</p></div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg"><p className="text-sm text-blue-600">Transfer Fee</p><p className="text-xl font-bold text-blue-900">${balanceTransferResult.transfer_fee.toFixed(2)}</p></div>
                <div className={`p-4 rounded-lg ${balanceTransferResult.total_savings > 500 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <p className={`text-sm font-medium ${balanceTransferResult.total_savings > 500 ? 'text-green-700' : 'text-yellow-700'}`}>Total Savings</p>
                  <p className={`text-3xl font-bold ${balanceTransferResult.total_savings > 500 ? 'text-green-900' : 'text-yellow-900'}`}>${balanceTransferResult.total_savings.toFixed(2)}</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${balanceTransferResult.total_savings > 500 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{balanceTransferResult.recommendation}</div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditCardOptimizer;