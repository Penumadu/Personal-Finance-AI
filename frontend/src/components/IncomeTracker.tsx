import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Plus, Trash2, TrendingUp, Calendar, PiggyBank, X } from 'lucide-react';
import Card from './ui/Card';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_INCOME } from '../lib/sampleData';

interface IncomeSource {
  id: string;
  source_type: string;
  source_name: string;
  amount: string;
  frequency: string;
}

const typeColors: Record<string, string> = {
  salary: '#3B82F6',
  freelance: '#8B5CF6',
  investment: '#10B981',
  rental: '#F59E0B',
  benefits: '#06B6D4',
  other: '#6B7280'
};

const frequencyMultipliers: Record<string, number> = {
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  quarterly: 0.33,
  yearly: 0.0833
};

const IncomeTracker: React.FC = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      setSources(SAMPLE_INCOME);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'income_sources'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sourceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setSources(sourceData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState<IncomeSource>({
    id: '',
    source_type: 'salary',
    source_name: '',
    amount: '',
    frequency: 'monthly'
  });

  const calculateMonthlyIncome = () => {
    return sources.reduce((sum, source) => {
      const multiplier = frequencyMultipliers[source.frequency] || 1;
      return sum + parseFloat(source.amount || '0') * multiplier;
    }, 0);
  };

  const getSourceBreakdown = () => {
    return sources.map(source => {
      const multiplier = frequencyMultipliers[source.frequency] || 1;
      const monthlyAmount = parseFloat(source.amount || '0') * multiplier;
      return {
        name: source.source_name,
        value: monthlyAmount,
        color: typeColors[source.source_type] || '#6B7280'
      };
    });
  };

  const getMonthlyTrend = () => {
    const monthly = calculateMonthlyIncome();
    return [
      { month: 'Jan', income: monthly * 0.95 },
      { month: 'Feb', income: monthly * 0.98 },
      { month: 'Mar', income: monthly * 1.02 },
      { month: 'Apr', income: monthly },
      { month: 'May', income: monthly * 1.05 },
      { month: 'Jun', income: monthly * 1.03 }
    ];
  };

  const addSource = async () => {
    if (newSource.source_name && newSource.amount && user) {
      if (user.isAnonymous) {
        const id = Math.random().toString(36).substring(7);
        setSources([...sources, { ...newSource, id }]);
        setNewSource({ id: '', source_type: 'salary', source_name: '', amount: '', frequency: 'monthly' });
        setShowAddModal(false);
        return;
      }
      
      try {
        await addDoc(collection(db, 'income_sources'), {
          ...newSource,
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
        setNewSource({ id: '', source_type: 'salary', source_name: '', amount: '', frequency: 'monthly' });
        setShowAddModal(false);
      } catch (error) {
        console.error("Error adding income source: ", error);
        alert("Failed to add income source. " + (user.isAnonymous ? "Guest mode issue." : "Check permissions."));
      }
    }
  };

  const removeSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income source?')) return;
    
    if (user?.isAnonymous) {
      setSources(sources.filter(s => s.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'income_sources', id));
    } catch (error) {
      console.error("Error removing income source: ", error);
    }
  };

  const totalMonthly = calculateMonthlyIncome();
  const totalAnnual = totalMonthly * 12;
  const breakdown = getSourceBreakdown();
  const trend = getMonthlyTrend();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Income Tracker</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your income sources and track earnings</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Income
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4">
          <div className="text-center">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
            <p className="text-[10px] sm:text-sm text-green-600 font-medium uppercase tracking-wider">Monthly</p>
            <p className="text-lg sm:text-2xl font-bold text-green-900 mt-1">${totalMonthly.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4">
          <div className="text-center">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-[10px] sm:text-sm text-blue-600 font-medium uppercase tracking-wider">Annual</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-900 mt-1">${totalAnnual.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4">
          <div className="text-center">
            <PiggyBank className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-[10px] sm:text-sm text-purple-600 font-medium uppercase tracking-wider">Sources</p>
            <p className="text-lg sm:text-2xl font-bold text-purple-900 mt-1">{sources.length}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4">
          <div className="text-center">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-orange-600" />
            <p className="text-[10px] sm:text-sm text-orange-600 font-medium uppercase tracking-wider">Avg/Source</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-900 mt-1">${(totalMonthly / sources.length || 0).toFixed(0)}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Trend Chart */}
        <Card title="Income Trend" subtitle="Last 6 months projection">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Income Breakdown Pie */}
        <Card title="Income Breakdown by Source">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {breakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium ml-auto">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Income Sources List */}
      <Card title="Your Income Sources">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((source) => {
            const monthlyAmount = parseFloat(source.amount) * (frequencyMultipliers[source.frequency] || 1);
            return (
              <div key={source.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                <button
                  onClick={() => removeSource(source.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${typeColors[source.source_type]}20` }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: typeColors[source.source_type] }} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{source.source_name}</h4>
                      <span className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-200 rounded-full">
                        {source.source_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {source.frequency.charAt(0).toUpperCase() + source.frequency.slice(1)}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${parseFloat(source.amount).toLocaleString()}</p>
                    <p className="text-xs text-green-600">${monthlyAmount.toLocaleString()}/month</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add Income Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Income Source</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
                <input type="text" value={newSource.source_name} onChange={e => setNewSource({ ...newSource, source_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Acme Corp Salary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
                <select value={newSource.source_type} onChange={e => setNewSource({ ...newSource, source_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="salary">Salary</option>
                  <option value="freelance">Freelance</option>
                  <option value="investment">Investment</option>
                  <option value="rental">Rental</option>
                  <option value="benefits">Benefits</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="number" value={newSource.amount} onChange={e => setNewSource({ ...newSource, amount: e.target.value })} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select value={newSource.frequency} onChange={e => setNewSource({ ...newSource, frequency: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <button onClick={addSource} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Add Income Source</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeTracker;