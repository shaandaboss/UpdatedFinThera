import React, { useState, useEffect } from 'react';

const SavingsSetupPage = ({ currentInsights = {}, budgetData, onComplete }) => {
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [savingsPlans, setSavingsPlans] = useState([]);
  const [totalMonthlySavings, setTotalMonthlySavings] = useState(0);
  const [automationPreference, setAutomationPreference] = useState('aggressive');

  // Mock bank accounts for demonstration
  const mockAccounts = [
    { id: 'checking-1', name: 'Primary Checking', type: 'checking', balance: 5234, bank: 'Chase Bank', selected: false },
    { id: 'savings-1', name: 'Main Savings', type: 'savings', balance: 12850, bank: 'Chase Bank', selected: false },
    { id: 'checking-2', name: 'Business Checking', type: 'checking', balance: 8932, bank: 'Bank of America', selected: false }
  ];

  // Initialize savings plans based on archetype and budget
  useEffect(() => {
    const getSavingsRecommendations = (archetype, budget) => {
      const monthlyIncome = budget?.income?.monthly || 5000;
      const currentSavings = budget?.savings || { emergency: 0, retirement: 0, goals: 0 };
      
      const plans = {
        'The Strategic Freedom Builder': [
          {
            id: 'emergency-fund',
            name: 'Emergency Fund',
            targetAmount: monthlyIncome * 6,
            monthlyAmount: Math.max(500, monthlyIncome * 0.15),
            priority: 'high',
            accountType: 'High-Yield Savings',
            description: '6 months of expenses for financial security',
            automation: 'Day after paycheck',
            estimatedCompletion: '18 months'
          },
          {
            id: 'retirement-max',
            name: 'Retirement Maximization',
            targetAmount: 23000,
            monthlyAmount: Math.min(1917, monthlyIncome * 0.2),
            priority: 'critical',
            accountType: '401(k) + IRA',
            description: 'Max out tax-advantaged retirement accounts',
            automation: 'Payroll deduction + monthly transfer',
            estimatedCompletion: '12 months'
          },
          {
            id: 'taxable-investment',
            name: 'Taxable Investment Account',
            targetAmount: 100000,
            monthlyAmount: Math.max(800, monthlyIncome * 0.1),
            priority: 'high',
            accountType: 'Brokerage Account',
            description: 'Build wealth through index fund investing',
            automation: 'Bi-weekly after 401k',
            estimatedCompletion: '8-10 years'
          }
        ],
        'The Mindful Worrier': [
          {
            id: 'starter-emergency',
            name: 'Starter Emergency Fund',
            targetAmount: 1000,
            monthlyAmount: Math.min(200, monthlyIncome * 0.05),
            priority: 'critical',
            accountType: 'High-Yield Savings',
            description: 'Quick $1,000 safety net for peace of mind',
            automation: 'Weekly small transfers',
            estimatedCompletion: '5 months'
          },
          {
            id: 'full-emergency',
            name: 'Full Emergency Fund',
            targetAmount: monthlyIncome * 4,
            monthlyAmount: Math.max(300, monthlyIncome * 0.08),
            priority: 'high',
            accountType: 'High-Yield Savings',
            description: '4 months of expenses (conservative approach)',
            automation: 'Automatic monthly transfer',
            estimatedCompletion: '12-15 months'
          },
          {
            id: 'simple-retirement',
            name: 'Simple Retirement Plan',
            targetAmount: 50000,
            monthlyAmount: Math.max(200, monthlyIncome * 0.06),
            priority: 'medium',
            accountType: 'Target-Date Fund',
            description: 'Set-it-and-forget-it retirement investing',
            automation: 'Monthly after emergency fund',
            estimatedCompletion: '15-20 years'
          }
        ],
        'The Experience Collector': [
          {
            id: 'experience-fund',
            name: 'Experience Fund',
            targetAmount: monthlyIncome * 2,
            monthlyAmount: Math.max(400, monthlyIncome * 0.12),
            priority: 'high',
            accountType: 'High-Yield Savings',
            description: 'Fund for travel, concerts, and memorable experiences',
            automation: 'Bi-weekly transfers',
            estimatedCompletion: '6-8 months'
          },
          {
            id: 'emergency-lean',
            name: 'Lean Emergency Fund',
            targetAmount: monthlyIncome * 3,
            monthlyAmount: Math.max(250, monthlyIncome * 0.07),
            priority: 'medium',
            accountType: 'High-Yield Savings',
            description: '3 months expenses (lean but sufficient)',
            automation: 'Monthly automatic transfer',
            estimatedCompletion: '10-12 months'
          },
          {
            id: 'growth-investment',
            name: 'Experience Growth Fund',
            targetAmount: 25000,
            monthlyAmount: Math.max(300, monthlyIncome * 0.08),
            priority: 'medium',
            accountType: 'Growth-Focused Investment',
            description: 'Grow money for bigger future experiences',
            automation: 'Monthly after experience fund',
            estimatedCompletion: '5-7 years'
          }
        ],
        'The Balanced Explorer': [
          {
            id: 'emergency-balanced',
            name: 'Emergency Fund',
            targetAmount: monthlyIncome * 4,
            monthlyAmount: Math.max(350, monthlyIncome * 0.08),
            priority: 'high',
            accountType: 'High-Yield Savings',
            description: '4 months of expenses for security',
            automation: 'Monthly automatic transfer',
            estimatedCompletion: '11-12 months'
          },
          {
            id: 'retirement-steady',
            name: 'Steady Retirement Building',
            targetAmount: monthlyIncome * 120,
            monthlyAmount: Math.max(400, monthlyIncome * 0.1),
            priority: 'high',
            accountType: 'Balanced Portfolio',
            description: '10x annual income for retirement',
            automation: 'Monthly after emergency fund',
            estimatedCompletion: '25-30 years'
          },
          {
            id: 'opportunity-fund',
            name: 'Opportunity Fund',
            targetAmount: monthlyIncome * 6,
            monthlyAmount: Math.max(200, monthlyIncome * 0.05),
            priority: 'medium',
            accountType: 'Flexible Savings',
            description: 'Money for unexpected opportunities',
            automation: 'Monthly automatic transfer',
            estimatedCompletion: '2-3 years'
          }
        ],
        'The Authentic Explorer': [
          {
            id: 'confidence-builder',
            name: 'Confidence Building Fund',
            targetAmount: 500,
            monthlyAmount: Math.min(100, monthlyIncome * 0.03),
            priority: 'critical',
            accountType: 'Regular Savings',
            description: 'Small wins to build financial confidence',
            automation: 'Weekly micro-transfers',
            estimatedCompletion: '5-6 months'
          },
          {
            id: 'learning-emergency',
            name: 'Learning Emergency Fund',
            targetAmount: monthlyIncome * 2,
            monthlyAmount: Math.max(150, monthlyIncome * 0.05),
            priority: 'high',
            accountType: 'High-Yield Savings',
            description: '2 months expenses as you learn and grow',
            automation: 'Bi-weekly small amounts',
            estimatedCompletion: '12-15 months'
          },
          {
            id: 'exploration-fund',
            name: 'Financial Exploration Fund',
            targetAmount: 2000,
            monthlyAmount: Math.max(100, monthlyIncome * 0.03),
            priority: 'medium',
            accountType: 'Investment Learning Account',
            description: 'Small fund to experiment with investing',
            automation: 'Monthly after emergency fund',
            estimatedCompletion: '18-24 months'
          }
        ]
      };

      return plans[archetype] || plans['The Balanced Explorer'];
    };

    const plans = getSavingsRecommendations(currentInsights?.archetype, budgetData);
    setSavingsPlans(plans);
    setTotalMonthlySavings(plans.reduce((sum, plan) => sum + plan.monthlyAmount, 0));
  }, [currentInsights, budgetData]);

  const getAutomationStrategy = (preference) => {
    const strategies = {
      conservative: {
        title: 'Gentle Approach',
        description: 'Start small and build confidence',
        frequency: 'Weekly small amounts',
        startDelay: '1 week after setup',
        riskLevel: 'Very Low'
      },
      moderate: {
        title: 'Steady Progress',
        description: 'Balanced approach to building wealth',
        frequency: 'Bi-weekly transfers',
        startDelay: '3 days after setup',
        riskLevel: 'Low to Moderate'
      },
      aggressive: {
        title: 'Maximum Impact',
        description: 'Fast-track your financial goals',
        frequency: 'Immediate after paycheck',
        startDelay: 'Next business day',
        riskLevel: 'Moderate'
      }
    };
    
    return strategies[preference] || strategies.moderate;
  };

  const togglePlan = (planId) => {
    setSavingsPlans(plans => 
      plans.map(plan => 
        plan.id === planId 
          ? { ...plan, selected: !plan.selected }
          : plan
      )
    );
  };

  const updatePlanAmount = (planId, newAmount) => {
    setSavingsPlans(plans =>
      plans.map(plan =>
        plan.id === planId
          ? { ...plan, monthlyAmount: newAmount }
          : plan
      )
    );
    
    // Recalculate total
    const updatedPlans = savingsPlans.map(plan =>
      plan.id === planId ? { ...plan, monthlyAmount: newAmount } : plan
    );
    setTotalMonthlySavings(updatedPlans.reduce((sum, plan) => sum + (plan.selected ? plan.monthlyAmount : 0), 0));
  };

  const strategy = getAutomationStrategy(automationPreference);
  const selectedPlans = savingsPlans.filter(plan => plan.selected);
  const selectedTotal = selectedPlans.reduce((sum, plan) => sum + plan.monthlyAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-4">
            <span className="text-2xl">💼</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Automated Savings Setup
          </h1>
          <p className="text-white/80 text-lg mb-4">
            Set up automatic transfers to reach your goals without thinking
          </p>
          {currentInsights?.archetype && (
            <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2">
              <span className="text-white/60 text-sm">
                Strategy for: <span className="text-white font-medium">{currentInsights.archetype}</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Account Selection */}
          <div>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Select Accounts</h3>
              <div className="text-sm text-gray-600 mb-4">
                * Demo accounts for illustration
              </div>
              <div className="space-y-3">
                {mockAccounts.map((account) => (
                  <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{account.name}</h4>
                        <div className="text-sm text-gray-600">{account.bank}</div>
                        <div className="text-lg font-bold text-green-600">
                          ${account.balance.toLocaleString()}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(account.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAccounts([...selectedAccounts, account.id]);
                          } else {
                            setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                          }
                        }}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automation Preference */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Automation Style</h3>
              <div className="space-y-3">
                {['conservative', 'moderate', 'aggressive'].map((pref) => {
                  const strategyInfo = getAutomationStrategy(pref);
                  return (
                    <label key={pref} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="automation"
                        value={pref}
                        checked={automationPreference === pref}
                        onChange={(e) => setAutomationPreference(e.target.value)}
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{strategyInfo.title}</div>
                        <div className="text-sm text-gray-600">{strategyInfo.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {strategyInfo.frequency} • Starts {strategyInfo.startDelay}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column - Savings Plans */}
          <div className="lg:col-span-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Your Savings Plans</h3>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Monthly</div>
                  <div className="text-2xl font-bold text-green-600">${selectedTotal.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                {savingsPlans.map((plan) => (
                  <div key={plan.id} className={`border-2 rounded-lg p-4 transition-all ${
                    plan.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={plan.selected || false}
                          onChange={() => togglePlan(plan.id)}
                          className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{plan.name}</h4>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Target: ${plan.targetAmount.toLocaleString()}</span>
                            <span>ETA: {plan.estimatedCompletion}</span>
                            <span className={`px-2 py-1 rounded ${
                              plan.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              plan.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {plan.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {plan.selected && (
                      <div className="ml-8 grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monthly Amount
                          </label>
                          <input
                            type="number"
                            value={plan.monthlyAmount}
                            onChange={(e) => updatePlanAmount(plan.id, Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Type
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                            {plan.accountType}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Setup Summary */}
            {selectedPlans.length > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white mb-6">
                <h3 className="text-xl font-bold mb-4">Your Automation Setup</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-green-100 mb-2">Monthly Savings</div>
                    <div className="text-3xl font-bold">${selectedTotal.toLocaleString()}</div>
                    <div className="text-sm text-green-100 mt-1">
                      Across {selectedPlans.length} goals
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-100 mb-2">Strategy</div>
                    <div className="text-lg font-semibold">{strategy.title}</div>
                    <div className="text-sm text-green-100">{strategy.frequency}</div>
                  </div>
                </div>

                <div className="mt-6 bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">What Happens Next:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Automatic transfers start {strategy.startDelay}</li>
                    <li>• You'll get confirmation emails for each transfer</li>
                    <li>• Adjust or pause anytime through your dashboard</li>
                    <li>• Progress tracking and milestone celebrations included</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center">
              <button
                onClick={() => onComplete && onComplete({ 
                  selectedAccounts, 
                  selectedPlans, 
                  automationPreference, 
                  totalMonthlySavings: selectedTotal,
                  strategy
                })}
                disabled={selectedPlans.length === 0}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg disabled:cursor-not-allowed"
              >
                {selectedPlans.length === 0 ? 'Select at least one savings plan' : 'Set Up Automation'}
              </button>
              <p className="text-white/60 text-sm mt-3">
                Your money will start working automatically toward your goals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsSetupPage;