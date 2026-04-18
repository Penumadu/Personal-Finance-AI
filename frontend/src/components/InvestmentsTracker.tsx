import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Building2, Briefcase, Wallet, PiggyBank, Landmark, Target, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Shield, Calendar } from 'lucide-react';
import Card from './ui/Card';

interface Investment {
  id: string;
  name: string;
  type: 'tfsa' | 'rrsp' | 'non_registered' | 'resp' | 'corp' | 'rental' | 'stocks' | 'bonds' | 'gics' | 'savings';
  value: string;
  return_rate: string;
  ytd_return: string;
  provider: string;
  risk_level: 'low' | 'medium' | 'high';
  last_updated: string;
}

const InvestmentsTracker: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([
    { id: '1', name: 'TFSA - High Interest Savings', type: 'tfsa', value: '45000', return_rate: '4.5', ytd_return: '2.1', provider: 'EQ Bank', risk_level: 'low', last_updated: '2026-04-15' },
    { id: '2', name: 'RRSP - Index Fund', type: 'rrsp', value: '125000', return_rate: '8.2', ytd_return: '5.4', provider: 'Questrade', risk_level: 'medium', last_updated: '2026-04-15' },
    { id: '3', name: 'TFSA - Canadian Stocks', type: 'tfsa', value: '28000', return_rate: '12.5', ytd_return: '8.2', provider: 'Wealthsimple', risk_level: 'high', last_updated: '2026-04-15' },
    { id: '4', name: 'Rental Property - Condo', type: 'rental', value: '320000', return_rate: '6.8', ytd_return: '3.2', provider: 'Personal', risk_level: 'medium', last_updated: '2026-04-10' },
    { id: '5', name: 'Non-Reg - US Tech Stocks', type: 'non_registered', value: '55000', return_rate: '15.3', ytd_return: '12.1', provider: 'IBKR', risk_level: 'high', last_updated: '2026-04-15' },
    { id: '6', name: 'GIC - 1 Year', type: 'gics', value: '25000', return_rate: '5.2', ytd_return: '1.3', provider: 'Oaken Financial', risk_level: 'low', last_updated: '2026-04-01' },
    { id: '7', name: 'Corporate Account', type: 'corp', value: '85000', return_rate: '7.1', ytd_return: '4.8', provider: 'RBC', risk_level: 'medium', last_updated: '2026-04-15' },
    { id: '8', name: 'RESP - Education Fund', type: 'resp', value: '18000', return_rate: '6.5', ytd_return: '3.9', provider: 'Coast Capital', risk_level: 'medium', last_updated: '2026-04-15' }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newInvestment, setNewInvestment] = useState<Partial<Investment>>({
    name: '',
    type: 'tfsa',
    value: '',
    return_rate: '',
    ytd_return: '',
    provider: '',
    risk_level: 'medium',
    last_updated: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'performance'>('overview');

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tfsa: '#10B981',
      rrsp: '#3B82F6',
      non_registered: '#8B5CF6',
      resp: '#F59E0B',
      corp: '#EC4899',
      rental: '#06B6D4',
      stocks: '#EF4444',
      bonds: '#6366F1',
      gics: '#14B8A6',
      savings: '#22C55E'
    };
    return colors[type] || '#6B7280';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      tfsa: PiggyBank,
      rrsp: Wallet,
      non_registered: Briefcase,
      resp: Target,
      corp: Building2,
      rental: Building2,
      stocks: TrendingUp,
      bonds: Shield,
      gics: Calendar,
      savings: DollarSign
    };
    return icons[type] || DollarSign;
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      tfsa: 'TFSA',
      rrsp: 'RRSP',
      non_registered: 'Non-Registered',
      resp: 'RESP',
      corp: 'Corporate',
      rental: 'Rental Property',
      stocks: 'Stocks',
      bonds: 'Bonds',
      gics: 'GICs',
      savings: 'Savings'
    };
    return names[type] || type;
  };

  const totalValue = investments.reduce((sum, inv) => sum + parseFloat(inv.value), 0);
  const weightedReturn = investments.reduce((sum, inv) => sum + parseFloat(inv.return_rate) * parseFloat(inv.value), 0) / totalValue;
  const totalYTD = investments.reduce((sum, inv) => sum + (parseFloat(inv.value) * parseFloat(inv.ytd_return) / 100), 0);

  const getAllocationData = () => {
    const grouped = investments.reduce((acc, inv) => {
      const type = getTypeName(inv.type);
      if (!acc[type]) {
        acc[type] = { name: type, value: 0, color: getTypeColor(inv.type) };
      }
      acc[type].value += parseFloat(inv.value);
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>);
    
    return Object.values(grouped);
  };

  const getPerformanceData = () => {
    return investments
      .sort((a, b) => parseFloat(b.ytd_return) - parseFloat(a.ytd_return))
      .slice(0, 8)
      .map(inv => ({
        name: inv.name.length > 20 ? inv.name.substring(0, 20) + '...' : inv.name,
        return: parseFloat(inv.ytd_return),
        value: parseFloat(inv.value),
        color: getTypeColor(inv.type)
      }));
  };

  const getRiskBreakdown = () => {
    const low = investments.filter(i => i.risk_level === 'low').reduce((sum, i) => sum + parseFloat(i.value), 0);
    const medium = investments.filter(i => i.risk_level === 'medium').reduce((sum, i) => sum + parseFloat(i.value), 0);
    const high = investments.filter(i => i.risk_level === 'high').reduce((sum, i) => sum + parseFloat(i.value), 0);
    return [
      { name: 'Low Risk', value: low, color: '#10B981' },
      { name: 'Medium Risk', value: medium, color: '#F59E0B' },
      { name: 'High Risk', value: high, color: '#EF4444' }
    ];
  };

  const handleAddInvestment = () => {
    if (!newInvestment.name || !newInvestment.value) return;
    
    const investment: Investment = {
      id: Date.now().toString(),
      ...newInvestment as Investment
    };
    
    setInvestments(prev => [...prev, investment]);
    setShowAddModal(false);
    setNewInvestment({
      name: '', type: 'tfsa', value: '', return_rate: '', ytd_return: '',
      provider: '', risk_level: 'medium', last_updated: new Date().toISOString().split('T')[0]
    });
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <PieChartIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Investments Tracker</h2>
            <p className="text-gray-500">Canadian Investment Portfolio Management</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-sm text-blue-600 font-medium">Total Portfolio</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">${totalValue.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">Weighted Return</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{weightedReturn.toFixed(2)}%</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-center">
            <p className="text-sm text-purple-600 font-medium">YTD Gains</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">${totalYTD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-center">
            <p className="text-sm text-orange-600 font-medium">Accounts</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{investments.length}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-4">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Account Overview
        </button>
        <button onClick={() => setActiveTab('breakdown')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'breakdown' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Asset Breakdown
        </button>
        <button onClick={() => setActiveTab('performance')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'performance' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Performance
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment List */}
          <Card title="Your Investments">
            <div className="space-y-3">
              {investments.map((inv) => {
                const Icon = getTypeIcon(inv.type);
                const isPositive = parseFloat(inv.ytd_return) >= 0;
                return (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: getTypeColor(inv.type) + '20' }}>
                        <Icon className="w-5 h-5" style={{ color: getTypeColor(inv.type) }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{inv.name}</h4>
                        <p className="text-xs text-gray-500">{inv.provider} • {getTypeName(inv.type)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${parseFloat(inv.value).toLocaleString()}</p>
                      <p className={`text-xs flex items-center justify-end gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {inv.ytd_return}% YTD
                      </p>
                    </div>
                    <button onClick={() => deleteInvestment(inv.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Canadian Account Summary */}
          <Card title="Canadian Account Summary">
            <div className="space-y-4">
              {['tfsa', 'rrsp', 'resp', 'corp', 'non_registered', 'rental'].map(type => {
                const accounts = investments.filter(i => i.type === type);
                if (accounts.length === 0) return null;
                const total = accounts.reduce((sum, i) => sum + parseFloat(i.value), 0);
                const Icon = getTypeIcon(type);
                return (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: getTypeColor(type) + '20' }}>
                        <Icon className="w-4 h-4" style={{ color: getTypeColor(type) }} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getTypeName(type)}</p>
                        <p className="text-xs text-gray-500">{accounts.length} account{accounts.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">${total.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Allocation Pie Chart */}
          <Card title="Asset Allocation">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getAllocationData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getAllocationData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Risk Distribution */}
          <Card title="Risk Distribution">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getRiskBreakdown()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getRiskBreakdown().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-6">
              {getRiskBreakdown().map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}: ${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card title="YTD Performance by Investment">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getPerformanceData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={10} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                  <Bar dataKey="return" radius={[0, 4, 4, 0]}>
                    {getPerformanceData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Performers */}
          <Card title="Top Performers">
            <div className="space-y-3">
              {investments
                .sort((a, b) => parseFloat(b.ytd_return) - parseFloat(a.ytd_return))
                .slice(0, 5)
                .map((inv, idx) => {
                  const Icon = getTypeIcon(inv.type);
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{inv.name}</p>
                          <p className="text-xs text-gray-500">{inv.provider}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{inv.ytd_return}%</p>
                        <p className="text-xs text-gray-500">${(parseFloat(inv.value) * parseFloat(inv.ytd_return) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {/* Canadian Investment Tips */}
      <Card title="Canadian Investment Insights" className="bg-gradient-to-br from-green-50 to-teal-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">TFSA vs RRSP</h4>
            </div>
            <p className="text-sm text-gray-600">TFSA is better if you're in a lower tax bracket. RRSP benefits more in higher brackets with larger deductions.</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Contribution Room</h4>
            </div>
            <p className="text-sm text-gray-600">2026 TFSA limit is $7,000. RRSP is 18% of previous year's earned income, up to $32,490.</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">Diversification</h4>
            </div>
            <p className="text-sm text-gray-600">Consider holding US stocks in RRSP to avoid 15% withholding tax on dividends paid to US companies.</p>
          </div>
        </div>
      </Card>

      {/* Add Investment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add New Investment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investment Name</label>
                <input type="text" value={newInvestment.name} onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., TFSA High Interest Savings" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select value={newInvestment.type} onChange={(e) => setNewInvestment({...newInvestment, type: e.target.value as any})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="tfsa">TFSA</option>
                    <option value="rrsp">RRSP</option>
                    <option value="resp">RESP</option>
                    <option value="corp">Corporate</option>
                    <option value="non_registered">Non-Registered</option>
                    <option value="rental">Rental Property</option>
                    <option value="stocks">Stocks</option>
                    <option value="bonds">Bonds</option>
                    <option value="gics">GICs</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                  <select value={newInvestment.risk_level} onChange={(e) => setNewInvestment({...newInvestment, risk_level: e.target.value as any})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value ($)</label>
                  <input type="number" value={newInvestment.value} onChange={(e) => setNewInvestment({...newInvestment, value: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Rate (%)</label>
                  <input type="number" step="0.01" value={newInvestment.return_rate} onChange={(e) => setNewInvestment({...newInvestment, return_rate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YTD Return (%)</label>
                  <input type="number" step="0.01" value={newInvestment.ytd_return} onChange={(e) => setNewInvestment({...newInvestment, ytd_return: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <input type="text" value={newInvestment.provider} onChange={(e) => setNewInvestment({...newInvestment, provider: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Questrade" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleAddInvestment} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Investment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsTracker;
