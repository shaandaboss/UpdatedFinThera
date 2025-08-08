import React, { useState, useEffect } from 'react';

const ActionPlanPage = ({ conversationData, therapistNotes, currentInsights, onContinue }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Generate archetype-specific action plan
  const getActionPlan = (archetype, insights) => {
    const baseGoals = insights?.financialGoals || [];
    const riskLevel = insights?.riskLevel || 'Moderate';
    
    const plans = {
      'The Strategic Freedom Builder': {
        title: 'Strategic Wealth Building Plan',
        description: 'A data-driven approach to financial independence',
        color: 'from-blue-500 to-blue-700',
        icon: '📊',
        priority: 'Advanced Implementation',
        timeframe: '2-5 Years to Major Milestones',
        actions: [
          {
            category: 'Investment Strategy',
            priority: 'High',
            items: [
              'Max out 401(k) and IRA contributions ($23,000 + $7,000 annually)',
              'Open taxable investment account with low-cost index funds',
              'Implement tax-loss harvesting strategy',
              'Consider Roth IRA conversions during low-income years'
            ]
          },
          {
            category: 'Tax Optimization',
            priority: 'High', 
            items: [
              'HSA triple tax advantage (contribute $4,300 annually)',
              'Backdoor Roth IRA if income limits apply',
              'Asset location optimization (bonds in tax-deferred accounts)',
              'Review tax-efficient fund placement annually'
            ]
          },
          {
            category: 'Advanced Strategies',
            priority: 'Medium',
            items: [
              'Dollar-cost averaging into broad market index funds',
              'Research real estate investment trusts (REITs)',
              'Consider I-bonds for inflation protection ($10K limit)',
              'Explore low-cost international diversification'
            ]
          }
        ],
        nextSteps: [
          'Complete comprehensive financial audit',
          'Set up automated investment transfers',
          'Schedule quarterly portfolio reviews',
          'Track progress with detailed spreadsheet or app'
        ]
      },
      
      'The Mindful Worrier': {
        title: 'Calm & Confident Financial Plan',
        description: 'Simple, stress-free approach to financial security',
        color: 'from-green-500 to-green-700', 
        icon: '🌱',
        priority: 'Foundation Building',
        timeframe: '6-18 Months to Financial Peace',
        actions: [
          {
            category: 'Emergency Safety Net',
            priority: 'Critical',
            items: [
              'Build 3-6 months expenses in high-yield savings (target: $15,000-30,000)',
              'Automate $500-1000 monthly to emergency fund',
              'Keep emergency fund in separate, easily accessible account',
              'Celebrate each $5,000 milestone reached'
            ]
          },
          {
            category: 'Simple Automation',
            priority: 'High',
            items: [
              'Set up automatic bill pay for all fixed expenses',
              'Automate 10-15% savings before you see the money',
              'Use "set it and forget it" target-date retirement fund',
              'Automate small investments ($100-200/month to start)'
            ]
          },
          {
            category: 'Debt Management',
            priority: 'High',
            items: [
              'List all debts with minimum payments and interest rates',
              'Pay minimums on all, extra on highest interest rate debt',
              'Consider debt consolidation if it simplifies payments',
              'Track progress with visual debt thermometer'
            ]
          }
        ],
        nextSteps: [
          'Open high-yield savings account this week',
          'Set up one automatic transfer to start',
          'Choose one debt to focus extra payments on',
          'Schedule monthly 15-minute money check-ins'
        ]
      },

      'The Experience Collector': {
        title: 'Dream Lifestyle Funding Plan', 
        description: 'Balance amazing experiences with financial growth',
        color: 'from-purple-500 to-purple-700',
        icon: '✈️',
        priority: 'Lifestyle Integration', 
        timeframe: '1-3 Years to Major Adventures',
        actions: [
          {
            category: 'Experience Budgeting',
            priority: 'High',
            items: [
              'Create dedicated "Experience Fund" separate from savings',
              'Automate $300-800/month for travel and experiences',
              'Plan 2-3 major experiences annually with specific saving goals',
              'Use 50/30/20 rule: 50% needs, 30% experiences, 20% savings'
            ]
          },
          {
            category: 'Smart Travel Savings',
            priority: 'High',
            items: [
              'Open high-yield savings for each major trip planned',
              'Use travel rewards credit card for daily expenses (pay off monthly)',
              'Book experiences 6-12 months ahead for better prices',
              'Set price alerts for flights and accommodations'
            ]
          },
          {
            category: 'Growth Integration',
            priority: 'Medium', 
            items: [
              'Invest 10-15% in growth funds for long-term experiences',
              'Consider rental property in favorite travel destination',
              'Build experiences that can generate income (food blog, travel content)',
              'Network with others who share your lifestyle values'
            ]
          }
        ],
        nextSteps: [
          'Pick your next big experience and set a savings goal',
          'Open dedicated experience savings account',
          'Set up automatic transfers for experience fund',
          'Research travel rewards credit card options'
        ]
      },

      'The Balanced Explorer': {
        title: 'Thoughtful Growth Plan',
        description: 'Explore financial growth while maintaining balance',
        color: 'from-teal-500 to-teal-700',
        icon: '⚖️', 
        priority: 'Steady Progress',
        timeframe: '1-4 Years to Major Progress',
        actions: [
          {
            category: 'Balanced Foundation',
            priority: 'High',
            items: [
              'Build emergency fund to 3-4 months expenses',
              'Contribute to retirement with employer match first',
              'Invest 60% stocks/40% bonds for moderate growth',
              'Review and adjust plan every 6 months'
            ]
          },
          {
            category: 'Growth Opportunities', 
            priority: 'Medium',
            items: [
              'Increase retirement contributions by 1% annually',
              'Explore side income opportunities aligned with interests',
              'Learn about different investment options gradually',
              'Consider real estate when financially ready'
            ]
          },
          {
            category: 'Lifestyle Balance',
            priority: 'Medium',
            items: [
              'Budget for both security and enjoyment',
              'Plan for medium-term goals (5-10 years)',
              'Maintain flexibility for opportunities and changes',
              'Regular financial education and learning'
            ]
          }
        ],
        nextSteps: [
          'Complete current financial assessment',
          'Choose balanced investment approach',
          'Set up systematic review schedule',
          'Begin exploring one new financial concept monthly'
        ]
      },

      'The Authentic Explorer': {
        title: 'Discovery-Based Financial Plan',
        description: 'Build financial confidence through exploration and learning',
        color: 'from-orange-500 to-orange-700',
        icon: '🎯',
        priority: 'Learning & Discovery',
        timeframe: '6 months to 2 years to find your path',
        actions: [
          {
            category: 'Financial Foundation',
            priority: 'Critical',
            items: [
              'Start with $1,000 emergency fund as initial goal',
              'Track spending for 2 months to understand patterns',
              'Set up basic savings account with automatic transfers',
              'Learn fundamentals through courses or apps (15 min/day)'
            ]
          },
          {
            category: 'Guided Exploration',
            priority: 'High',
            items: [
              'Try different budgeting methods (envelope, 50/30/20, zero-based)',
              'Experiment with micro-investing apps to learn ($25-50/month)',
              'Join financial communities for peer learning and support',
              'Read one financial book or take one course quarterly'
            ]
          },
          {
            category: 'Building Confidence',
            priority: 'Medium',
            items: [
              'Set small, achievable financial goals monthly',
              'Celebrate each milestone to build positive associations',
              'Find accountability partner or join online community',
              'Document learning journey to track progress and insights'
            ]
          }
        ],
        nextSteps: [
          'Set first small savings goal ($500-1000)',
          'Choose one learning resource to start this week',
          'Track expenses for one week to start',
          'Join one financial community or find accountability partner'
        ]
      }
    };

    return plans[archetype] || plans['The Balanced Explorer'];
  };

  const actionPlan = getActionPlan(currentInsights?.archetype, currentInsights);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <span className="text-2xl">{actionPlan.icon}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Your Personalized Action Plan
          </h1>
          <p className="text-white/80 text-lg mb-4">
            Based on your conversation, here's your path forward
          </p>
          <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2">
            <span className="text-white/60 text-sm">
              Profile: <span className="text-white font-medium">{currentInsights?.archetype}</span>
            </span>
          </div>
        </div>

        {/* Action Plan Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <div className={`bg-gradient-to-r ${actionPlan.color} rounded-xl p-6 text-white mb-6`}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl">{actionPlan.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">{actionPlan.title}</h2>
                <p className="text-white/90">{actionPlan.description}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white/20 rounded-lg p-3">
                <span className="text-sm font-medium">Priority Level</span>
                <p className="text-lg">{actionPlan.priority}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <span className="text-sm font-medium">Timeline</span>
                <p className="text-lg">{actionPlan.timeframe}</p>
              </div>
            </div>
          </div>

          {/* Action Categories */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Action Categories</h3>
            
            {actionPlan.actions.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{category.category}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    category.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                    category.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {category.priority} Priority
                  </span>
                </div>
                
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Your Immediate Next Steps</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {actionPlan.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-blue-800">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={() => onContinue()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
          >
            Start Building My Financial Future
          </button>
          <p className="text-white/60 text-sm mt-3">
            Ready to turn this plan into action? Let's build your financial tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActionPlanPage;