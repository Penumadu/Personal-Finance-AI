import React, { useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, ArrowUpRight, AlertCircle, DollarSign, Percent, Home, Calculator } from 'lucide-react';
import Card from './ui/Card';

const MortgageAnalyzer: React.FC = () => {
  const [formData, setFormData] = useState({
    original_principal: '350000',
    current_principal: '320000',
    interest_rate: '6.5',
    monthly_payment: '2210',
    start_date: '2024-01-15',
    term_months: '360',
    property_value: '450000',
    loan_type: 'conventional'
  });

  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyze' | 'refinance'>('analyze');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const analyzeMortgage = () => {
    setLoading(true);
    setTimeout(() => {
      const ltv = (parseFloat(formData.current_principal) / parseFloat(formData.property_value)) * 100;
      const equity = parseFloat(formData.property_value) - parseFloat(formData.current_principal);
      
      setAnalysisResult({
        remaining_months: parseInt(formData.term_months) - 24,
        total_interest_remaining: parseFloat(formData.current_principal) * 0.45,
        monthly_payment: parseFloat(formData.monthly_payment),
        current_ltv: ltv,
        pmi_required: ltv > 80,
        equity_accumulated: equity,
        monthly_principal: parseFloat(formData.current_principal) * (parseFloat(formData.interest_rate)/100/12),
        recommendations: [
          { type: 'refinance', action: 'Consider refinancing to lower your rate', potential_savings: 45000, new_rate_estimate: 6.5, breakeven_months: 24, confidence: 'high' },
          { type: 'pmi_removal', action: ltv > 80 ? 'Reach 80% LTV to remove PMI' : 'PMI not required', equity_needed: ltv > 80 ? parseFloat(formData.property_value) * 0.2 - equity : 0, monthly_savings_from_pmi: ltv > 80 ? 150 : 0 },
          { type: 'extra_payments', action: 'Make extra payments to shorten loan term', potential_savings: parseInt(formData.term_months) * 50 }
        ]
      });
      setLoading(false);
    }, 800);
  };

  const calculateRefinance = () => {
    setLoading(true);
    setTimeout(() => {
      const scenarios = [
        { term: 30, rate: 6.5, monthly: 2024, savings: 492, totalSavings: 116500 },
        { term: 20, rate: 6.25, monthly: 2450, savings: 200, totalSavings: 85000 },
        { term: 15, rate: 5.875, monthly: 2800, savings: -50, totalSavings: 95000 }
      ];
      
      setAnalysisResult({
        remaining_months: parseInt(formData.term_months) - 24,
        total_interest_remaining: parseFloat(formData.current_principal) * 0.45,
        monthly_payment: parseFloat(formData.monthly_payment),
        current_ltv: (parseFloat(formData.current_principal) / parseFloat(formData.property_value)) * 100,
        pmi_required: false,
        equity_accumulated: parseFloat(formData.property_value) - parseFloat(formData.current_principal),
        recommendations: scenarios.map(s => ({ type: 'refi_scenario', action: `${s.term} year at ${s.rate}%`, potential_savings: s.totalSavings, monthly_savings: s.savings, new_rate_estimate: s.rate }))
      });
      setLoading(false);
    }, 800);
  };

  const getAmortizationData = () => {
    const months = Math.min(120, parseInt(formData.term_months));
    const data = [];
    let balance = parseFloat(formData.current_principal);
    const monthlyRate = parseFloat(formData.interest_rate) / 100 / 12;
    const payment = parseFloat(formData.monthly_payment);
    
    for (let i = 1; i <= months; i += 12) {
      data.push({ year: `Year ${Math.ceil(i/12)}`, balance: Math.round(balance), interest: Math.round(balance * monthlyRate * 12) });
      balance = balance * (1 + monthlyRate) - payment;
      if (balance < 0) balance = 0;
    }
    return data;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mortgage Analyzer</h2>
            <p className="text-gray-500">Analyze your mortgage and get refinancing recommendations</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 pb-4">
        <button onClick={() => setActiveTab('analyze')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analyze' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Calculator className="w-4 h-4 inline mr-2" />
          Analyze Mortgage
        </button>
        <button onClick={() => setActiveTab('refinance')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'refinance' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Refinance Calculator
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={activeTab === 'analyze' ? 'Enter Your Mortgage Details' : 'Refinance Calculator'}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Principal</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" name="original_principal" value={formData.original_principal} onChange={handleInputChange} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" name="current_principal" value={formData.current_principal} onChange={handleInputChange} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" step="0.01" name="interest_rate" value={formData.interest_rate} onChange={handleInputChange} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" name="monthly_payment" value={formData.monthly_payment} onChange={handleInputChange} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Value</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" name="property_value" value={formData.property_value} onChange={handleInputChange} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term</label>
                <select name="term_months" value={formData.term_months} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="360">30 Years</option>
                  <option value="240">20 Years</option>
                  <option value="180">15 Years</option>
                </select>
              </div>
            </div>

            <button onClick={activeTab === 'analyze' ? analyzeMortgage : calculateRefinance} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparentrounded-full animate-spin" /> : <><TrendingUp className="w-5 h-5" />{activeTab === 'analyze' ? 'Analyze Mortgage' : 'Calculate Refinance'}</>}
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          {analysisResult ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-medium">Current LTV</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{analysisResult.current_ltv.toFixed(1)}%</p>
                    {analysisResult.pmi_required && <span className="inline-flex items-center gap-1 mt-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" />PMI Required</span>}
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">Equity Built</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">${analysisResult.equity_accumulated.toLocaleString()}</p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="text-center">
                    <p className="text-sm text-purple-600 font-medium">Interest Remaining</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">${analysisResult.total_interest_remaining.toLocaleString()}</p>
                  </div>
                </Card>
              </div>

              {/* Amortization Chart */}
              <Card title="Amortization Schedule" subtitle="Balance over time">
                <div className="h-48">
<ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getAmortizationData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="year" stroke="#6B7280" fontSize={10} />
                      <YAxis stroke="#6B7280" fontSize={10} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="balance" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Balance" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Recommendations">
                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border ${rec.type === 'refinance' || rec.type === 'refi_scenario' ? 'border-blue-200 bg-blue-50' : rec.type === 'pmi_removal' ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">{rec.type.replace('_', ' ')}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rec.action}</p>
                        </div>
                        {rec.potential_savings && <span className="flex items-center gap-1 text-green-600 font-semibold"><ArrowUpRight className="w-4 h-4" />${rec.potential_savings.toLocaleString()}</span>}
                      </div>
                      {rec.breakeven_months && <p className="text-xs text-gray-500 mt-2">Breakeven: {rec.breakeven_months} months</p>}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Home className="w-12 h-12 mx-auto mb-4" />
                <p>Enter your mortgage details to see analysis</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageAnalyzer;