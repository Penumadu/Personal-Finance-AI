import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon, Tag, AlertTriangle, Plus, X, DollarSign, TrendingDown, FileUp, Loader2, Check, AlertCircle } from 'lucide-react';
import Card from './ui/Card';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { SAMPLE_TRANSACTIONS, SAMPLE_BUDGETS, SAMPLE_MORTGAGES } from '../lib/sampleData';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  category: string;
}

interface BudgetLimit {
  category: string;
  limit: string;
}

const CATEGORIES = [
  'Housing', 'Transportation', 'Food', 'Healthcare', 'Entertainment', 'Shopping', 'Utilities', 'Other'
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'];



const BudgetAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>(SAMPLE_BUDGETS);
  const [mortgages, setMortgages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'budgets'>('overview');

  const [showAddTx, setShowAddTx] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: 'Food'
  });

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = useState<string>('');

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importedTransactions, setImportedTransactions] = useState<Transaction[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'review'>('upload');

  useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      const savedTx = localStorage.getItem('guest_transactions');
      if (savedTx) {
        setTransactions(JSON.parse(savedTx));
      } else {
        setTransactions(SAMPLE_TRANSACTIONS);
      }
      const savedBudgets = localStorage.getItem('guest_budgets');
      if (savedBudgets) {
        setBudgets(JSON.parse(savedBudgets));
      }
      setMortgages(SAMPLE_MORTGAGES);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(txData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const qMort = query(collection(db, 'mortgages'), where('userId', '==', user.uid));
    const unsubMort = onSnapshot(qMort, (snapshot) => {
      setMortgages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubBudgets = onSnapshot(doc(db, 'budgets', user.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().limits) {
        setBudgets(docSnap.data().limits);
      }
    });

    setLoading(false);
    return () => { unsubscribe(); unsubMort(); unsubBudgets(); };
  }, [user]);

  const handleAddTransaction = async () => {
    if (!newTx.description || !newTx.amount || !user) return;

    if (user.isAnonymous) {
      const id = Math.random().toString(36).substring(7);
      const updatedTx = [{ ...newTx, id } as Transaction, ...transactions];
      setTransactions(updatedTx);
      localStorage.setItem('guest_transactions', JSON.stringify(updatedTx));
      setShowAddTx(false);
      setNewTx({ date: new Date().toISOString().split('T')[0], description: '', amount: '', category: 'Food' });
      return;
    }

    try {
      await addDoc(collection(db, 'transactions'), {
        ...newTx,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      setShowAddTx(false);
      setNewTx({ date: new Date().toISOString().split('T')[0], description: '', amount: '', category: 'Food' });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert("Failed to add transaction. " + (user.isAnonymous ? "Guest mode issue." : "Check permissions."));
    }
  };

  const removeTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    if (user?.isAnonymous) {
      const updatedTx = transactions.filter(t => t.id !== id);
      setTransactions(updatedTx);
      localStorage.setItem('guest_transactions', JSON.stringify(updatedTx));
      return;
    }

    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error("Error removing transaction: ", error);
    }
  };

  const saveLimit = async (category: string) => {
    const updatedBudgets = budgets.map(b => 
      b.category === category ? { ...b, limit: editLimitValue } : b
    );
    setBudgets(updatedBudgets);
    setEditingCategory(null);

    if (user?.isAnonymous) {
      localStorage.setItem('guest_budgets', JSON.stringify(updatedBudgets));
    } else if (user) {
      try {
        await setDoc(doc(db, 'budgets', user.uid), { limits: updatedBudgets }, { merge: true });
      } catch (error) {
        console.error('Error saving budget:', error);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/cards/upload-statement', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setImportedTransactions(data.transactions);
      setImportStep('review');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload and parse statements. Please ensure the backend is running and the file is a valid CSV.');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmImport = async () => {
    if (!user || importedTransactions.length === 0) return;

    setLoading(true);
    try {
      if (user.isAnonymous) {
        const updatedTx = [...importedTransactions, ...transactions];
        setTransactions(updatedTx);
        localStorage.setItem('guest_transactions', JSON.stringify(updatedTx));
      } else {
        // Add each transaction to Firestore
        const promises = importedTransactions.map(tx => 
          addDoc(collection(db, 'transactions'), {
            date: tx.date,
            description: tx.description,
            amount: tx.amount.toString(),
            category: tx.category,
            userId: user.uid,
            createdAt: new Date().toISOString()
          })
        );
        await Promise.all(promises);
      }
      setShowImportModal(false);
      setImportedTransactions([]);
      setImportStep('upload');
      alert(`Successfully imported ${importedTransactions.length} transactions!`);
    } catch (error) {
      console.error('Error importing:', error);
      alert('Failed to import transactions.');
    } finally {
      setLoading(false);
    }
  };

  const totalMortgagePayment = mortgages.reduce((sum, m) => sum + parseFloat(m.monthlyPayment || '0'), 0);
  const totalSpent = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) + totalMortgagePayment;
  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.limit), 0);

  const spendingByCategory = CATEGORIES.map(category => {
    let spent = transactions
      .filter(tx => tx.category === category)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    if (category === 'Housing') {
      spent += totalMortgagePayment;
    }

    const limit = parseFloat(budgets.find(b => b.category === category)?.limit || '0');
    return { category, spent, limit, remaining: limit - spent };
  }).filter(item => item.spent > 0 || item.limit > 0);

  const pieData = spendingByCategory.map(item => ({
    name: item.category,
    value: item.spent
  })).filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <PieChartIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Budget Analyzer</h2>
            <p className="text-xs sm:text-sm text-gray-500">Track spending and manage budgets</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowImportModal(true)} 
            className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <FileUp className="w-4 h-4" />
            Upload Statements
          </button>
          <button 
            onClick={() => setShowAddTx(true)} 
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {['overview', 'transactions', 'budgets'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors capitalize ${activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                <p className="text-sm text-emerald-600 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <p className="text-sm text-blue-600 font-medium">Total Budget</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">${totalBudget.toLocaleString()}</p>
              </Card>
              <Card className={`bg-gradient-to-br p-4 ${totalBudget - totalSpent < 0 ? 'from-red-50 to-red-100' : 'from-indigo-50 to-indigo-100'}`}>
                <p className={`text-sm font-medium ${totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-indigo-600'}`}>Remaining</p>
                <p className={`text-2xl font-bold mt-1 ${totalBudget - totalSpent < 0 ? 'text-red-900' : 'text-indigo-900'}`}>
                  ${Math.abs(totalBudget - totalSpent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {totalBudget - totalSpent < 0 && ' (Over)'}
                </p>
              </Card>
            </div>

            <Card title="Budget vs Spending">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingByCategory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" fontSize={12} tickMargin={10} />
                    <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="limit" name="Budget Limit" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Actual Spent" radius={[4, 4, 0, 0]}>
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.spent > entry.limit ? '#EF4444' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Spending Breakdown">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.sort((a, b) => b.value - a.value).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold">${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Insights
              </h3>
              <div className="mt-3 space-y-2">
                {spendingByCategory.filter(c => c.spent > c.limit).length > 0 ? (
                  spendingByCategory.filter(c => c.spent > c.limit).map(c => (
                    <p key={c.category} className="text-sm text-amber-800">
                      You are over budget in <strong>{c.category}</strong> by ${(c.spent - c.limit).toLocaleString()}.
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-emerald-700">You are within budget for all active categories. Great job!</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card title="Recent Transactions">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600">Date</th>
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600">Description</th>
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600">Category</th>
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-sm text-gray-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{tx.description}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900 text-right">${parseFloat(tx.amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => removeTransaction(tx.id)} className="text-gray-400 hover:text-red-600 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No transactions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(budget => {
            const spent = transactions.filter(tx => tx.category === budget.category).reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            const limit = parseFloat(budget.limit);
            const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
            const isOver = spent > limit;
            
            return (
              <Card key={budget.category} className={isOver ? 'border-red-200' : ''}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className={`w-4 h-4 ${isOver ? 'text-red-500' : 'text-gray-400'}`} />
                    <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                  </div>
                  {editingCategory === budget.category ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={editLimitValue} 
                        onChange={e => setEditLimitValue(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        autoFocus
                      />
                      <button onClick={() => saveLimit(budget.category)} className="text-emerald-600 text-sm font-medium hover:underline">Save</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingCategory(budget.category); setEditLimitValue(budget.limit); }} className="text-xs font-medium text-gray-500 hover:text-blue-600">
                      Limit: ${limit.toLocaleString()}
                    </button>
                  )}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-2xl font-bold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>${spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-sm text-gray-500 mb-1">spent</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${isOver ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">{percent.toFixed(0)}% used</p>
              </Card>
            );
          })}
        </div>
      )}

      {showAddTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add Expense</h3>
              <button onClick={() => setShowAddTx(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={newTx.date} onChange={(e) => setNewTx({...newTx, date: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Merchant</label>
                <input type="text" placeholder="e.g. Whole Foods" value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input type="number" step="0.01" value={newTx.amount} onChange={(e) => setNewTx({...newTx, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowAddTx(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleAddTransaction} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save Expense</button>
            </div>
          </div>
        </div>
      )}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Import Credit Card Statements</h3>
                <p className="text-sm text-gray-500">Upload CSV files to automatically categorize transactions</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {importStep === 'upload' ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    ) : (
                      <FileUp className="w-8 h-8 text-emerald-600" />
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {isUploading ? 'Parsing your statements...' : 'Select CSV Files'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                    Supported formats: Typical bank CSV exports with Date, Description, and Amount columns.
                  </p>
                  <label className={`px-6 py-3 rounded-lg font-bold transition-all cursor-pointer ${isUploading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200'}`}>
                    {isUploading ? 'Please wait...' : 'Choose Files'}
                    <input 
                      type="file" 
                      multiple 
                      accept=".csv" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm text-emerald-800">
                        Found <strong>{importedTransactions.length}</strong> transactions.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Total Amount</p>
                      <p className="text-xl font-bold text-emerald-900">
                        ${importedTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CATEGORIES.map(cat => {
                      const catTotal = importedTransactions
                        .filter(tx => tx.category === cat)
                        .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
                      if (catTotal === 0) return null;
                      return (
                        <div key={cat} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">{cat}</p>
                          <p className="text-sm font-bold text-gray-900">${catTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-xs text-gray-600 uppercase">Date</th>
                          <th className="py-3 px-4 font-semibold text-xs text-gray-600 uppercase">Description</th>
                          <th className="py-3 px-4 font-semibold text-xs text-gray-600 uppercase">Category</th>
                          <th className="py-3 px-4 font-semibold text-xs text-gray-600 uppercase text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedTransactions.map((tx, idx) => (
                          <tr key={tx.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">{tx.date}</td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 truncate max-w-[200px]">{tx.description}</td>
                            <td className="py-3 px-4 text-sm">
                              <select 
                                value={tx.category} 
                                onChange={(e) => {
                                  const updated = [...importedTransactions];
                                  updated[idx].category = e.target.value;
                                  setImportedTransactions(updated);
                                }}
                                className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs"
                              >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-gray-900 text-right">${parseFloat(tx.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between gap-4">
              <button 
                onClick={() => {
                  setImportStep('upload');
                  setImportedTransactions([]);
                }} 
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                {importStep === 'review' ? 'Back' : 'Cancel'}
              </button>
              {importStep === 'review' && (
                <button 
                  onClick={confirmImport} 
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
                >
                  Import {importedTransactions.length} Transactions
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default BudgetAnalyzer;
