import React, { useState, useEffect } from 'react';

const BudgetBuilderPage = ({ currentInsights = {}, onComplete }) => {
  const [income, setIncome] = useState({
    monthly: 0,
    frequency: 'monthly',
    sources: []
  });

  const [expenses, setExpenses] = useState({
    housing: 0,
    transportation: 0,
    food: 0,
    utilities: 0,
    healthcare: 0,
    personalCare: 0,
    entertainment: 0,
    shopping: 0,
    subscriptions: 0,
    other: 0
  });

  const [savings, setSavings] = useState({
    emergency: 0,
    retirement: 0,
    goals: 0
  });

  const [budgetStrategy, setBudgetStrategy] = useState('50/30/20');
  const [showResults, setShowResults] = useState(false);

  // Get budget recommendations based on archetype
  const getBudgetRecommendations = (archetype) => {
    const recommendations = {
      'The Strategic Freedom Builder': {
        strategy: '30/30/40',
        description: 'Aggressive savings for wealth building',
        allocations: {
          needs: 30,
          wants: 30,
          savings: 40
        },
        priorities: ['Max retirement contributions', 'Taxable investments', 'Emergency fund', 'Experiences'],
        tips: [
          'Automate investments before you see the money',
          'Use tax-advantaged accounts first (401k, IRA, HSA)',
          'Consider low-cost index funds for diversification',
          'Track expenses to find optimization opportunities'
        ]
      },
      'The Mindful Worrier': {
        strategy: '60/20/20',
        description: 'Security-focused with manageable savings',
        allocations: {
          needs: 60,
          wants: 20,
          savings: 20
        },
        priorities: ['Emergency fund (6 months)', 'Debt payoff', 'Simple investing', 'Low stress'],
        tips: [
          'Start with a $1,000 emergency fund',
          'Automate savings so you don\'t have to think about it',
          'Use simple target-date funds for investing',
          'Focus on one financial goal at a time'
        ]
      },
      'The Experience Collector': {
        strategy: '50/40/10',
        description: 'Experience-focused with smart savings',
        allocations: {
          needs: 50,
          wants: 40,
          savings: 10
        },
        priorities: ['Experience fund', 'Travel savings', 'Emergency fund', 'Growth investments'],
        tips: [
          'Create separate savings for different experiences',
          'Use travel rewards credit cards (pay off monthly)',
          'Plan experiences 6-12 months ahead for better prices',
          'Invest savings for long-term experience funding'
        ]
      },
      'The Balanced Explorer': {
        strategy: '50/30/20',
        description: 'Classic balanced approach',
        allocations: {
          needs: 50,
          wants: 30,
          savings: 20
        },
        priorities: ['Emergency fund', 'Retirement', 'Medium-term goals', 'Flexibility'],
        tips: [
          'Follow the tried-and-true 50/30/20 rule',
          'Review and adjust every 6 months',
          'Balance security and growth in investments',
          'Leave room for opportunities'
        ]
      },
      'The Authentic Explorer': {
        strategy: '70/20/10',
        description: 'Gentle start with room to learn',
        allocations: {
          needs: 70,
          wants: 20,
          savings: 10
        },
        priorities: ['Basic emergency fund', 'Learning', 'Small consistent savings', 'Confidence building'],
        tips: [
          'Start small and build confidence',
          'Track expenses for 2 months first',
          'Celebrate small wins along the way',
          'Increase savings rate as you learn and earn more'
        ]
      }
    };

    return recommendations[archetype] || recommendations['The Balanced Explorer'];
  };

  const recommendation = getBudgetRecommendations(currentInsights?.archetype);

  const calculateTotals = () => {
    const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + Number(expense), 0);
    const totalSavings = Object.values(savings).reduce((sum, saving) => sum + Number(saving), 0);
    const totalAllocated = totalExpenses + totalSavings;
    const remaining = income.monthly - totalAllocated;
    
    return {
      totalExpenses,
      totalSavings,
      totalAllocated,
      remaining,
      savingsRate: income.monthly > 0 ? ((totalSavings / income.monthly) * 100).toFixed(1) : 0
    };
  };

  const applyRecommendation = () => {
    const monthlyIncome = income.monthly;
    if (monthlyIncome <= 0) return;

    const { needs, wants, savings: savingsPercent } = recommendation.allocations;
    
    // Calculate amounts
    const needsAmount = monthlyIncome * (needs / 100);
    const wantsAmount = monthlyIncome * (wants / 100);
    const savingsAmount = monthlyIncome * (savingsPercent / 100);

    // Distribute needs across essential categories
    const housingRatio = 0.4; // 40% of needs for housing
    const transportationRatio = 0.2; // 20% for transportation
    const foodRatio = 0.15; // 15% for food
    const utilitiesRatio = 0.1; // 10% for utilities
    const healthcareRatio = 0.1; // 10% for healthcare
    const personalCareRatio = 0.05; // 5% for personal care

    setExpenses({
      housing: Math.round(needsAmount * housingRatio),
      transportation: Math.round(needsAmount * transportationRatio),
      food: Math.round(needsAmount * foodRatio),
      utilities: Math.round(needsAmount * utilitiesRatio),
      healthcare: Math.round(needsAmount * healthcareRatio),
      personalCare: Math.round(needsAmount * personalCareRatio),
      entertainment: Math.round(wantsAmount * 0.6),
      shopping: Math.round(wantsAmount * 0.3),
      subscriptions: Math.round(wantsAmount * 0.1),
      other: 0
    });

    // Distribute savings
    setSavings({
      emergency: Math.round(savingsAmount * 0.4),
      retirement: Math.round(savingsAmount * 0.4),
      goals: Math.round(savingsAmount * 0.2)
    });

    setBudgetStrategy(recommendation.strategy);
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4">
            <span className="text-2xl">💰</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Smart Budget Builder
          </h1>
          <p className="text-white/80 text-lg mb-4">
            Create a budget aligned with your dream lifestyle
          </p>
          {currentInsights?.archetype && (
            <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2">
              <span className="text-white/60 text-sm">
                Personalized for: <span className="text-white font-medium">{currentInsights.archetype}</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Budget Inputs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Income Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Income</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income</label>
                  <input
                    type="number"
                    value={income.monthly}
                    onChange={(e) => setIncome({...income, monthly: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Strategy</label>
                  <select
                    value={budgetStrategy}
                    onChange={(e) => setBudgetStrategy(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="50/30/20">50/30/20 (Balanced)</option>
                    <option value="60/20/20">60/20/20 (Conservative)</option>
                    <option value="30/30/40">30/30/40 (Aggressive Savings)</option>
                    <option value="50/40/10">50/40/10 (Experience-Focused)</option>
                  </select>
                </div>
              </div>
              
              {income.monthly > 0 && (
                <div className="mt-4">
                  <button
                    onClick={applyRecommendation}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Apply {currentInsights?.archetype ? 'Personalized' : 'Recommended'} Budget
                  </button>
                </div>
              )}
            </div>

            {/* Expenses Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Expenses</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(expenses).map(([category, amount]) => (
                  <div key={category}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setExpenses({...expenses, [category]: Number(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Savings & Investments</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Fund</label>
                  <input
                    type="number"
                    value={savings.emergency}
                    onChange={(e) => setSavings({...savings, emergency: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retirement</label>
                  <input
                    type="number"
                    value={savings.retirement}
                    onChange={(e) => setSavings({...savings, retirement: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goals</label>
                  <input
                    type="number"
                    value={savings.goals}
                    onChange={(e) => setSavings({...savings, goals: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results & Recommendations */}
          <div className="space-y-6">
            {/* Budget Summary */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Budget Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Income:</span>
                  <span className="font-semibold text-gray-800">${income.monthly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses:</span>
                  <span className="font-semibold text-red-600">${totals.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Savings:</span>
                  <span className="font-semibold text-green-600">${totals.totalSavings.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className={`font-bold ${totals.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totals.remaining.toLocaleString()}
                  </span>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <strong>Savings Rate: {totals.savingsRate}%</strong>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {totals.savingsRate < 10 ? 'Consider increasing savings' : 
                     totals.savingsRate < 20 ? 'Good savings rate' :
                     'Excellent savings rate!'}
                  </div>
                </div>
              </div>
            </div>

            {/* Personalized Recommendations */}
            {currentInsights?.archetype && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Your Budget Strategy</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-lg font-semibold">{recommendation.strategy}</div>
                    <div className="text-blue-100 text-sm">{recommendation.description}</div>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Top Priorities:</div>
                    <ul className="text-sm space-y-1">
                      {recommendation.priorities.map((priority, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                          {priority}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            {recommendation.tips && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Tips</h3>
                <div className="space-y-3">
                  {recommendation.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 text-sm rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => onComplete && onComplete({ income, expenses, savings, totals, recommendation })}
              disabled={totals.remaining < -500}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg disabled:cursor-not-allowed"
            >
              {totals.remaining < -500 ? 'Balance Your Budget First' : 'Save Budget & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetBuilderPage;