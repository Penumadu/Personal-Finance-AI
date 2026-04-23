export const SAMPLE_INVESTMENTS = [
  {
    id: 'sample-1',
    name: 'Wealthsimple TFSA',
    type: 'tfsa',
    value: '45000',
    return_rate: '8.5',
    ytd_return: '12.4',
    provider: 'Wealthsimple',
    risk_level: 'medium',
    last_updated: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sample-2',
    name: 'Questrade RRSP',
    type: 'rrsp',
    value: '65000',
    return_rate: '7.2',
    ytd_return: '9.8',
    provider: 'Questrade',
    risk_level: 'medium',
    last_updated: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sample-3',
    name: 'S&P 500 Index Fund',
    type: 'stocks',
    value: '25000',
    return_rate: '10.5',
    ytd_return: '15.2',
    provider: 'Vanguard',
    risk_level: 'high',
    last_updated: new Date().toISOString().split('T')[0]
  },
  {
    id: 'sample-4',
    name: 'High Interest Savings',
    type: 'savings',
    value: '15000',
    return_rate: '4.5',
    ytd_return: '4.5',
    provider: 'EQ Bank',
    risk_level: 'low',
    last_updated: new Date().toISOString().split('T')[0]
  }
];

export const SAMPLE_INCOME = [
  {
    id: 'sample-inc-1',
    source_type: 'salary',
    source_name: 'Senior Software Engineer',
    amount: '8500',
    frequency: 'monthly'
  },
  {
    id: 'sample-inc-2',
    source_type: 'freelance',
    source_name: 'Consulting Gigs',
    amount: '1200',
    frequency: 'monthly'
  },
  {
    id: 'sample-inc-3',
    source_type: 'rental',
    source_name: 'Basement Suite',
    amount: '1500',
    frequency: 'monthly'
  }
];

export const SAMPLE_CREDIT_CARDS = [
  {
    id: 'sample-cc-1',
    card_name: 'TD Cash Back Visa Infinite',
    balance: '4200',
    apr: '20.99',
    credit_limit: '15000'
  },
  {
    id: 'sample-cc-2',
    card_name: 'Amex Cobalt',
    balance: '1500',
    apr: '21.99',
    credit_limit: '10000'
  },
  {
    id: 'sample-cc-3',
    card_name: 'Scotiabank Passport',
    balance: '0',
    apr: '19.99',
    credit_limit: '12000'
  }
];

export const SAMPLE_DEBTS = [
  {
    id: 'sample-debt-1',
    name: 'Student Loan',
    balance: '25000',
    interest_rate: '6.5',
    minimum_payment: '350'
  },
  {
    id: 'sample-debt-2',
    name: 'Car Loan',
    balance: '12000',
    interest_rate: '5.9',
    minimum_payment: '450'
  },
  {
    id: 'sample-debt-3',
    name: 'Personal Line of Credit',
    balance: '5000',
    interest_rate: '11.5',
    minimum_payment: '150'
  }
];

export const SAMPLE_MORTGAGES = [
  {
    id: 'sample-mort-1',
    name: 'Primary Residence',
    address: '123 Maple St, Toronto, ON',
    propertyValue: '850000',
    currentBalance: '520000',
    interestRate: '5.24',
    monthlyPayment: '3150',
    originalAmount: '600000',
    startDate: '2023-05-15',
    termMonths: '300',
    loanType: 'fixed' as const,
    renewalDate: '2028-05-15',
    paymentFrequency: 'monthly' as const
  },
  {
    id: 'sample-mort-2',
    name: 'Investment Property',
    address: '456 Oak Ave, Vancouver, BC',
    propertyValue: '650000',
    currentBalance: '380000',
    interestRate: '6.15',
    monthlyPayment: '2450',
    originalAmount: '450000',
    startDate: '2024-02-10',
    termMonths: '300',
    loanType: 'variable' as const,
    renewalDate: '2029-02-10',
    paymentFrequency: 'monthly' as const
  }
];

export const SAMPLE_TRANSACTIONS = [
  { id: 't1', date: new Date().toISOString().split('T')[0], description: 'Grocery Store', amount: '120.50', category: 'Food' },
  { id: 't2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], description: 'Gas Station', amount: '45.00', category: 'Transportation' },
  { id: 't3', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], description: 'Electric Bill', amount: '95.20', category: 'Utilities' },
  { id: 't4', date: new Date(Date.now() - 259200000).toISOString().split('T')[0], description: 'Restaurant', amount: '65.00', category: 'Food' },
  { id: 't5', date: new Date(Date.now() - 345600000).toISOString().split('T')[0], description: 'Movie Tickets', amount: '30.00', category: 'Entertainment' },
];

export const SAMPLE_BUDGETS = [
  { category: 'Housing', limit: '2000' },
  { category: 'Food', limit: '600' },
  { category: 'Transportation', limit: '400' },
  { category: 'Utilities', limit: '300' },
  { category: 'Entertainment', limit: '200' },
  { category: 'Shopping', limit: '300' },
  { category: 'Healthcare', limit: '200' },
  { category: 'Other', limit: '200' },
];
