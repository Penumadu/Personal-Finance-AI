import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, Legend } from 'recharts';
import { TrendingUp, ArrowUpRight, AlertCircle, DollarSign, Percent, Home, Calculator, Save, Clock, ChevronRight, Building2, TrendingDown, Globe, Info, Leaf, BarChart3, X } from 'lucide-react';
import Card from './ui/Card';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_MORTGAGES } from '../lib/sampleData';

interface Property {
  id: string;
  name: string;
  address: string;
  propertyValue: string;
  currentBalance: string;
  interestRate: string;
  monthlyPayment: string;
  originalAmount: string;
  startDate: string;
  termMonths: string;
  loanType: 'fixed' | 'variable' | 'heloc';
  renewalDate: string;
  paymentFrequency: 'monthly' | 'biweekly' | 'accelerated';
}

const MortgageAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (user.isAnonymous) {
      setProperties(SAMPLE_MORTGAGES);
      setLoading(false);
      if (SAMPLE_MORTGAGES.length > 0 && !selectedProperty) {
        setSelectedProperty(SAMPLE_MORTGAGES[0]);
      }
      return;
    }

    const q = query(
      collection(db, 'mortgages'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const propertyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(propertyData);
      setLoading(false);
      if (propertyData.length > 0 && !selectedProperty) {
        setSelectedProperty(propertyData[0]);
      }
    });

    return unsubscribe;
  }, [user]);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(properties[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'forecast'>('overview');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    name: '',
    address: '',
    propertyValue: '',
    currentBalance: '',
    interestRate: '',
    monthlyPayment: '',
    originalAmount: '',
    startDate: '',
    termMonths: '300',
    loanType: 'fixed',
    renewalDate: '',
    paymentFrequency: 'monthly'
  });

  // Market forecast data
  const marketForecast = [
    { month: 'Q2 2026', fixedRate: 5.5, variableRate: 4.8, trend: 'stable' },
    { month: 'Q3 2026', fixedRate: 5.4, variableRate: 4.6, trend: 'dropping' },
    { month: 'Q4 2026', fixedRate: 5.3, variableRate: 4.5, trend: 'dropping' },
    { month: 'Q1 2027', fixedRate: 5.2, variableRate: 4.4, trend: 'dropping' },
    { month: 'Q2 2027', fixedRate: 5.1, variableRate: 4.3, trend: 'stable' }
  ];

  const geopoliticalNotes = [
    { topic: 'US-Canada Trade Relations', impact: 'Stable', note: 'Recent trade deals maintaining steady rates' },
    { topic: 'Bank of Canada Policy', impact: 'Rate Cuts Expected', note: 'BoC signaling 2-3 rate cuts in 2026' },
    { topic: 'Global Economic Slowdown', impact: 'Downward Pressure', note: 'Recession concerns may accelerate rate cuts' },
    { topic: 'Housing Market', impact: 'Moderate', note: 'Cooling market may push lenders to offer better deals' }
  ];

  const calculateEMI = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const getAmortizationData = (property: Property) => {
    const data = [];
    let balance = parseFloat(property.currentBalance);
    const monthlyRate = parseFloat(property.interestRate) / 100 / 12;
    const payment = parseFloat(property.monthlyPayment);
    const totalMonths = parseInt(property.termMonths);
    
    for (let i = 0; i <= Math.min(60, totalMonths); i += 6) {
      if (i === 0) {
        data.push({ month: 'Start', principal: parseFloat(property.currentBalance), interest: 0, balance: parseFloat(property.currentBalance) });
        continue;
      }
      
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      
      for (let m = 0; m < 6; m++) {
        const interest = balance * monthlyRate;
        const principalPaid = payment - interest;
        yearlyInterest += interest;
        yearlyPrincipal += principalPaid;
        balance -= principalPaid;
        if (balance < 0) balance = 0;
      }
      
      data.push({
        month: `Month ${i}`,
        principal: Math.round(yearlyPrincipal),
        interest: Math.round(yearlyInterest),
        balance: Math.round(Math.max(0, balance))
      });
    }
    return data;
  };

  const getEMIBreakdown = (property: Property) => {
    const principal = parseFloat(property.currentBalance);
    const rate = parseFloat(property.interestRate);
    const monthlyRate = rate / 100 / 12;
    const emi = calculateEMI(principal, rate, parseInt(property.termMonths));
    const firstMonthInterest = principal * monthlyRate;
    const firstMonthPrincipal = emi - firstMonthInterest;
    
    return {
      emi: emi.toFixed(2),
      principal: firstMonthPrincipal.toFixed(2),
      interest: firstMonthInterest.toFixed(2),
      totalInterest: (emi * parseInt(property.termMonths) - principal).toFixed(2),
      totalPayment: (emi * parseInt(property.termMonths)).toFixed(2)
    };
  };

  const getRefinanceRecommendations = (property: Property) => {
    const recommendations: any[] = [];
    const currentRate = parseFloat(property.interestRate);
    const balance = parseFloat(property.currentBalance);
    const marketRate = 4.85; // Current demo market rate
    const renewalDate = new Date(property.renewalDate);
    const monthsToRenewal = Math.max(0, Math.round((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));

    // 1. Refinance Recommendation
    if (currentRate > marketRate + 0.5) {
      const monthlySavings = (balance * (currentRate - marketRate) / 100) / 12;
      const yearlySavings = monthlySavings * 12;
      const totalInterestSaved = monthlySavings * 60; // Estimate over a 5-year term
      const estClosingCosts = 2500;

      if (monthsToRenewal >= 6) {
        const estimatedPenalty = Math.round(balance * 0.03);
        const breakEvenMonths = Math.ceil((estClosingCosts + estimatedPenalty) / monthlySavings);

        recommendations.push({
          type: 'high_rate',
          title: 'Refinance Opportunity',
          description: `Your rate of ${currentRate}% is significantly above market (~${marketRate}%). Refinancing now could lock in lower payments for the next 5 years.`,
          potential: Math.round(monthlySavings).toString(),
          impactLabel: 'per month',
          steps: [
            'Request a payout statement to confirm your exact prepayment penalty.',
            `Shop rates at RateHub.ca or Nesto — target ~${marketRate}% for a 5-year fixed.`,
            `Verify break-even: With a ~$${estimatedPenalty.toLocaleString()} penalty, you need ~${breakEvenMonths} months to start saving.`,
            'Ask for a "blend-and-extend" to potentially avoid the full penalty.'
          ],
          breakdown: [
            { label: 'Monthly Savings', value: `$${Math.round(monthlySavings).toLocaleString()}` },
            { label: 'Yearly Savings', value: `$${Math.round(yearlySavings).toLocaleString()}` },
            { label: 'Est. Penalty', value: `$${estimatedPenalty.toLocaleString()}` },
            { label: 'Break-Even', value: `${breakEvenMonths} months` }
          ]
        });
      } else {
        recommendations.push({
          type: 'high_rate',
          title: 'Immediate Renewal Strategy',
          description: `Your mortgage renews in ${monthsToRenewal} months. This is the perfect time to switch lenders for a better rate with ZERO penalty.`,
          potential: Math.round(monthlySavings).toString(),
          impactLabel: 'per month',
          steps: [
            'Do not sign your bank\'s auto-renewal notice — it\'s rarely the best rate.',
            'Get a rate hold today (lenders allow this 120 days before renewal).',
            'Compare your bank\'s offer against a mortgage broker or digital lender (Nesto).',
            'Target a rate below 4.9% for a 5-year fixed term.'
          ],
          breakdown: [
            { label: 'Months to Renewal', value: `${monthsToRenewal}` },
            { label: 'Monthly Savings', value: `$${Math.round(monthlySavings).toLocaleString()}` },
            { label: 'Prepayment Penalty', value: '$0 (at renewal)' },
            { label: '5-Year Savings', value: `$${Math.round(totalInterestSaved).toLocaleString()}` }
          ]
        });
      }
    }

    // 2. Accelerated Payments
    if (property.paymentFrequency === 'monthly') {
      const acceleratedBiWeekly = parseFloat(property.monthlyPayment) / 2;
      recommendations.push({
        type: 'accelerate',
        title: 'Switch to Accelerated Bi-Weekly',
        description: 'By paying half your monthly amount every two weeks, you make one extra monthly payment per year, shaving years off your mortgage.',
        potential: '45000',
        impactLabel: 'interest saved',
        steps: [
          'Contact your lender to change your payment frequency.',
          'Align the new payment dates with your bi-weekly paycheques.',
          'Ensure your budget can handle the slight increase in annual total paid.'
        ],
        breakdown: [
          { label: 'Extra Payment/Year', value: '1 Full Payment' },
          { label: 'Time Saved', value: '~4.2 Years' },
          { label: 'Total Interest Saved', value: '~$45,000+' }
        ]
      });
    }

    // 3. Equity / HELOC
    const ltv = (balance / parseFloat(property.propertyValue)) * 100;
    if (ltv < 65) {
      const availableEquity = Math.round(parseFloat(property.propertyValue) * 0.8 - balance);
      recommendations.push({
        type: 'equity_access',
        title: 'Strategic Equity Access',
        description: `You have over ${Math.round(100 - ltv)}% equity. You could access up to $${availableEquity.toLocaleString()} for investments or home improvements.`,
        potential: availableEquity.toString(),
        impactLabel: 'available',
        steps: [
          'Apply for a HELOC (Home Equity Line of Credit) while interest rates are stabilizing.',
          'Use funds only for value-adding renovations or high-return investments.',
          'Keep the HELOC at $0 balance if not needed — it serves as a great emergency backup.'
        ],
        breakdown: [
          { label: 'LTV Ratio', value: `${ltv.toFixed(1)}%` },
          { label: 'Available Equity', value: `$${availableEquity.toLocaleString()}` },
          { label: 'Typical HELOC Rate', value: 'Prime + 0.5%' }
        ]
      });
    }

    return recommendations;
  };

  const handleAddProperty = async () => {
    if (!newProperty.name || !newProperty.currentBalance || !user) return;
    
    if (user.isAnonymous) {
      const id = Math.random().toString(36).substring(7);
      const property: Property = {
        ...(newProperty as Property),
        id,
        renewalDate: newProperty.renewalDate || new Date().toISOString()
      };
      const updatedProperties = [...properties, property];
      setProperties(updatedProperties);
      setSelectedProperty(property);
      setShowAddProperty(false);
      setNewProperty({
        name: '', address: '', propertyValue: '', currentBalance: '',
        interestRate: '', monthlyPayment: '', originalAmount: '',
        startDate: '', termMonths: '300', loanType: 'fixed',
        renewalDate: '', paymentFrequency: 'monthly'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'mortgages'), {
        ...newProperty,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      
      setShowAddProperty(false);
      setNewProperty({
        name: '', address: '', propertyValue: '', currentBalance: '',
        interestRate: '', monthlyPayment: '', originalAmount: '',
        startDate: '', termMonths: '300', loanType: 'fixed',
        renewalDate: '', paymentFrequency: 'monthly'
      });
    } catch (error) {
      console.error("Error adding property: ", error);
      alert("Failed to add property. " + (user.isAnonymous ? "Guest mode issue." : "Check permissions."));
    }
  };

  const removeProperty = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    if (user?.isAnonymous) {
      const updatedProperties = properties.filter(p => p.id !== id);
      setProperties(updatedProperties);
      if (selectedProperty?.id === id) {
        setSelectedProperty(updatedProperties[0] || null);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'mortgages', id));
      if (selectedProperty?.id === id) {
        setSelectedProperty(properties.find(p => p.id !== id) || null);
      }
    } catch (error) {
      console.error("Error removing property: ", error);
    }
  };

  const totalPortfolioValue = properties.reduce((sum, p) => sum + parseFloat(p.propertyValue), 0);
  const totalMortgageBalance = properties.reduce((sum, p) => sum + parseFloat(p.currentBalance), 0);
  const totalEquity = totalPortfolioValue - totalMortgageBalance;
  const weightedAvgRate = properties.reduce((sum, p) => sum + parseFloat(p.interestRate) * parseFloat(p.currentBalance), 0) / totalMortgageBalance;

  const emiBreakdown = selectedProperty ? getEMIBreakdown(selectedProperty) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mortgage Analyzer</h2>
            <p className="text-xs sm:text-sm text-gray-500">Canadian Real Estate Portfolio Management</p>
          </div>
        </div>
        <button onClick={() => setShowAddProperty(true)} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
          <Home className="w-4 h-4" />
          Add Property
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4">
          <div className="text-center">
            <p className="text-[10px] sm:text-sm text-blue-600 font-medium uppercase tracking-wider">Portfolio Value</p>
            <p className="text-lg sm:text-xl font-bold text-blue-900 mt-1">${totalPortfolioValue.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4">
          <div className="text-center">
            <p className="text-[10px] sm:text-sm text-red-600 font-medium uppercase tracking-wider">Total Mortgage</p>
            <p className="text-lg sm:text-xl font-bold text-red-900 mt-1">${totalMortgageBalance.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4">
          <div className="text-center">
            <p className="text-[10px] sm:text-sm text-green-600 font-medium uppercase tracking-wider">Total Equity</p>
            <p className="text-lg sm:text-xl font-bold text-green-900 mt-1">${totalEquity.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4">
          <div className="text-center">
            <p className="text-[10px] sm:text-sm text-purple-600 font-medium uppercase tracking-wider">Avg. Rate</p>
            <p className="text-lg sm:text-xl font-bold text-purple-900 mt-1">{weightedAvgRate.toFixed(2)}%</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4">
          <div className="text-center">
            <p className="text-[10px] sm:text-sm text-orange-600 font-medium uppercase tracking-wider">Properties</p>
            <p className="text-lg sm:text-xl font-bold text-orange-900 mt-1">{properties.length}</p>
          </div>
        </Card>
      </div>

      {/* Property Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button onClick={() => setActiveTab('overview')} className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Overview
        </button>
        <button onClick={() => setActiveTab('analysis')} className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          EMI Analysis
        </button>
        <button onClick={() => setActiveTab('forecast')} className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${activeTab === 'forecast' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Market Forecast
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Properties List */}
        <div className="space-y-4">
          <Card title="Your Properties">
            <div className="space-y-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => setSelectedProperty(property)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedProperty?.id === property.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button 
                    onClick={(e) => removeProperty(property.id, e)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{property.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{property.address}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      property.loanType === 'fixed' ? 'bg-blue-100 text-blue-700' :
                      property.loanType === 'variable' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {property.loanType.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Balance:</span>
                      <span className="ml-1 font-medium">${parseFloat(property.currentBalance).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Rate:</span>
                      <span className="ml-1 font-medium">{property.interestRate}%</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Renewal: {new Date(property.renewalDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'overview' && selectedProperty && (
            <>
              {/* EMI Breakdown */}
              <Card title="Monthly EMI Breakdown" subtitle={selectedProperty.name}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Monthly EMI</p>
                    <p className="text-2xl font-bold text-blue-900">${emiBreakdown?.emi}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Principal</p>
                    <p className="text-2xl font-bold text-green-900">${emiBreakdown?.principal}</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Interest</p>
                    <p className="text-2xl font-bold text-red-900">${emiBreakdown?.interest}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Total Interest</p>
                    <p className="text-2xl font-bold text-purple-900">${parseInt(emiBreakdown?.totalInterest || '0').toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Principal', value: parseFloat(emiBreakdown?.principal || '0'), fill: '#10B981' },
                      { name: 'Interest', value: parseFloat(emiBreakdown?.interest || '0'), fill: '#EF4444' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Refinance Recommendations */}
              <Card title="Recommendations">
                <div className="space-y-4">
                  {getRefinanceRecommendations(selectedProperty).map((rec, idx) => (
                    <div key={idx} className={`rounded-xl border-l-4 overflow-hidden shadow-sm ${
                      rec.type === 'high_rate' ? 'border-l-red-500 bg-red-50/30' :
                      rec.type === 'variable_benefit' ? 'border-l-green-500 bg-green-50/30' :
                      rec.type === 'equity_access' ? 'border-l-blue-500 bg-blue-50/30' :
                      'border-l-emerald-500 bg-emerald-50/30'
                    }`}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                              {rec.type === 'high_rate' ? <TrendingDown className="w-4 h-4 text-red-500" /> : 
                               rec.type === 'equity_access' ? <Building2 className="w-4 h-4 text-blue-500" /> :
                               <DollarSign className="w-4 h-4 text-emerald-500" />}
                              {rec.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.description}</p>
                          </div>
                          {rec.potential !== '0' && (
                            <div className="text-right">
                              <span className="text-lg font-black text-gray-900">${parseInt(rec.potential).toLocaleString()}</span>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-none">{rec.impactLabel}</p>
                            </div>
                          )}
                        </div>

                        {/* Financial Breakdown */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {rec.breakdown.map((item: any, i: number) => (
                            <div key={i} className="bg-white/50 px-3 py-1.5 rounded-lg border border-white/50 flex justify-between items-center">
                              <span className="text-[10px] text-gray-500 font-medium">{item.label}</span>
                              <span className="text-xs font-bold text-gray-800">{item.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Plan */}
                        <div className="bg-white/60 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Step-by-Step Action Plan</p>
                          <ul className="space-y-2">
                            {rec.steps.map((step: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                <span className="text-xs text-gray-700 leading-tight">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {activeTab === 'analysis' && selectedProperty && (
            <>
              {/* Amortization Chart */}
              <Card title="Mortgage Progression" subtitle="Principal vs Interest over time">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getAmortizationData(selectedProperty)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={10} />
                      <YAxis fontSize={10} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Area type="monotone" dataKey="principal" stackId="1" stroke="#10B981" fill="#D1FAE5" name="Principal Paid" />
                      <Area type="monotone" dataKey="interest" stackId="1" stroke="#EF4444" fill="#FEE2E2" name="Interest Paid" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Property Details */}
              <Card title="Property Details">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Property Value</p>
                    <p className="text-lg font-semibold">${parseFloat(selectedProperty.propertyValue).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Original Amount</p>
                    <p className="text-lg font-semibold">${parseFloat(selectedProperty.originalAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="text-lg font-semibold">{new Date(selectedProperty.startDate).toLocaleDateString('en-CA')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Renewal Date</p>
                    <p className="text-lg font-semibold text-orange-600">{new Date(selectedProperty.renewalDate).toLocaleDateString('en-CA')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">LTV</p>
                    <p className="text-lg font-semibold">{((parseFloat(selectedProperty.currentBalance) / parseFloat(selectedProperty.propertyValue)) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Equity</p>
                    <p className="text-lg font-semibold text-green-600">${(parseFloat(selectedProperty.propertyValue) - parseFloat(selectedProperty.currentBalance)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment</p>
                    <p className="text-lg font-semibold">${parseFloat(selectedProperty.monthlyPayment).toLocaleString()}/{selectedProperty.paymentFrequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining Term</p>
                    <p className="text-lg font-semibold">{selectedProperty.termMonths} months</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'forecast' && (
            <>
              {/* Market Forecast Chart */}
              <Card title="Interest Rate Forecast" subtitle="Bank of Canada projections">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketForecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[4, 6]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                      <Legend />
                      <Area type="monotone" dataKey="fixedRate" stroke="#3B82F6" fill="#DBEAFE" name="Fixed Rate" />
                      <Area type="monotone" dataKey="variableRate" stroke="#10B981" fill="#D1FAE5" name="Variable Rate" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Geopolitical Context */}
              <Card title="Market Intelligence" subtitle="Factors affecting Canadian mortgage rates">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {geopoliticalNotes.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{item.topic}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.impact === 'Rate Cuts Expected' || item.impact === 'Downward Pressure' ? 'bg-green-100 text-green-700' :
                          item.impact === 'Stable' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.impact}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{item.note}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Key Insights */}
              <Card title="Key Insights for Your Portfolio" className="bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <Info className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Variable rates are currently 0.7% lower than fixed rates. Consider variable if you have stable income and can handle rate fluctuations.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <Leaf className="w-5 h-5 text-green-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Bank of Canada is signaling rate cuts through 2026. If you have a variable rate, you may see automatic decreases in your payments.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <BarChart3 className="w-5 h-5 text-orange-600 mt-0.5" />
                    <p className="text-sm text-gray-700">Consider locking in your renewal 120 days before expiry to secure current rates. Many lenders offer rate holds.</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Add New Property</h3>
              <button onClick={() => setShowAddProperty(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                <input type="text" value={newProperty.name} onChange={(e) => setNewProperty({...newProperty, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={newProperty.address} onChange={(e) => setNewProperty({...newProperty, address: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Value ($)</label>
                <input type="number" value={newProperty.propertyValue} onChange={(e) => setNewProperty({...newProperty, propertyValue: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance ($)</label>
                <input type="number" value={newProperty.currentBalance} onChange={(e) => setNewProperty({...newProperty, currentBalance: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <input type="number" step="0.01" value={newProperty.interestRate} onChange={(e) => setNewProperty({...newProperty, interestRate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment ($)</label>
                <input type="number" value={newProperty.monthlyPayment} onChange={(e) => setNewProperty({...newProperty, monthlyPayment: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                <select value={newProperty.loanType} onChange={(e) => setNewProperty({...newProperty, loanType: e.target.value as any})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="fixed">Fixed Rate</option>
                  <option value="variable">Variable Rate</option>
                  <option value="heloc">HELOC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Date</label>
                <input type="date" value={newProperty.renewalDate} onChange={(e) => setNewProperty({...newProperty, renewalDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowAddProperty(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleAddProperty} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Property</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MortgageAnalyzer;
