import React, { useState, useEffect } from 'react';

const InvestmentEnginePage = ({ currentInsights = {}, onComplete }) => {
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [timeHorizon, setTimeHorizon] = useState('long');
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [investmentGoals, setInvestmentGoals] = useState([]);
  const [portfolioRecommendation, setPortfolioRecommendation] = useState(null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(true);

  // Risk assessment questions
  const riskQuestions = [
    {
      id: 'volatility',
      question: 'How would you react if your investment lost 20% of its value in one year?',
      options: [
        { value: 'conservative', label: 'Panic and sell immediately', weight: 1 },
        { value: 'moderate', label: 'Feel worried but hold on', weight: 3 },
        { value: 'aggressive', label: 'See it as a buying opportunity', weight: 5 }
      ]
    },
    {
      id: 'timeline',
      question: 'When do you plan to use this money?',
      options: [
        { value: 'conservative', label: 'Within 5 years', weight: 1 },
        { value: 'moderate', label: '5-15 years from now', weight: 3 },
        { value: 'aggressive', label: 'More than 15 years', weight: 5 }
      ]
    },
    {
      id: 'experience',
      question: 'How much investing experience do you have?',
      options: [
        { value: 'conservative', label: 'Complete beginner', weight: 1 },
        { value: 'moderate', label: 'Some knowledge and experience', weight: 3 },
        { value: 'aggressive', label: 'Very experienced investor', weight: 5 }
      ]
    }
  ];

  const [riskAnswers, setRiskAnswers] = useState({});

  // Calculate risk tolerance from assessment
  const calculateRiskTolerance = () => {
    const totalWeight = Object.values(riskAnswers).reduce((sum, answer) => {
      const question = riskQuestions.find(q => q.id === answer.questionId);
      const option = question?.options.find(opt => opt.value === answer.value);
      return sum + (option?.weight || 0);
    }, 0);

    const avgWeight = totalWeight / Object.keys(riskAnswers).length;
    
    if (avgWeight <= 2) return 'conservative';
    if (avgWeight <= 4) return 'moderate';
    return 'aggressive';
  };

  // Get portfolio recommendation based on archetype and risk tolerance
  const getPortfolioRecommendation = (archetype, risk, horizon, amount) => {
    const portfolios = {
      conservative: {
        name: 'Capital Preservation Portfolio',
        riskLevel: 'Low',
        expectedReturn: '3-5% annually',
        allocation: {
          'High-Yield Savings': 40,
          'Government Bonds': 30,
          'Corporate Bonds': 20,
          'Conservative Stocks': 10
        },
        funds: [
          { name: 'Vanguard Total Bond Market (BND)', allocation: 50, expense: '0.03%' },
          { name: 'Schwab Treasury Bill ETF (SCHO)', allocation: 30, expense: '0.03%' },
          { name: 'Vanguard Dividend Appreciation (VIG)', allocation: 20, expense: '0.06%' }
        ],
        monthlyAmount: Math.max(100, amount * 0.1),
        description: 'Focus on preserving capital while generating modest returns'
      },
      moderate: {
        name: 'Balanced Growth Portfolio',
        riskLevel: 'Moderate',
        expectedReturn: '6-8% annually',
        allocation: {
          'US Stock Market': 40,
          'International Stocks': 20,
          'Bonds': 25,
          'REITs': 10,
          'Cash': 5
        },
        funds: [
          { name: 'Vanguard Total Stock Market (VTI)', allocation: 40, expense: '0.03%' },
          { name: 'Vanguard International Stock (VTIAX)', allocation: 20, expense: '0.05%' },
          { name: 'Vanguard Total Bond Market (BND)', allocation: 25, expense: '0.03%' },
          { name: 'Vanguard Real Estate (VNQ)', allocation: 10, expense: '0.12%' },
          { name: 'High-Yield Savings', allocation: 5, expense: '0%' }
        ],
        monthlyAmount: Math.max(200, amount * 0.15),
        description: 'Balanced approach combining growth potential with stability'
      },
      aggressive: {
        name: 'Growth Maximization Portfolio',
        riskLevel: 'High',
        expectedReturn: '8-12% annually',
        allocation: {
          'US Growth Stocks': 50,
          'International Stocks': 25,
          'Emerging Markets': 15,
          'Bonds': 10
        },
        funds: [
          { name: 'Vanguard S&P 500 (VOO)', allocation: 30, expense: '0.03%' },
          { name: 'Vanguard Growth ETF (VUG)', allocation: 20, expense: '0.04%' },
          { name: 'Vanguard International Stock (VTIAX)', allocation: 25, expense: '0.05%' },
          { name: 'Vanguard Emerging Markets (VWO)', allocation: 15, expense: '0.08%' },
          { name: 'Vanguard Total Bond Market (BND)', allocation: 10, expense: '0.03%' }
        ],
        monthlyAmount: Math.max(300, amount * 0.2),
        description: 'Maximum growth potential for long-term wealth building'
      }
    };

    // Adjust based on archetype
    let selectedPortfolio = { ...portfolios[risk] };

    switch (archetype) {
      case 'The Strategic Freedom Builder':
        selectedPortfolio.monthlyAmount = Math.max(500, amount * 0.25);
        selectedPortfolio.name = 'Strategic Wealth Building Portfolio';
        break;
      case 'The Mindful Worrier':
        selectedPortfolio = { ...portfolios.conservative };
        selectedPortfolio.name = 'Peace of Mind Portfolio';
        selectedPortfolio.monthlyAmount = Math.max(150, amount * 0.08);
        break;
      case 'The Experience Collector':
        selectedPortfolio.monthlyAmount = Math.max(200, amount * 0.12);
        selectedPortfolio.name = 'Experience Growth Portfolio';
        break;
    }

    return selectedPortfolio;
  };

  useEffect(() => {
    if (Object.keys(riskAnswers).length === riskQuestions.length) {
      const calculatedRisk = calculateRiskTolerance();
      setRiskTolerance(calculatedRisk);
      setShowRiskAssessment(false);
    }
  }, [riskAnswers]);

  useEffect(() => {
    if (!showRiskAssessment) {
      const recommendation = getPortfolioRecommendation(
        currentInsights?.archetype,
        riskTolerance,
        timeHorizon,
        investmentAmount
      );
      setPortfolioRecommendation(recommendation);
    }
  }, [currentInsights, riskTolerance, timeHorizon, investmentAmount, showRiskAssessment]);

  const handleRiskAnswer = (questionId, value) => {
    setRiskAnswers({
      ...riskAnswers,
      [questionId]: { questionId, value }
    });
  };

  const getPlatformRecommendations = () => {
    const platforms = {
      beginner: [
        { 
          name: 'Fidelity Go', 
          type: 'Robo-advisor',
          minInvestment: '$0',
          fees: '0.35%',
          pros: ['Automatic rebalancing', 'Low fees', 'Tax-loss harvesting'],
          cons: ['Limited customization']
        },
        {
          name: 'Schwab Intelligent Portfolios',
          type: 'Robo-advisor', 
          minInvestment: '$5,000',
          fees: '0%',
          pros: ['No advisory fees', 'Professional management', 'Tax optimization'],
          cons: ['Higher minimum', 'Cash allocation requirement']
        }
      ],
      intermediate: [
        {
          name: 'Vanguard',
          type: 'Low-cost index funds',
          minInvestment: '$1,000',
          fees: '0.03-0.05%',
          pros: ['Lowest expense ratios', 'Strong track record', 'Simple approach'],
          cons: ['Basic interface', 'Limited trading tools']
        },
        {
          name: 'Fidelity',
          type: 'Full service',
          minInvestment: '$0',
          fees: '0.03-0.09%',
          pros: ['Zero expense ratio funds', 'Great research tools', 'No minimums'],
          cons: ['Can be overwhelming for beginners']
        }
      ]
    };

    const experience = currentInsights?.keyTraits?.includes('Research-focused') ? 'intermediate' : 'beginner';
    return platforms[experience] || platforms.beginner;
  };

  if (showRiskAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Investment Risk Assessment
            </h1>
            <p className="text-white/80 text-lg">
              Let's determine your ideal investment approach
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="space-y-8">
              {riskQuestions.map((question, index) => (
                <div key={question.id}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {index + 1}. {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <label key={option.value} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={riskAnswers[question.id]?.value === option.value}
                          onChange={(e) => handleRiskAnswer(question.id, e.target.value)}
                          className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="text-sm text-gray-600 mb-4">
                Progress: {Object.keys(riskAnswers).length} of {riskQuestions.length} questions completed
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(Object.keys(riskAnswers).length / riskQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
            <span className="text-2xl">📈</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Investment Recommendation Engine
          </h1>
          <p className="text-white/80 text-lg mb-4">
            Personalized portfolio recommendations for your financial goals
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
          {/* Left Column - Portfolio Details */}
          <div className="lg:col-span-2">
            {portfolioRecommendation && (
              <>
                {/* Portfolio Overview */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{portfolioRecommendation.name}</h3>
                      <p className="text-gray-600">{portfolioRecommendation.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Expected Return</div>
                      <div className="text-xl font-bold text-green-600">{portfolioRecommendation.expectedReturn}</div>
                      <div className="text-sm text-gray-500">Risk: {portfolioRecommendation.riskLevel}</div>
                    </div>
                  </div>

                  {/* Asset Allocation Chart */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Asset Allocation</h4>
                    <div className="space-y-3">
                      {Object.entries(portfolioRecommendation.allocation).map(([asset, percentage]) => (
                        <div key={asset} className="flex items-center gap-4">
                          <div className="w-24 text-sm text-gray-600">{asset}:</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="w-12 text-sm font-semibold text-gray-800">{percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Funds */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Recommended Funds</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2">Fund Name</th>
                            <th className="text-center py-2">Allocation</th>
                            <th className="text-center py-2">Expense Ratio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolioRecommendation.funds.map((fund, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-3 text-gray-800">{fund.name}</td>
                              <td className="py-3 text-center font-semibold">{fund.allocation}%</td>
                              <td className="py-3 text-center text-green-600">{fund.expense}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Investment Settings */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Investment Settings</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Investment Amount
                      </label>
                      <input
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Horizon
                      </label>
                      <select
                        value={timeHorizon}
                        onChange={(e) => setTimeHorizon(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="short">Short-term (1-5 years)</option>
                        <option value="medium">Medium-term (5-15 years)</option>
                        <option value="long">Long-term (15+ years)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-blue-50 rounded-lg p-4">
                    <div className="font-semibold text-blue-800">Recommended Monthly Investment:</div>
                    <div className="text-2xl font-bold text-blue-600">${portfolioRecommendation.monthlyAmount.toLocaleString()}</div>
                    <div className="text-sm text-blue-600 mt-1">
                      Based on your archetype and goals
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Platform Recommendations */}
          <div className="space-y-6">
            {/* Risk Profile */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Risk Profile</h3>
              <div className="text-center mb-4">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  riskTolerance === 'conservative' ? 'bg-green-100 text-green-800' :
                  riskTolerance === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1)} Investor
                </div>
              </div>
              <div className="text-sm text-gray-600 text-center">
                Based on your assessment responses
              </div>
              <button
                onClick={() => {
                  setRiskAnswers({});
                  setShowRiskAssessment(true);
                }}
                className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Retake Assessment
              </button>
            </div>

            {/* Platform Recommendations */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recommended Platforms</h3>
              <div className="space-y-4">
                {getPlatformRecommendations().map((platform, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{platform.name}</h4>
                        <div className="text-sm text-gray-600">{platform.type}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">Min: {platform.minInvestment}</div>
                        <div className="font-semibold text-green-600">Fees: {platform.fees}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Pros: {platform.pros.join(', ')}</div>
                      <div>Cons: {platform.cons.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onComplete && onComplete({
                portfolio: portfolioRecommendation,
                riskTolerance,
                timeHorizon,
                investmentAmount,
                platforms: getPlatformRecommendations()
              })}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-4 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
            >
              Save Investment Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentEnginePage;