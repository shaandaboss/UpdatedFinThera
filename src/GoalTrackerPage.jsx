import React, { useState, useEffect } from 'react';

const GoalTrackerPage = ({ currentInsights = {}, onComplete }) => {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    priority: 'medium',
    category: 'general'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize with archetype-specific goals
  useEffect(() => {
    const getArchetypeGoals = (archetype, insights) => {
      const baseGoals = [];
      
      // Common emergency fund goal
      baseGoals.push({
        id: 'emergency-fund',
        name: 'Emergency Fund',
        targetAmount: 15000,
        currentAmount: 0,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'high',
        category: 'security',
        description: '3-6 months of expenses for financial security',
        milestones: [
          { amount: 1000, label: 'Starter Emergency Fund' },
          { amount: 5000, label: 'First Major Milestone' },
          { amount: 10000, label: 'Solid Foundation' },
          { amount: 15000, label: 'Full Emergency Fund' }
        ]
      });

      // Archetype-specific goals
      switch (archetype) {
        case 'The Strategic Freedom Builder':
          baseGoals.push(
            {
              id: 'retirement-401k',
              name: 'Max 401(k) Contribution',
              targetAmount: 23000,
              currentAmount: 0,
              targetDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
              priority: 'high',
              category: 'retirement',
              description: 'Maximize tax-advantaged retirement savings',
              milestones: [
                { amount: 5750, label: '25% Complete' },
                { amount: 11500, label: '50% Complete' },
                { amount: 17250, label: '75% Complete' },
                { amount: 23000, label: 'Fully Maxed Out' }
              ]
            },
            {
              id: 'investment-account',
              name: 'Taxable Investment Account',
              targetAmount: 50000,
              currentAmount: 0,
              targetDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              priority: 'high',
              category: 'investment',
              description: 'Build wealth through index fund investing',
              milestones: [
                { amount: 10000, label: 'First $10k' },
                { amount: 25000, label: 'Quarter Way' },
                { amount: 40000, label: 'Almost There' },
                { amount: 50000, label: 'Major Milestone' }
              ]
            }
          );
          break;

        case 'The Experience Collector':
          baseGoals.push(
            {
              id: 'europe-trip',
              name: 'European Adventure',
              targetAmount: 8000,
              currentAmount: 0,
              targetDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              priority: 'high',
              category: 'experience',
              description: '3-week European trip with quality experiences',
              milestones: [
                { amount: 2000, label: 'Flight Booked' },
                { amount: 4000, label: 'Halfway There' },
                { amount: 6000, label: 'Accommodations Covered' },
                { amount: 8000, label: 'Full Experience Fund' }
              ]
            },
            {
              id: 'experience-fund',
              name: 'Annual Experience Fund',
              targetAmount: 12000,
              currentAmount: 0,
              targetDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
              priority: 'medium',
              category: 'experience',
              description: 'Fund for concerts, travel, and memorable experiences',
              milestones: [
                { amount: 3000, label: 'Quarter Funded' },
                { amount: 6000, label: 'Half Way' },
                { amount: 9000, label: 'Most Experiences Covered' },
                { amount: 12000, label: 'Full Year Funded' }
              ]
            }
          );
          break;

        case 'The Mindful Worrier':
          baseGoals.push(
            {
              id: 'debt-payoff',
              name: 'Credit Card Debt Payoff',
              targetAmount: 5000,
              currentAmount: 0,
              targetDate: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              priority: 'high',
              category: 'debt',
              description: 'Pay off high-interest credit card debt for peace of mind',
              milestones: [
                { amount: 1250, label: '25% Paid Off' },
                { amount: 2500, label: 'Halfway There' },
                { amount: 3750, label: 'Almost Debt Free' },
                { amount: 5000, label: 'Debt Free!' }
              ]
            },
            {
              id: 'simple-retirement',
              name: 'Simple Retirement Start',
              targetAmount: 10000,
              currentAmount: 0,
              targetDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              priority: 'medium',
              category: 'retirement',
              description: 'Get started with automated retirement investing',
              milestones: [
                { amount: 1000, label: 'First $1k Invested' },
                { amount: 3000, label: 'Building Momentum' },
                { amount: 6000, label: 'Great Progress' },
                { amount: 10000, label: 'Strong Foundation' }
              ]
            }
          );
          break;

        default:
          baseGoals.push({
            id: 'general-savings',
            name: 'General Savings Goal',
            targetAmount: 10000,
            currentAmount: 0,
            targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'medium',
            category: 'savings',
            description: 'Build a solid financial foundation',
            milestones: [
              { amount: 2500, label: 'First Milestone' },
              { amount: 5000, label: 'Halfway Point' },
              { amount: 7500, label: 'Strong Progress' },
              { amount: 10000, label: 'Goal Achieved!' }
            ]
          });
      }

      return baseGoals;
    };

    const initialGoals = getArchetypeGoals(currentInsights?.archetype, currentInsights);
    setGoals(initialGoals);
  }, [currentInsights]);

  const addGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) return;

    const goalToAdd = {
      ...newGoal,
      id: Date.now().toString(),
      milestones: [
        { amount: newGoal.targetAmount * 0.25, label: '25% Complete' },
        { amount: newGoal.targetAmount * 0.5, label: '50% Complete' },
        { amount: newGoal.targetAmount * 0.75, label: '75% Complete' },
        { amount: newGoal.targetAmount, label: 'Goal Achieved!' }
      ]
    };

    setGoals([...goals, goalToAdd]);
    setNewGoal({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: '',
      priority: 'medium',
      category: 'general'
    });
    setShowAddForm(false);
  };

  const updateGoalProgress = (goalId, newCurrentAmount) => {
    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, currentAmount: Math.min(newCurrentAmount, goal.targetAmount) }
        : goal
    ));
  };

  const deleteGoal = (goalId) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getNextMilestone = (goal) => {
    return goal.milestones.find(milestone => goal.currentAmount < milestone.amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      security: 'from-green-500 to-green-700',
      retirement: 'from-blue-500 to-blue-700',
      investment: 'from-purple-500 to-purple-700',
      experience: 'from-pink-500 to-pink-700',
      debt: 'from-red-500 to-red-700',
      savings: 'from-teal-500 to-teal-700',
      general: 'from-gray-500 to-gray-700'
    };
    return colors[category] || colors.general;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors.medium;
  };

  const calculateTotalProgress = () => {
    if (goals.length === 0) return 0;
    
    const totalProgress = goals.reduce((sum, goal) => {
      return sum + getProgressPercentage(goal.currentAmount, goal.targetAmount);
    }, 0);
    
    return Math.round(totalProgress / goals.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Goal Tracker
          </h1>
          <p className="text-white/80 text-lg mb-4">
            Turn your dreams into specific, trackable financial goals
          </p>
          {currentInsights?.archetype && (
            <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2">
              <span className="text-white/60 text-sm">
                Goals for: <span className="text-white font-medium">{currentInsights.archetype}</span>
              </span>
            </div>
          )}
        </div>

        {/* Overall Progress */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Overall Progress</h3>
            <span className="text-2xl font-bold text-blue-600">{calculateTotalProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${calculateTotalProgress()}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{goals.length} Active Goals</span>
            <span>{goals.filter(g => getProgressPercentage(g.currentAmount, g.targetAmount) === 100).length} Completed</span>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {goals.map((goal) => {
            const progressPercent = getProgressPercentage(goal.currentAmount, goal.targetAmount);
            const nextMilestone = getNextMilestone(goal);
            const isCompleted = progressPercent === 100;

            return (
              <div key={goal.id} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{goal.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority} priority
                      </span>
                      <span className="text-xs text-gray-500">Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-bold text-gray-800">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`bg-gradient-to-r ${getCategoryColor(goal.category)} h-3 rounded-full transition-all duration-300`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Amount Tracker */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Current Amount</span>
                    <span className="text-lg font-bold text-gray-800">${goal.currentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={goal.currentAmount}
                      onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Update amount"
                    />
                    <span className="text-sm text-gray-500">of ${goal.targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Next Milestone */}
                {nextMilestone && !isCompleted && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800">Next Milestone</div>
                    <div className="text-blue-600">
                      ${nextMilestone.amount.toLocaleString()} - {nextMilestone.label}
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      ${(nextMilestone.amount - goal.currentAmount).toLocaleString()} to go
                    </div>
                  </div>
                )}

                {/* Completed Badge */}
                {isCompleted && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🎉</div>
                    <div className="text-sm font-medium text-green-800">Goal Achieved!</div>
                    <div className="text-xs text-green-600">Congratulations on reaching your target</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add New Goal Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 border-dashed">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full h-full min-h-[200px] flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">+</div>
                <div className="text-lg font-medium">Add New Goal</div>
                <div className="text-sm">Create a custom financial target</div>
              </button>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Add New Goal</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name</label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., New Car, Home Down Payment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
                  <input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({...newGoal, targetAmount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addGoal}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Add Goal
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => onComplete && onComplete({ goals, totalProgress: calculateTotalProgress() })}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
          >
            Save Goals & Continue
          </button>
          <p className="text-white/60 text-sm mt-3">
            Your goals are saved and will be tracked in your dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoalTrackerPage;