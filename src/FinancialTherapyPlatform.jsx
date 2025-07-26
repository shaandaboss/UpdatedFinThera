import React, { useState, useRef, useEffect } from 'react';
import voiceService from './services/voiceService.js';

const FinancialTherapyPlatform = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [userJourney, setUserJourney] = useState({
    hasCompletedConversation: false,
    hasSetupProfile: false,
    hasCompletedPlanning: false,
    currentStep: 'landing'
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [currentConversationStep, setCurrentConversationStep] = useState('intro');
  const [conversationResponses, setConversationResponses] = useState({});
  const [showConversationResults, setShowConversationResults] = useState(false);
  const [personalizedInsights, setPersonalizedInsights] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [voiceProvider, setVoiceProvider] = useState('openai');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Initialize voice service with API key on mount
  useEffect(() => {
    if (apiKey) {
      voiceService.initialize({ openaiApiKey: apiKey });
    }
  }, [apiKey]);

  const [wellnessRings, setWellnessRings] = useState({
    safety: { progress: 45, goal: 100, color: 'from-orange-400 to-orange-600' },
    freedom: { progress: 25, goal: 100, color: 'from-white to-gray-300' },
    fulfillment: { progress: 70, goal: 100, color: 'from-yellow-400 to-yellow-600' }
  });

  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false);
  const [dailyReflection, setDailyReflection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lifestyleData, setLifestyleData] = useState({
    livingArrangement: '',
    transportation: '',
    diningHabits: '',
    hobbies: [],
    travelFrequency: '',
    socialSpending: '',
    fitnessRoutine: '',
    entertainmentPrefs: []
  });

  const [financialProfile, setFinancialProfile] = useState({
    age: 25,
    currentIncome: 60000,
    partnerIncome: 0,
    monthlyExpenses: 4500,
    emergencyFund: 5000,
    currentSavings: 10000,
    investments: 15000,
    retirement401k: 8000,
    monthlyDebtPayment: 800,
    familyStatus: 'single',
    dependents: 0,
    costOfLivingArea: 'average',
    riskTolerance: 'moderate',
    timeCommitment: 'moderate',
    careerStage: 'early',
    willignessToRelocate: 'open',
    investmentExperience: 'beginner',
    retirementGoalAge: 65,
    debt: {
      student: 25000,
      credit: 3000,
      car: 12000,
      mortgage: 0,
      other: 0
    },
    financialGoals: {
      buyHome: true,
      travel: true,
      earlyRetirement: false,
      startBusiness: false,
      payOffDebt: true
    },
    lifeValues: {
      coreMotivations: [],
      personalityType: '',
      financialArchetype: '',
      hiddenFears: [],
      behavioralPatterns: []
    }
  });



  // Initialize voice conversation
  useEffect(() => {
    if (currentPage === 'conversation' && chatMessages.length === 0) {
      setChatMessages([
        {
          type: 'therapist',
          message: "Hey there! So nice to meet you. I'm here because, honestly, talking about money can be weird and uncomfortable, but it doesn't have to be. I'm just genuinely curious about your relationship with money - no judgment, no lectures, just real conversation.",
          timestamp: new Date()
        },
        {
          type: 'therapist',
          message: "Hey! So I'm curious... what's been the best thing you've spent money on lately? Like, something that just made you feel good about the purchase?",
          timestamp: new Date()
        }
      ]);
    }
  }, [currentPage]);

  // Initialize voice functionality
  useEffect(() => {
    const initializeVoice = async () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          
          recognition.onstart = () => setIsRecording(true);
          
          recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              }
            }
            if (finalTranscript) {
              const trimmedTranscript = finalTranscript.trim();
              setChatInput(trimmedTranscript);
              setIsRecording(false);
              
              // Auto-send the voice message
              setTimeout(() => {
                if (trimmedTranscript) {
                  // Create message object
                  const newMessage = {
                    type: 'user',
                    message: trimmedTranscript,
                    timestamp: new Date()
                  };
                  
                  setChatMessages(prev => [...prev, newMessage]);
                  
                  // Store conversation response
                  setConversationResponses(prev => ({
                    ...prev,
                    [currentConversationStep]: trimmedTranscript
                  }));
                  
                  // Clear input and process next step
                  setChatInput('');
                  setTimeout(() => processConversationStep(), 1000);
                }
              }, 100);
            }
          };
          
          recognition.onerror = () => setIsRecording(false);
          recognition.onend = () => setIsRecording(false);
          
          recognitionRef.current = recognition;
          setSpeechRecognition(recognition);
        } catch (error) {
          setSpeechRecognition(null);
        }
      }
    };
    
    initializeVoice();
  }, [apiKey]);

  // Auto-speak new therapist messages
  useEffect(() => {
    if (voiceEnabled && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.type === 'therapist') {
        speakMessage(lastMessage.message);
      }
    }
  }, [chatMessages, voiceEnabled]);

  const startRecording = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not available. Please try typing your response.');
      return;
    }
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isRecording) {
        setChatInput('');
        recognitionRef.current.start();
      }
    } catch (error) {
      alert('Unable to access microphone. Please check your browser settings.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const speakMessage = async (text) => {
    if (!voiceEnabled) return;
    
    // Stop any current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    voiceService.stop();
    
    try {
      // Initialize voice service with API key if available
      if (apiKey) {
        voiceService.initialize({ openaiApiKey: apiKey });
      }
      
      const audio = await voiceService.speak(
        text,
        () => setIsAISpeaking(true),  // onStart
        () => setIsAISpeaking(false), // onEnd
        (error) => {                  // onError
          console.error('Voice synthesis error:', error);
          setIsAISpeaking(false);
        },
        selectedVoice // Pass the selected voice
      );
      
      currentAudioRef.current = audio;
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setIsAISpeaking(false);
    }
  };

  const toggleVoice = () => {
    setIsRecording(false);
    setVoiceEnabled(!voiceEnabled);
    if (isAISpeaking) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsAISpeaking(false);
    }
  };

  // Therapy conversation flow
  const therapyFlow = [
    {
      id: 'intro',
      question: "Hey! So I'm curious... what's been the best thing you've spent money on lately? Like, something that just made you feel good about the purchase?",
      followUp: "That sounds really nice! I love hearing about purchases that actually bring joy. Now, can I ask you about the flip side? We've all been there - what's something you bought and then immediately thought 'why did I do that?' Don't worry, no judgment here!"
    },
    {
      id: 'guilt_spending',
      question: "What's something you bought and then immediately thought 'why did I do that?' Don't worry, no judgment here!",
      followUp: "Oh trust me, we've ALL been there! That's so human. Let me ask you something more fun - imagine you woke up this Saturday and found $200 in your pocket that you forgot about. What would you actually do with it? And I mean realistically, not what you think you 'should' do."
    },
    {
      id: 'ideal_weekend',
      question: "Imagine you woke up this Saturday and found $200 in your pocket that you forgot about. What would you actually do with it? Realistically, not what you think you 'should' do.",
      followUp: "I love that! It's so interesting how we think about 'found money' differently. Here's something I'm genuinely curious about - most people have no idea how much they actually spend in a typical week. Do you have any sense of yours? Even a wild guess is totally fine."
    },
    {
      id: 'weekly_spending',
      question: "Most people have no idea how much they actually spend in a typical week. Do you have any sense of yours? Even a wild guess is totally fine.",
      followUp: "You know what's fascinating? Everyone has such a different relationship with money. Some people get excited, some get anxious, some just feel... blah. When I say the word 'money' to you right now, what's the first thing that comes up? Not what you think it should be - just whatever pops into your head."
    },
    {
      id: 'money_feelings',
      question: "When I say the word 'money' to you right now, what's the first thing that comes up? Not what you think it should be - just whatever pops into your head.",
      followUp: "That's really insightful, thank you for sharing that. Here's my last question, and it's kind of fun - is there something you've been wanting to buy or do, but every time you think about it, you're like 'ugh, that's too expensive'? What is it?"
    },
    {
      id: 'big_want',
      question: "Is there something you've been wanting to buy or do, but every time you think about it, you're like 'ugh, that's too expensive'? What is it?",
      followUp: "Wow, thank you for being so open with me! This has been such a genuine conversation. I feel like I really understand your relationship with money now. Give me just a moment to put together some insights based on everything you've shared - I think you might be surprised by what I found..."
    }
  ];

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const newUserMessage = {
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);

    const currentStepData = therapyFlow.find(step => step.id === currentConversationStep);
    if (currentStepData) {
      setConversationResponses(prev => ({
        ...prev,
        [currentConversationStep]: chatInput
      }));
    }

    setTimeout(() => {
      const stepIndex = therapyFlow.findIndex(step => step.id === currentConversationStep);
      if (stepIndex !== -1 && stepIndex < therapyFlow.length - 1) {
        const currentStepData = therapyFlow[stepIndex];
        const therapistResponse = {
          type: 'therapist',
          message: currentStepData.followUp,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, therapistResponse]);
        setCurrentConversationStep(therapyFlow[stepIndex + 1].id);
      } else {
        const finalResponse = {
          type: 'therapist',
          message: "Alright, this is getting interesting! Let me crunch these numbers and show you what I found...",
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, finalResponse]);
        
        setTimeout(() => {
          generateLifestyleAnalysis();
          setShowConversationResults(true);
          setUserJourney(prev => ({
            ...prev,
            hasCompletedConversation: true,
            currentStep: 'profile'
          }));
        }, 2000);
      }
    }, 1500);

    setChatInput('');
  };

  // Analysis functions
  const getFinancialArchetype = (conversationText) => {
    const text = conversationText.toLowerCase();
    
    if ((text.includes('save') || text.includes('independence')) && (text.includes('freedom') || text.includes('security'))) {
      return {
        category: "🎯 Your Financial Archetype",
        title: "💪 The Wealth Builder",
        description: "You're not just saving money—you're architecting financial freedom. You see money as a tool for ultimate independence.",
        deepInsight: "Your drive for financial control could be masking a fear of being dependent on others.",
        actionItems: [
          "Set up automatic investing so wealth building happens without constant decisions",
          "Create a 'joy budget' - allocate money for present happiness without guilt",
          "Track your 'enough number' - what amount would make you feel truly secure?"
        ]
      };
    }
    
    if (text.includes('experience') || text.includes('travel') || text.includes('adventure') || text.includes('memories')) {
      return {
        category: "🎯 Your Financial Archetype",
        title: "✈️ The Experience Collector",
        description: "Money, to you, is energy that creates memories and connections. You understand that life is happening now, not someday.",
        deepInsight: "Your 'spending' on experiences is actually sophisticated emotional investing.",
        actionItems: [
          "Create an 'Adventure Fund' that makes saving feel exciting",
          "Use travel rewards credit cards to turn spending into future experiences",
          "Set up automatic investing in index funds - 'set it and forget it' while you live"
        ]
      };
    }
    
    return {
      category: "🎯 Your Financial Archetype",
      title: "⚖️ The Balanced Seeker",
      description: "You're still discovering your relationship with money, and that's actually a strength. You have the flexibility to create a financial life that truly fits you.",
      deepInsight: "Your uncertainty about money might actually be wisdom—you're sensing that generic advice doesn't fit everyone.",
      actionItems: [
        "Start with basic automation - emergency fund and retirement savings",
        "Experiment with small financial decisions to learn your preferences",
        "Set one specific financial goal to build confidence"
      ]
    };
  };

  const generateLifestyleAnalysis = () => {
    const conversationValues = Object.values(conversationResponses).filter(Boolean).join(' ').toLowerCase();
    const lifeValuesInsights = [getFinancialArchetype(conversationValues)];
    setPersonalizedInsights(lifeValuesInsights);
    
    setFinancialProfile(prev => ({
      ...prev,
      lifeValues: {
        coreMotivations: ['Personal Growth'],
        personalityType: 'Balanced Explorer',
        financialArchetype: lifeValuesInsights.find(i => i.category.includes('Archetype'))?.title || 'The Balanced Seeker',
        hiddenFears: ['Uncertainty about the future'],
        behavioralPatterns: ['Thoughtful decision-making']
      }
    }));
    
    setWellnessRings(prev => ({
      safety: { ...prev.safety, progress: 60 },
      freedom: { ...prev.freedom, progress: 40 },
      fulfillment: { ...prev.fulfillment, progress: 75 }
    }));
  };

  const calculateFinancialImpact = () => {
    const responses = conversationResponses;
    const monthlyWaste = parseInt(responses.waste_spending) || 100;
    const yearlyWaste = monthlyWaste * 12;
    const tenYearInvested = yearlyWaste * 10 * 1.07;
    
    return {
      monthlyWaste,
      yearlyWaste,
      tenYearInvested: Math.round(tenYearInvested)
    };
  };

  // Wellness Rings component
  const renderWellnessRings = () => {
    const rings = [
      {
        id: 'safety',
        title: 'Safety',
        subtitle: 'Can I survive if things go wrong?',
        icon: '🛟',
        progress: wellnessRings.safety.progress
      },
      {
        id: 'freedom',
        title: 'Freedom',
        subtitle: 'Am I building the life I want?',
        icon: '🚀',
        progress: wellnessRings.freedom.progress
      },
      {
        id: 'fulfillment',
        title: 'Fulfillment',
        subtitle: 'Does my money align with my values?',
        icon: '💖',
        progress: wellnessRings.fulfillment.progress
      }
    ];

    return (
      <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-6 border border-white/20 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Financial Wellness</h2>
            <p className="text-white/70">Daily rings to track your financial health</p>
          </div>
          <button
            onClick={() => setShowReflectionPrompt(true)}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Daily Check-in 💭
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {rings.map((ring) => (
            <div key={ring.id} className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-8 border-white/20"></div>
                <svg className="absolute inset-0 w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={ring.id === 'safety' ? '#06b6d4' : ring.id === 'freedom' ? '#10b981' : '#a855f7'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(ring.progress / 100) * 351.86} 351.86`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl mb-1">{ring.icon}</span>
                  <span className="text-2xl font-bold text-white">{ring.progress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{ring.title}</h3>
              <p className="text-sm text-white/70">{ring.subtitle}</p>
            </div>
          ))}
        </div>

        {showReflectionPrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 rounded-3xl p-8 max-w-md w-full border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">Daily Financial Reflection 💭</h3>
              <p className="text-white/80 mb-6">How did you feel about your money choices today?</p>
              
              <textarea
                value={dailyReflection}
                onChange={(e) => setDailyReflection(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-4 bg-black/80 rounded-xl text-white placeholder-gray-400 resize-none h-24 mb-4"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReflectionPrompt(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-500 transition-all"
                >
                  Skip Today
                </button>
                <button
                  onClick={() => {
                    setWellnessRings(prev => ({
                      ...prev,
                      fulfillment: { ...prev.fulfillment, progress: Math.min(100, prev.fulfillment.progress + 5) }
                    }));
                    setShowReflectionPrompt(false);
                    setDailyReflection('');
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Complete Check-in ✨
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Navigation component
  const renderNavigation = () => (
    <nav className="bg-black/90 backdrop-blur-md border-b border-orange-900/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-3"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              FinThera
            </div>
            <div className="hidden sm:block text-white/70 text-sm">
              Feel Better About Your Financial Lifestyle
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {[
              { id: 'landing', label: 'Home', icon: '🏠', available: true },
              { id: 'conversation', label: 'Voice Chat', icon: '🎙️', available: true },
              { id: 'health', label: 'Health Score', icon: '💚', available: userJourney.hasCompletedConversation },
              { id: 'tools', label: 'Tools', icon: '🛠️', available: userJourney.hasCompletedConversation },
              { id: 'optimization', label: 'Optimization', icon: '⚡', available: userJourney.hasCompletedConversation },
              { id: 'scenarios', label: 'What If', icon: '🤔', available: userJourney.hasCompletedConversation },
              { id: 'learn', label: 'Learn', icon: '📚', available: true },
              { id: 'profile', label: 'Profile', icon: '👤', available: userJourney.hasCompletedConversation },
              { id: 'planning', label: 'Life Plan', icon: '🎯', available: userJourney.hasSetupProfile },
              { id: 'about', label: 'About', icon: 'ℹ️', available: true }
            ].map(({ id, label, icon, available }) => (
              <button
                key={id}
                onClick={() => available && setCurrentPage(id)}
                disabled={!available}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === id
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                    : available
                      ? 'text-white/80 hover:text-white hover:bg-black/90'
                      : 'text-white/50 cursor-not-allowed'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white/80 hover:text-white"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 border-t border-white/20 py-4">
            <div className="flex flex-col space-y-2">
              {[
                { id: 'landing', label: 'Home', icon: '🏠', available: true },
                { id: 'conversation', label: 'Voice Chat', icon: '🎙️', available: true },
                { id: 'health', label: 'Health Score', icon: '💚', available: userJourney.hasCompletedConversation },
                { id: 'tools', label: 'Tools', icon: '🛠️', available: userJourney.hasCompletedConversation },
                { id: 'optimization', label: 'Optimization', icon: '⚡', available: userJourney.hasCompletedConversation },
                { id: 'scenarios', label: 'What If', icon: '🤔', available: userJourney.hasCompletedConversation },
                { id: 'learn', label: 'Learn', icon: '📚', available: true },
                { id: 'profile', label: 'Profile', icon: '👤', available: userJourney.hasCompletedConversation },
                { id: 'planning', label: 'Life Plan', icon: '🎯', available: userJourney.hasSetupProfile },
                { id: 'about', label: 'About', icon: 'ℹ️', available: true }
              ].map(({ id, label, icon, available }) => (
                <button
                  key={id}
                  onClick={() => {
                    if (available) {
                      setCurrentPage(id);
                      setMobileMenuOpen(false);
                    }
                  }}
                  disabled={!available}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    currentPage === id
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                      : available
                        ? 'text-white/80 hover:text-white hover:bg-black/80'
                        : 'text-white/50 cursor-not-allowed'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );

  // Landing Page
  const renderLandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="mb-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
            <span className="text-2xl mr-3">🤖</span>
            <span className="text-lg font-medium">Your Personal Financial Therapist</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8">
            <span className="block bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Feel better about
            </span>
            <span className="block text-white">
              your money
            </span>
          </h1>

          <p className="text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
            I'm your AI financial therapist. In a <span className="text-yellow-400 font-semibold">5-minute voice conversation</span>,
            I'll help you understand how your lifestyle choices impact your financial future.
          </p>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto mb-12 border border-white/10">
            <p className="text-lg text-white/80">
              <span className="text-orange-400 font-semibold">Talk naturally.</span><br/>
              <span className="text-yellow-400 font-semibold">I'll talk back.</span><br/>
              Understanding your relationship with money through conversation.
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('conversation')}
            className="group relative px-12 py-6 bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-500 rounded-2xl font-bold text-2xl hover:shadow-2xl hover:shadow-orange-500/40 transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center gap-3">
              <span>Start Voice Conversation</span>
              <span>🎙️</span>
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "🎙️",
              title: "Voice Conversation", 
              desc: "Talk naturally - I'll listen and respond with my voice too"
            },
            {
              icon: "💡",
              title: "Eye-Opening Insights",
              desc: "See the real financial impact of your daily choices"
            },
            {
              icon: "❤️",
              title: "Your Money Story",
              desc: "Understand your relationship with money - no judgment"
            }
          ].map((item, i) => (
            <div key={i} className="group bg-gradient-to-br from-gray-800/50 to-orange-900/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-white/80">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Voice Conversation Page
  const renderConversationPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
      {showConversationResults ? renderConversationResults() : (
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              💬 Financial Therapy Session
            </h1>
            <p className="text-white/80 mb-4">
              A safe space to explore your relationship with money
            </p>

            <div className="flex justify-center gap-4 flex-wrap">
              {speechRecognition && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm">
                  🎙️ Voice conversation ready
                </div>
              )}
              
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm border bg-orange-500/20 border-orange-500/30 text-orange-300">
                🎤 AI Voice: {selectedVoice}
              </div>

              {/* Compact Voice Switcher */}
              <div className="inline-flex items-center bg-black/80 rounded-full border border-white/20">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="bg-transparent text-white text-xs px-3 py-1 rounded-full focus:outline-none focus:border-orange-400 appearance-none cursor-pointer"
                  style={{minWidth: '120px'}}
                >
                  <option value="alloy" className="bg-black text-white">Alloy</option>
                  <option value="echo" className="bg-black text-white">Echo</option>
                  <option value="fable" className="bg-black text-white">Fable</option>
                  <option value="onyx" className="bg-black text-white">Onyx</option>
                  <option value="nova" className="bg-black text-white">Nova</option>
                  <option value="shimmer" className="bg-black text-white">Shimmer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-3xl border border-white/20 h-[700px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                      : 'bg-black/80/70 text-gray-100'
                  }`}>
                    {msg.type === 'therapist' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🤖</span>
                        <span className="text-xs text-white/80 font-medium">Your Financial Therapist</span>
                        {isAISpeaking && index === chatMessages.length - 1 && (
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-3 bg-yellow-400 rounded animate-pulse"></div>
                            <div className="w-1 h-4 bg-yellow-400 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-1 h-3 bg-yellow-400 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/30">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleVoice}
                    className={`p-2 rounded-lg transition-all ${
                      voiceEnabled 
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                        : 'bg-gray-600/50 text-white/70 hover:bg-gray-600/70'
                    }`}
                    title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
                  >
                    {voiceEnabled ? '🔊' : '🔇'}
                  </button>
                  
                  {voiceEnabled && (
                    <span className="text-xs text-white/70">
                      {isAISpeaking ? '🎙️ AI speaking...' : 'Voice enabled'}
                    </span>
                  )}
                </div>
                
              </div>



              {/* Big Record Button Interface */}
              <div className="flex flex-col items-center gap-4">
                {speechRecognition ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-32 h-32 rounded-full transition-all duration-300 flex flex-col items-center justify-center text-white font-bold text-lg shadow-2xl transform hover:scale-105 ${
                      isRecording 
                        ? 'bg-gradient-to-br from-orange-600 to-yellow-600 animate-pulse shadow-orange-500/50 border-4 border-orange-300' 
                        : 'bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 shadow-orange-500/30'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <div className="text-4xl mb-2">⏹️</div>
                        <div className="text-sm">Stop Recording</div>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">🎤</div>
                        <div className="text-sm">Start Recording</div>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-black/80 border-2 border-white/30 flex flex-col items-center justify-center text-white/70">
                    <div className="text-4xl mb-2">🚫</div>
                    <div className="text-xs text-center">Voice Not Supported</div>
                  </div>
                )}
                
                <div className="text-center">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <div className="text-orange-400 font-medium">🎤 Listening... speak now</div>
                      <div className="text-white/70 text-sm">Click the button again to stop</div>
                    </div>
                  ) : speechRecognition ? (
                    <div className="text-white/80">
                      <div className="font-medium">Ready to record your response</div>
                      <div className="text-sm text-white/70">Click the microphone to start</div>
                    </div>
                  ) : !speechRecognition ? (
                    <div className="text-white/70">
                      <div className="font-medium">Voice recording not supported in this browser</div>
                      <div className="text-sm">Try Chrome, Edge, or Safari</div>
                    </div>
                  ) : (
                    <div className="text-white/80">
                      <div className="font-medium">Voice ready - click microphone to start</div>
                      <div className="text-sm text-white/70">Your therapist will speak with {selectedVoice} voice</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Conversation Results Page
  const renderConversationResults = () => {
    const impact = calculateFinancialImpact();
    
    return (
      <div className="max-w-4xl mx-auto p-6 text-white">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            🎯 Your Financial Therapy Results
          </h1>
          <p className="text-xl text-white/80">
            Here's what your lifestyle choices reveal about your financial future
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/40 backdrop-blur-sm rounded-3xl p-8 border border-yellow-700/30">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">😊</span>
              <h3 className="text-2xl font-bold text-white">Your Joy Analysis</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-800/30 rounded-xl p-4">
                <div className="text-yellow-300 font-medium mb-2">💖 What Makes You Happy:</div>
                <div className="text-white italic">"{conversationResponses.intro || 'Your meaningful purchases'}"</div>
              </div>
              
              <div className="bg-orange-800/30 rounded-xl p-4">
                <div className="text-orange-300 font-medium mb-2">😰 What You Regret:</div>
                <div className="text-white italic">"{conversationResponses.guilt_spending || 'Impulse purchases'}"</div>
              </div>
              
              <div className="bg-orange-800/30 rounded-xl p-4">
                <div className="text-orange-300 font-medium mb-2">🌟 Your Ideal Weekend:</div>
                <div className="text-white italic text-sm">"{conversationResponses.ideal_weekend || 'Quality time and experiences'}"</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-orange-900/40 backdrop-blur-sm rounded-3xl p-8 border border-orange-700/30">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">💰</span>
              <h3 className="text-2xl font-bold text-white">The Money Story</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">${impact.monthlyWaste}</div>
                <div className="text-white/80 text-sm">Monthly redirectable spending</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">${impact.yearlyWaste.toLocaleString()}</div>
                <div className="text-white/80 text-sm">Yearly opportunity</div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">${impact.tenYearInvested.toLocaleString()}</div>
                <div className="text-white text-sm">If invested for 10 years at 7% return</div>
              </div>
            </div>
          </div>
        </div>

        {personalizedInsights.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                🧠 Your Life Values Report
              </h2>
              <p className="text-white/80">Deep insights into your financial personality and patterns</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {personalizedInsights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl p-8 border border-white/30/30"
                >
                  <div className="mb-6">
                    <div className="text-sm text-yellow-400 font-medium mb-2">{insight.category}</div>
                    <h3 className="text-2xl font-bold text-white mb-4">{insight.title}</h3>
                    <p className="text-white/80 leading-relaxed mb-4">{insight.description}</p>
                    
                    {insight.deepInsight && (
                      <div className="bg-orange-900/30 rounded-xl p-4 mb-4 border border-orange-700/30">
                        <div className="text-orange-300 font-medium mb-2 text-sm">🔮 Deep Insight:</div>
                        <p className="text-gray-200 text-sm">{insight.deepInsight}</p>
                      </div>
                    )}
                  </div>

                  {insight.actionItems && insight.actionItems.length > 0 && (
                    <div>
                      <div className="text-white font-medium mb-3 flex items-center gap-2">🎯 Action Steps:</div>
                      <div className="space-y-2">
                        {insight.actionItems.map((action, actionIndex) => (
                          <div
                            key={actionIndex}
                            className="flex items-start gap-3 text-sm text-white/80 bg-black/80/30 rounded-lg p-3"
                          >
                            <div className="text-yellow-400 mt-0.5">•</div>
                            <div>{action}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/40 backdrop-blur-sm rounded-3xl p-8 border border-yellow-700/30 mb-12 text-center">
          <div className="text-4xl mb-4">💡</div>
          <h3 className="text-2xl font-bold text-white mb-4">Your Key Realization</h3>
          <p className="text-lg text-white/80 leading-relaxed">
            You're not broke. You're not behind. You just need to <span className="text-yellow-400 font-semibold">redirect money you're already spending</span> from things that don't bring joy to things that build your future. The money is there - it's just going to the wrong places.
          </p>
        </div>

        <div className="bg-black/90/50 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center">
          <h3 className="text-2xl font-bold text-white mb-6">🎯 Your Next Steps</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="font-bold text-yellow-400 mb-2">Track for 1 Week</h4>
              <p className="text-sm text-white/80">Notice what brings joy vs what you regret</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl p-6 border border-orange-500/30">
              <div className="text-3xl mb-3">✂️</div>
              <h4 className="font-bold text-orange-400 mb-2">Cut One Thing</h4>
              <p className="text-sm text-white/80">Cancel one subscription or habit that doesn't spark joy</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl p-6 border border-orange-500/30">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-bold text-orange-400 mb-2">Redirect</h4>
              <p className="text-sm text-white/80">Put that money toward your goal automatically</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setCurrentPage('profile')}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Set Up Your Profile 👤
            </button>
            
            <button
              onClick={() => {
                setCurrentPage('landing');
                setChatMessages([]);
                setConversationResponses({});
                setCurrentConversationStep('intro');
                setShowConversationResults(false);
              }}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Start Fresh Session 🔄
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Profile Page  
  const renderProfilePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            👤 Your Financial Profile
          </h1>
          <p className="text-xl text-white/80">
            Now let's understand your current financial situation
          </p>
        </div>
        
        {renderWellnessRings()}
        
        {/* Lifestyle Profile Section */}
        <div className="bg-gradient-to-r from-orange-900/50 to-yellow-900/50 rounded-2xl p-8 border border-orange-700/30 mb-8">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            🎨 Your Lifestyle Profile
          </h3>
          <p className="text-white/80 mb-6">Tell us about your lifestyle so we can create a truly personalized financial plan that fits YOU.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Living Situation</label>
                <select 
                  value={lifestyleData.livingArrangement} 
                  onChange={(e) => setLifestyleData({...lifestyleData, livingArrangement: e.target.value})}
                  className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select...</option>
                  <option value="parents">Living with parents</option>
                  <option value="roommates">Apartment with roommates</option>
                  <option value="alone">Living alone</option>
                  <option value="partner">Living with partner</option>
                  <option value="own">Own my place</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Transportation</label>
                <select 
                  value={lifestyleData.transportation} 
                  onChange={(e) => setLifestyleData({...lifestyleData, transportation: e.target.value})}
                  className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select...</option>
                  <option value="public">Public transportation</option>
                  <option value="own_car">Own a car</option>
                  <option value="uber">Uber/Rideshare</option>
                  <option value="bike">Bike/Walk</option>
                  <option value="lease">Lease a car</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Dining Habits</label>
                <select 
                  value={lifestyleData.diningHabits} 
                  onChange={(e) => setLifestyleData({...lifestyleData, diningHabits: e.target.value})}
                  className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select...</option>
                  <option value="cook_home">Cook at home mostly</option>
                  <option value="mix">Mix of cooking and eating out</option>
                  <option value="eat_out">Eat out frequently</option>
                  <option value="delivery">Delivery/takeout often</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Travel Frequency</label>
                <select 
                  value={lifestyleData.travelFrequency} 
                  onChange={(e) => setLifestyleData({...lifestyleData, travelFrequency: e.target.value})}
                  className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select...</option>
                  <option value="rarely">Rarely travel</option>
                  <option value="few_times">Few times a year</option>
                  <option value="monthly">Monthly trips</option>
                  <option value="frequent">Frequent traveler</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Social Spending</label>
                <select 
                  value={lifestyleData.socialSpending} 
                  onChange={(e) => setLifestyleData({...lifestyleData, socialSpending: e.target.value})}
                  className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select...</option>
                  <option value="low">Low - prefer free activities</option>
                  <option value="moderate">Moderate - occasional outings</option>
                  <option value="high">High - love going out</option>
                  <option value="very_high">Very high - social butterfly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Fitness & Wellness</label>
                <select 
                  value={lifestyleData.fitnessRoutine} 
                  onChange={(e) => setLifestyleData({...lifestyleData, fitnessRoutine: e.target.value})}
                  className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select...</option>
                  <option value="home">Home workouts</option>
                  <option value="gym">Gym membership</option>
                  <option value="outdoor">Outdoor activities</option>
                  <option value="classes">Fitness classes/studios</option>
                  <option value="minimal">Minimal exercise</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Personal & Demographics Section */}
        <div className="bg-orange-900/50 rounded-2xl p-8 border border-orange-700/30 mb-8">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            👤 Personal & Demographics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Age</label>
              <input 
                type="range" 
                min="18" 
                max="70" 
                value={financialProfile.age}
                onChange={(e) => setFinancialProfile({...financialProfile, age: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-orange-400 font-semibold mt-2">{financialProfile.age} years old</div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Family Status</label>
              <div className="grid grid-cols-3 gap-2">
                {['single', 'couple', 'family'].map(status => (
                  <button 
                    key={status}
                    onClick={() => setFinancialProfile({...financialProfile, familyStatus: status})}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      financialProfile.familyStatus === status 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-black/80 text-white/80 hover:bg-gray-600'
                    }`}
                  >
                    {status === 'single' ? '👤 Single' : status === 'couple' ? '👫 Couple' : '👨‍👩‍👧‍👦 Family'}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Dependents</label>
              <input 
                type="range" 
                min="0" 
                max="5" 
                value={financialProfile.dependents}
                onChange={(e) => setFinancialProfile({...financialProfile, dependents: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-orange-400 font-semibold mt-2">{financialProfile.dependents} dependents</div>
            </div>
          </div>
        </div>

        {/* Current Financial Situation */}
        <div className="bg-yellow-900/50 rounded-2xl p-8 border border-yellow-700/30 mb-8">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            💰 Current Financial Situation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Your Annual Income</label>
              <input 
                type="range" 
                min="20000" 
                max="200000" 
                step="5000"
                value={financialProfile.currentIncome}
                onChange={(e) => setFinancialProfile({...financialProfile, currentIncome: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-yellow-400 font-semibold mt-2">${financialProfile.currentIncome.toLocaleString()}</div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Partner's Annual Income</label>
              <input 
                type="range" 
                min="0" 
                max="200000" 
                step="5000"
                value={financialProfile.partnerIncome}
                onChange={(e) => setFinancialProfile({...financialProfile, partnerIncome: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-yellow-400 font-semibold mt-2">
                {financialProfile.partnerIncome === 0 ? 'No partner income' : `$${financialProfile.partnerIncome.toLocaleString()}`}
              </div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Current Savings</label>
              <input 
                type="range" 
                min="0" 
                max="100000" 
                step="1000"
                value={financialProfile.currentSavings}
                onChange={(e) => setFinancialProfile({...financialProfile, currentSavings: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-yellow-400 font-semibold mt-2">${financialProfile.currentSavings.toLocaleString()}</div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-2">Monthly Debt Payment</label>
              <input 
                type="range" 
                min="0" 
                max="3000" 
                step="50"
                value={financialProfile.monthlyDebtPayment}
                onChange={(e) => setFinancialProfile({...financialProfile, monthlyDebtPayment: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-yellow-400 font-semibold mt-2">${financialProfile.monthlyDebtPayment}/month</div>
            </div>
          </div>
          
          {/* Total Household Income Display */}
          <div className="mt-6 p-4 bg-black/90/70 rounded-xl border border-white/30">
            <div className="text-center">
              <div className="text-sm text-white/70 mb-1">Total Household Income</div>
              <div className="text-2xl font-bold text-white">
                ${(financialProfile.currentIncome + financialProfile.partnerIncome).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Lifestyle & Preferences */}
        <div className="bg-orange-900/50 rounded-2xl p-8 border border-orange-700/30 mb-8">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            ❤️ Lifestyle & Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-medium mb-3">Risk Tolerance</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {key: 'conservative', label: '🛡️ Conservative', desc: 'Safety first'},
                  {key: 'moderate', label: '⚖️ Balanced', desc: 'Moderate risk'},
                  {key: 'aggressive', label: '🚀 Aggressive', desc: 'High growth'}
                ].map(option => (
                  <button 
                    key={option.key}
                    onClick={() => setFinancialProfile({...financialProfile, riskTolerance: option.key})}
                    className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${
                      financialProfile.riskTolerance === option.key 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-black/80 text-white/80 hover:bg-gray-600'
                    }`}
                  >
                    <div>{option.label}</div>
                    <div className="text-xs mt-1 opacity-75">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-3">Time You Can Commit Weekly</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {key: 'minimal', label: '⏰ Minimal', desc: '1-5 hours/week'},
                  {key: 'moderate', label: '⏳ Moderate', desc: '5-15 hours/week'},
                  {key: 'high', label: '🕐 High', desc: '15+ hours/week'}
                ].map(option => (
                  <button 
                    key={option.key}
                    onClick={() => setFinancialProfile({...financialProfile, timeCommitment: option.key})}
                    className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${
                      financialProfile.timeCommitment === option.key 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-black/80 text-white/80 hover:bg-gray-600'
                    }`}
                  >
                    <div>{option.label}</div>
                    <div className="text-xs mt-1 opacity-75">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-3">Career Stage</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {key: 'early', label: '🌱 Early Career', desc: '0-5 years experience'},
                  {key: 'mid', label: '🏢 Mid Career', desc: '5-15 years experience'},
                  {key: 'senior', label: '👔 Senior Professional', desc: '15+ years experience'},
                  {key: 'entrepreneur', label: '🚀 Entrepreneur', desc: 'Own business/freelance'}
                ].map(option => (
                  <button 
                    key={option.key}
                    onClick={() => setFinancialProfile({...financialProfile, careerStage: option.key})}
                    className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${
                      financialProfile.careerStage === option.key 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-black/80 text-white/80 hover:bg-gray-600'
                    }`}
                  >
                    <div>{option.label}</div>
                    <div className="text-xs mt-1 opacity-75">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-3">Willingness to Relocate</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {key: 'staying', label: '🏠 Staying Put', desc: 'Current city only'},
                  {key: 'open', label: '🗺️ Open to Move', desc: 'Within region'},
                  {key: 'anywhere', label: '🌍 Anywhere', desc: 'Global opportunities'}
                ].map(option => (
                  <button 
                    key={option.key}
                    onClick={() => setFinancialProfile({...financialProfile, willignessToRelocate: option.key})}
                    className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${
                      financialProfile.willignessToRelocate === option.key 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-black/80 text-white/80 hover:bg-gray-600'
                    }`}
                  >
                    <div>{option.label}</div>
                    <div className="text-xs mt-1 opacity-75">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Goals & Investment Experience */}
        <div className="bg-yellow-900/50 rounded-2xl p-8 border border-yellow-700/30 mb-8">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            📈 Goals & Investment Experience
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Retirement Goal Age</label>
              <input 
                type="range" 
                min="45" 
                max="75" 
                value={financialProfile.retirementGoalAge}
                onChange={(e) => setFinancialProfile({...financialProfile, retirementGoalAge: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-yellow-400 font-semibold mt-2">{financialProfile.retirementGoalAge} years old</div>
            </div>
            
            <div>
              <label className="block text-white font-medium mb-3">Investment Experience</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {key: 'beginner', label: '📚 Beginner', desc: 'New to investing'},
                  {key: 'intermediate', label: '📊 Intermediate', desc: 'Some experience'},
                  {key: 'advanced', label: '💎 Advanced', desc: 'Very experienced'}
                ].map(option => (
                  <button 
                    key={option.key}
                    onClick={() => setFinancialProfile({...financialProfile, investmentExperience: option.key})}
                    className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${
                      financialProfile.investmentExperience === option.key 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-black/80 text-white/80 hover:bg-gray-600'
                    }`}
                  >
                    <div>{option.label}</div>
                    <div className="text-xs mt-1 opacity-75">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legacy Financial Profile Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-2xl">🏦</span>
              Additional Financial Details
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-2 text-white/80">🎂 Age</label>
                <input
                  type="range"
                  min="18"
                  max="70"
                  value={financialProfile.age}
                  onChange={(e) => setFinancialProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className="w-full accent-orange-500"
                />
                <div className="text-center text-yellow-400 font-semibold text-lg mt-2">
                  {financialProfile.age} years old
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2 text-white/80">💰 Your Annual Income</label>
                <input
                  type="range"
                  min="25000"
                  max="200000"
                  step="5000"
                  value={financialProfile.currentIncome}
                  onChange={(e) => setFinancialProfile(prev => ({ ...prev, currentIncome: parseInt(e.target.value) }))}
                  className="w-full accent-orange-500"
                />
                <div className="text-center text-yellow-400 font-semibold text-lg mt-2">
                  ${financialProfile.currentIncome.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2 text-white/80">💸 Monthly Expenses</label>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="100"
                  value={financialProfile.monthlyExpenses}
                  onChange={(e) => setFinancialProfile(prev => ({ ...prev, monthlyExpenses: parseInt(e.target.value) }))}
                  className="w-full accent-orange-500"
                />
                <div className="text-center text-orange-400 font-semibold text-lg mt-2">
                  ${financialProfile.monthlyExpenses.toLocaleString()}/month
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-2xl">💎</span>
              Assets & Savings
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-2 text-white/80">🏦 Emergency Fund</label>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={financialProfile.emergencyFund}
                  onChange={(e) => setFinancialProfile(prev => ({ ...prev, emergencyFund: parseInt(e.target.value) }))}
                  className="w-full accent-orange-500"
                />
                <div className="text-center text-yellow-400 font-semibold text-lg mt-2">
                  ${financialProfile.emergencyFund.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2 text-white/80">📈 Total Investments</label>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="1000"
                  value={financialProfile.investments}
                  onChange={(e) => setFinancialProfile(prev => ({ ...prev, investments: parseInt(e.target.value) }))}
                  className="w-full accent-orange-500"
                />
                <div className="text-center text-yellow-400 font-semibold text-lg mt-2">
                  ${financialProfile.investments.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2 text-white/80">🎯 Financial Goals</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'buyHome', label: '🏠 Buy Home', active: financialProfile.financialGoals.buyHome },
                    { key: 'travel', label: '✈️ Travel', active: financialProfile.financialGoals.travel },
                    { key: 'earlyRetirement', label: '🏖️ Early Retirement', active: financialProfile.financialGoals.earlyRetirement },
                    { key: 'payOffDebt', label: '💳 Pay Off Debt', active: financialProfile.financialGoals.payOffDebt }
                  ].map(goal => (
                    <button
                      key={goal.key}
                      onClick={() => setFinancialProfile(prev => ({
                        ...prev,
                        financialGoals: {
                          ...prev.financialGoals,
                          [goal.key]: !prev.financialGoals[goal.key]
                        }
                      }))}
                      className={`p-3 rounded-xl text-center transition-all text-sm ${
                        goal.active
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg'
                          : 'bg-black/80/50 text-white/80 hover:bg-gray-600/50'
                      }`}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Profile Summary */}
        <div className="bg-black/70 rounded-2xl p-8 border border-white/20/30 mt-8 mb-8">
          <h3 className="text-3xl font-bold mb-8 text-white flex items-center gap-2">
            📊 Your Financial Profile Summary
          </h3>
          
          {/* Demographics Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/40 rounded-xl p-6 border border-orange-700/30">
              <div className="text-orange-300 text-sm font-medium mb-2">📍 Demographics</div>
              <div className="space-y-2">
                <div className="text-white font-semibold">{financialProfile.age} years old</div>
                <div className="text-white/80 text-sm">{financialProfile.familyStatus === 'single' ? '👤 Single' : financialProfile.familyStatus === 'couple' ? '👫 Couple' : '👨‍👩‍👧‍👦 Family'}</div>
                <div className="text-white/80 text-sm">{financialProfile.dependents} dependents</div>
              </div>
            </div>
            
            {/* Financial State Card */}
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/40 rounded-xl p-6 border border-yellow-700/30">
              <div className="text-yellow-300 text-sm font-medium mb-2">💰 Financial State</div>
              <div className="space-y-2">
                <div className="text-white font-semibold">${(financialProfile.currentIncome + financialProfile.partnerIncome).toLocaleString()}</div>
                <div className="text-white/80 text-sm">Household Income</div>
                <div className="text-white/80 text-sm">${financialProfile.currentSavings.toLocaleString()} saved</div>
              </div>
            </div>
            
            {/* Preferences Card */}
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/40 rounded-xl p-6 border border-orange-700/30">
              <div className="text-orange-300 text-sm font-medium mb-2">❤️ Preferences</div>
              <div className="space-y-2">
                <div className="text-white font-semibold">{financialProfile.riskTolerance} risk</div>
                <div className="text-white/80 text-sm">{financialProfile.timeCommitment} time commitment</div>
                <div className="text-white/80 text-sm">{financialProfile.careerStage} career</div>
              </div>
            </div>
          </div>
          
          {/* Financial Health Analysis */}
          <div className="bg-gradient-to-r from-orange-900/50 to-yellow-900/40 rounded-xl p-8 border border-orange-700/30 mb-6">
            <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              🎯 Financial Health Score
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Income Health */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="w-full h-full rounded-full border-4 border-white/30 flex items-center justify-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {financialProfile.currentIncome + financialProfile.partnerIncome >= 75000 ? 'A' : 
                       financialProfile.currentIncome + financialProfile.partnerIncome >= 50000 ? 'B' : 
                       financialProfile.currentIncome + financialProfile.partnerIncome >= 35000 ? 'C' : 'D'}
                    </div>
                  </div>
                </div>
                <div className="text-white font-semibold">Income Health</div>
                <div className="text-white/80 text-sm">Based on household income</div>
              </div>
              
              {/* Savings Rate */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="w-full h-full rounded-full border-4 border-white/30 flex items-center justify-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round((financialProfile.currentSavings / ((financialProfile.currentIncome + financialProfile.partnerIncome) * 0.1)) * 100) > 100 ? 'A+' :
                       Math.round((financialProfile.currentSavings / ((financialProfile.currentIncome + financialProfile.partnerIncome) * 0.1)) * 100) > 50 ? 'A' :
                       Math.round((financialProfile.currentSavings / ((financialProfile.currentIncome + financialProfile.partnerIncome) * 0.1)) * 100) > 25 ? 'B' : 'C'}
                    </div>
                  </div>
                </div>
                <div className="text-white font-semibold">Savings Rate</div>
                <div className="text-white/80 text-sm">Emergency fund ratio</div>
              </div>
              
              {/* Debt Management */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="w-full h-full rounded-full border-4 border-white/30 flex items-center justify-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {(financialProfile.monthlyDebtPayment * 12) / (financialProfile.currentIncome + financialProfile.partnerIncome) < 0.1 ? 'A' :
                       (financialProfile.monthlyDebtPayment * 12) / (financialProfile.currentIncome + financialProfile.partnerIncome) < 0.2 ? 'B' :
                       (financialProfile.monthlyDebtPayment * 12) / (financialProfile.currentIncome + financialProfile.partnerIncome) < 0.3 ? 'C' : 'D'}
                    </div>
                  </div>
                </div>
                <div className="text-white font-semibold">Debt Health</div>
                <div className="text-white/80 text-sm">Debt-to-income ratio</div>
              </div>
              
              {/* Investment Readiness */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="w-full h-full rounded-full border-4 border-white/30 flex items-center justify-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {financialProfile.investmentExperience === 'advanced' ? 'A' :
                       financialProfile.investmentExperience === 'intermediate' ? 'B' :
                       financialProfile.investmentExperience === 'beginner' ? 'C' : 'D'}
                    </div>
                  </div>
                </div>
                <div className="text-white font-semibold">Investment Ready</div>
                <div className="text-white/80 text-sm">Experience level</div>
              </div>
            </div>
          </div>
          
          {/* Income Journey Planning */}
          <div className="bg-gradient-to-r from-orange-900/50 to-yellow-900/40 rounded-xl p-8 border border-orange-700/30">
            <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              📈 Your Income Journey
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { period: '2020s', age: `${Math.floor(financialProfile.age/10)*10}s`, income: financialProfile.currentIncome + financialProfile.partnerIncome },
                { period: '2030s', age: `${Math.floor(financialProfile.age/10)*10 + 10}s`, income: Math.round((financialProfile.currentIncome + financialProfile.partnerIncome) * 1.4) },
                { period: '2040s', age: `${Math.floor(financialProfile.age/10)*10 + 20}s`, income: Math.round((financialProfile.currentIncome + financialProfile.partnerIncome) * 1.8) },
                { period: '2050s', age: `${Math.floor(financialProfile.age/10)*10 + 30}s`, income: Math.round((financialProfile.currentIncome + financialProfile.partnerIncome) * 2.2) }
              ].map((decade, index) => (
                <div key={decade.period} className="text-center">
                  <div className="bg-orange-800/30 rounded-lg p-4 mb-2">
                    <div className="text-orange-300 text-sm font-medium">{decade.period}</div>
                    <div className="text-white text-lg font-bold">${decade.income.toLocaleString()}</div>
                    <div className="text-white/80 text-xs">Your {decade.age}</div>
                  </div>
                  <div className="text-white/70 text-xs">
                    {index === 0 ? 'Current income' : 
                     index === 1 ? '+40% growth' : 
                     index === 2 ? 'Peak earning' : 'Pre-retirement'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-black/90/50 rounded-lg border border-white/30">
              <div className="text-center">
                <div className="text-white/80 text-sm mb-1">Lifetime Earning Potential</div>
                <div className="text-3xl font-bold text-orange-400">
                  ${Math.round(((financialProfile.currentIncome + financialProfile.partnerIncome) * 35 * 1.6) / 1000000 * 10) / 10}M
                </div>
                <div className="text-white/70 text-xs">Over next 35 years with 3% annual growth</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => {
              setUserJourney(prev => ({ 
                ...prev, 
                hasSetupProfile: true, 
                currentStep: 'planning' 
              }));
              setCurrentPage('planning');
            }}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Continue to Life Planning 🎯
          </button>
        </div>
      </div>
    </div>
  );

  // Planning Page
  const renderPlanningPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            🎯 Dream Life Planner
          </h1>
          <p className="text-xl text-white/80">Map out your ideal lifestyle and create a financial roadmap to get there</p>
        </div>
        
        {renderWellnessRings()}

        <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">🚀 Your Financial Future</h2>
          <p className="text-xl text-white/80 mb-8">
            Based on your profile and goals, here's your personalized path to financial wellness
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-yellow-900/30 rounded-xl p-6 border border-yellow-700/30">
              <div className="text-yellow-400 font-bold text-3xl mb-2">65</div>
              <div className="text-yellow-300">Projected Retirement Age</div>
            </div>

            <div className="bg-orange-900/30 rounded-xl p-6 border border-orange-700/30">
              <div className="text-orange-400 font-bold text-3xl mb-2">$1.2M</div>
              <div className="text-orange-300">Estimated Net Worth at Retirement</div>
            </div>

            <div className="bg-teal-900/30 rounded-xl p-6 border border-yellow-700/30">
              <div className="text-yellow-400 font-bold text-3xl mb-2">✓</div>
              <div className="text-yellow-300">On Track for Financial Freedom</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-xl p-8 border border-orange-700/30">
            <h3 className="text-2xl font-bold text-white mb-4">🎯 Your Recommended Action Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="text-lg font-bold text-yellow-400 mb-3">Immediate Steps (This Month)</h4>
                <ul className="space-y-2 text-white/80">
                  <li>• Set up automatic 401k contribution (15% of income)</li>
                  <li>• Open high-yield savings account for emergency fund</li>
                  <li>• Review and optimize monthly subscriptions</li>
                  <li>• Start tracking expenses with your wellness rings</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-bold text-orange-400 mb-3">Long-term Strategy (Next Year)</h4>
                <ul className="space-y-2 text-white/80">
                  <li>• Build emergency fund to $27,000 (6 months expenses)</li>
                  <li>• Increase investments to $25,000</li>
                  <li>• Research home buying in your target area</li>
                  <li>• Consider side income streams for faster growth</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Health Score Page
  const renderHealthPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            💚 Your Financial Health Score
          </h1>
          <p className="text-xl text-white/80">
            Get real-time insights into your financial wellness
          </p>
        </div>

        {/* Main Health Score */}
        <div className="bg-gradient-to-br from-orange-900/50 to-black rounded-2xl p-8 border border-orange-700/30 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="text-6xl font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {Math.round((wellnessRings.safety.progress + wellnessRings.freedom.progress + wellnessRings.fulfillment.progress) / 3)}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Building Momentum</h2>
            <p className="text-white/80">You're on the right track</p>
          </div>
        </div>

        {renderWellnessRings()}

        {/* Detailed Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/90/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-400 text-lg">🛡️</span>
              <span className="text-xs text-white/70">needs work</span>
            </div>
            <h4 className="text-white font-semibold mb-1">Emergency Fund</h4>
            <p className="text-sm text-white/70 mb-2">Aim for 6 months of expenses saved</p>
            <div className="w-full bg-black/80 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full" style={{width: '25%'}}></div>
            </div>
            <p className="text-xs text-white/80">3/25 points</p>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 text-lg">📊</span>
              <span className="text-xs text-yellow-400">good</span>
            </div>
            <h4 className="text-white font-semibold mb-1">Savings & Investments</h4>
            <p className="text-sm text-white/70 mb-2">Save at least 20% of your income</p>
            <div className="w-full bg-black/80 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full" style={{width: '70%'}}></div>
            </div>
            <p className="text-xs text-white/80">18/25 points</p>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-400 text-lg">💳</span>
              <span className="text-xs text-orange-400">needs work</span>
            </div>
            <h4 className="text-white font-semibold mb-1">Debt Management</h4>
            <p className="text-sm text-white/70 mb-2">Keep debt under 30% of income</p>
            <div className="w-full bg-black/80 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-orange-400 to-yellow-400 h-2 rounded-full" style={{width: '40%'}}></div>
            </div>
            <p className="text-xs text-white/80">8/25 points</p>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 text-lg">💰</span>
              <span className="text-xs text-yellow-400">excellent</span>
            </div>
            <h4 className="text-white font-semibold mb-1">Budget Balance</h4>
            <p className="text-sm text-white/70 mb-2">Live below your means</p>
            <div className="w-full bg-black/80 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full" style={{width: '90%'}}></div>
            </div>
            <p className="text-xs text-white/80">23/25 points</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              🏆 Your Achievements
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/30">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-medium text-yellow-400">Conversation Complete</div>
                  <div className="text-sm text-white/70">Opened up about money habits</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-900/30 rounded-lg border border-orange-700/30">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-medium text-orange-400">Profile Builder</div>
                  <div className="text-sm text-white/70">Set up financial profile</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-900/30 rounded-lg border border-orange-700/30">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-medium text-orange-400">Momentum Master</div>
                  <div className="text-sm text-white/70">Completed 3 days of tracking</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/30">
                <span className="text-2xl">👑</span>
                <div>
                  <div className="font-medium text-yellow-400">Building Strength</div>
                  <div className="text-sm text-white/70">Improved health score by 15 points</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              🎯 Next Steps
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-900/30 rounded-lg border border-yellow-700/30">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-medium text-yellow-400">Boost Your Safety Ring</div>
                  <div className="text-sm text-white/70">Build emergency fund</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-900/30 rounded-lg border border-orange-700/30">
                <span className="text-2xl">🚀</span>
                <div>
                  <div className="font-medium text-orange-400">Increase Freedom Ring</div>
                  <div className="text-sm text-white/70">Start investing for goals</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boost Your Score Section */}
        <div className="bg-gradient-to-br from-yellow-900/50 to-purple-900/50 rounded-2xl p-8 border border-yellow-700/30">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            💚 Boost Your Score
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all flex items-center gap-2">
              <span className="text-lg">📊</span>
              Update Profile
            </button>
            <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all flex items-center gap-2">
              <span className="text-lg">⚡</span>
              Adjust Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Financial Tools Page
  const renderToolsPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            🛠️ Financial Tools
          </h1>
          <p className="text-xl text-white/80">
            Powerful calculators to optimize your money
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time vs Money Calculator */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⏰</span>
              <div>
                <h3 className="text-xl font-bold text-white">Time vs Money Calculator</h3>
                <p className="text-sm text-white/70">See how much waiting to invest costs you</p>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all">
              Calculate Impact
            </button>
          </div>

          {/* Budget Tracker */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="text-xl font-bold text-white">Budget Tracker</h3>
                <p className="text-sm text-white/70">Track spending and optimize your budget</p>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all">
              Start Tracking
            </button>
          </div>

          {/* Investment Simulator */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📈</span>
              <div>
                <h3 className="text-xl font-bold text-white">Investment Simulator</h3>
                <p className="text-sm text-white/70">Model different investment strategies</p>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all">
              Run Simulation
            </button>
          </div>

          {/* Peer Comparison */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👥</span>
              <div>
                <h3 className="text-xl font-bold text-white">Peer Comparison</h3>
                <p className="text-sm text-white/70">See how you compare to others your age</p>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all">
              Compare Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Learn Page
  const renderLearnPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            📚 Learn & Grow
          </h1>
          <p className="text-xl text-white/80">
            Master your money with bite-sized lessons
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Investment Basics */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-white mb-2">Investment Basics</h3>
            <p className="text-white/70 mb-4">Learn the fundamentals of growing your wealth</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">5 min read</span>
              <button className="text-yellow-400 hover:text-yellow-300 font-medium">Start →</button>
            </div>
          </div>

          {/* Budgeting 101 */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">Budgeting 101</h3>
            <p className="text-white/70 mb-4">Create a budget that actually works for you</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">7 min read</span>
              <button className="text-yellow-400 hover:text-yellow-300 font-medium">Start →</button>
            </div>
          </div>

          {/* Emergency Fund */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl mb-4">🛟</div>
            <h3 className="text-xl font-bold text-white mb-2">Emergency Fund</h3>
            <p className="text-white/70 mb-4">Build your financial safety net</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">4 min read</span>
              <button className="text-yellow-400 hover:text-yellow-300 font-medium">Start →</button>
            </div>
          </div>

          {/* Debt Management */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-white mb-2">Debt Management</h3>
            <p className="text-white/70 mb-4">Smart strategies to pay off debt faster</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">6 min read</span>
              <button className="text-yellow-400 hover:text-yellow-300 font-medium">Start →</button>
            </div>
          </div>

          {/* Retirement Planning */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl mb-4">🏖️</div>
            <h3 className="text-xl font-bold text-white mb-2">Retirement Planning</h3>
            <p className="text-white/70 mb-4">Secure your future with smart planning</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">8 min read</span>
              <button className="text-yellow-400 hover:text-yellow-300 font-medium">Start →</button>
            </div>
          </div>

          {/* Financial Psychology */}
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-white mb-2">Money Psychology</h3>
            <p className="text-white/70 mb-4">Understand your relationship with money</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">10 min read</span>
              <button className="text-yellow-400 hover:text-yellow-300 font-medium">Start →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Optimization Page
  const renderOptimizationPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            ⚡ Financial Optimization
          </h1>
          <p className="text-xl text-white/80">
            AI-powered recommendations to maximize your financial potential
          </p>
        </div>

        {/* Quick Wins Section */}
        <div className="bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-2xl p-8 border border-yellow-700/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            🚀 Quick Wins (30-Day Impact)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/90/50 rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="text-lg font-bold text-white mb-2">Optimize Credit Cards</h3>
              <p className="text-white/80 text-sm mb-4">Switch to cashback cards for categories you spend most on</p>
              <div className="text-yellow-400 font-semibold">Potential: +$150/month</div>
            </div>
            <div className="bg-black/90/50 rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-bold text-white mb-2">Review Subscriptions</h3>
              <p className="text-white/80 text-sm mb-4">Cancel unused subscriptions and negotiate better rates</p>
              <div className="text-yellow-400 font-semibold">Potential: +$89/month</div>
            </div>
            <div className="bg-black/90/50 rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">🏦</div>
              <h3 className="text-lg font-bold text-white mb-2">High-Yield Savings</h3>
              <p className="text-white/80 text-sm mb-4">Move emergency fund to 4.5% APY account</p>
              <div className="text-yellow-400 font-semibold">Potential: +$75/month</div>
            </div>
          </div>
        </div>

        {/* Investment Optimization */}
        <div className="bg-gradient-to-br from-orange-900/50 to-orange-900/50 rounded-2xl p-8 border border-orange-700/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            📈 Investment Optimization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/90/50 rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4">Portfolio Rebalancing</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Current Allocation</span>
                  <span className="text-yellow-400">60/40 Stocks/Bonds</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Recommended</span>
                  <span className="text-yellow-400">80/20 for your age</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Expected Gain</span>
                  <span className="text-yellow-400">+1.2% annually</span>
                </div>
              </div>
            </div>
            <div className="bg-black/90/50 rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4">Tax Optimization</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">401k Contribution</span>
                  <span className="text-yellow-400">$12,000/year</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Max Recommended</span>
                  <span className="text-yellow-400">$23,000/year</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Tax Savings</span>
                  <span className="text-yellow-400">$2,640/year</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Powered Insights */}
        <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-2xl p-8 border border-orange-700/30">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            🤖 AI-Powered Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/90/50 rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-3">Career Growth Optimization</h3>
              <div className="space-y-2">
                <p className="text-white/80 text-sm">Based on your profile and lifestyle data:</p>
                <ul className="text-sm text-white/70 space-y-1">
                  <li>• Negotiate salary increase: aim for 8-12% annually</li>
                  <li>• Side income opportunity: +$500-1500/month</li>
                  <li>• Skill investment: courses that boost earning potential</li>
                </ul>
              </div>
            </div>
            <div className="bg-black/90/50 rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-3">Behavioral Patterns</h3>
              <div className="space-y-2">
                <p className="text-white/80 text-sm">AI detected spending patterns:</p>
                <ul className="text-sm text-white/70 space-y-1">
                  <li>• Dining out increases 40% on weekends</li>
                  <li>• Impulse purchases peak at 3pm</li>
                  <li>• Best saving streak: 3 weeks in March</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // What If Scenarios Page
  const renderScenariosPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            🤔 What If Scenarios
          </h1>
          <p className="text-xl text-white/80">
            Explore life possibilities and understand their financial impact
          </p>
        </div>

        {/* Popular Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl p-6 border border-orange-700/30 hover:border-orange-500/50 transition-all cursor-pointer">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold text-white mb-2">Can I Move Out?</h3>
            <p className="text-white/80 text-sm mb-4">Calculate if you can afford your own place based on rent, utilities, and lifestyle</p>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-sm">✓ Most Popular</span>
              <button className="text-orange-400 hover:text-orange-300">Try It →</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-2xl p-6 border border-yellow-700/30 hover:border-yellow-500/50 transition-all cursor-pointer">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-xl font-bold text-white mb-2">Should I Buy a Car?</h3>
            <p className="text-white/80 text-sm mb-4">Compare buying vs leasing vs rideshare for your specific situation</p>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-sm">⭐ Trending</span>
              <button className="text-yellow-400 hover:text-yellow-300">Try It →</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-2xl p-6 border border-orange-700/30 hover:border-orange-500/50 transition-all cursor-pointer">
            <div className="text-4xl mb-4">✈️</div>
            <h3 className="text-xl font-bold text-white mb-2">Can I Afford This Trip?</h3>
            <p className="text-white/80 text-sm mb-4">Plan your dream vacation without breaking your budget</p>
            <div className="flex items-center justify-between">
              <span className="text-orange-400 text-sm">🔥 Hot</span>
              <button className="text-orange-400 hover:text-orange-300">Try It →</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-900/50 to-yellow-900/50 rounded-2xl p-6 border border-orange-700/30 hover:border-orange-500/50 transition-all cursor-pointer">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-white mb-2">Should I Go Back to School?</h3>
            <p className="text-white/80 text-sm mb-4">ROI analysis of education vs current earning potential</p>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">💭 Life Changer</span>
              <button className="text-orange-400 hover:text-orange-300">Try It →</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-2xl p-6 border border-yellow-700/30 hover:border-orange-500/50 transition-all cursor-pointer">
            <div className="text-4xl mb-4">💍</div>
            <h3 className="text-xl font-bold text-white mb-2">Can I Afford to Get Married?</h3>
            <p className="text-white/80 text-sm mb-4">Wedding costs, combined finances, and lifestyle changes</p>
            <div className="flex items-center justify-between">
              <span className="text-orange-400 text-sm">💕 Relationship</span>
              <button className="text-yellow-400 hover:text-yellow-300">Try It →</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-2xl p-6 border border-yellow-700/30 hover:border-yellow-500/50 transition-all cursor-pointer">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-white mb-2">Should I Quit My Job?</h3>
            <p className="text-white/80 text-sm mb-4">Financial runway for career changes and entrepreneurship</p>
            <div className="flex items-center justify-between">
              <span className="text-orange-400 text-sm">⚡ Bold Move</span>
              <button className="text-yellow-400 hover:text-yellow-300">Try It →</button>
            </div>
          </div>
        </div>

        {/* Custom Scenario Builder */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black rounded-2xl p-8 border border-white/20/30">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            🔧 Build Your Own Scenario
          </h2>
          <p className="text-white/80 mb-6">Can't find what you're looking for? Create a custom financial scenario and get personalized insights.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-white font-medium mb-2">What are you considering?</label>
              <input 
                type="text" 
                placeholder="e.g., Moving to a new city, Starting a business..."
                className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Estimated Cost</label>
              <input 
                type="number" 
                placeholder="$0"
                className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Timeline</label>
              <select className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400">
                <option value="">Select timeframe...</option>
                <option value="immediately">Immediately</option>
                <option value="3months">Within 3 months</option>
                <option value="6months">Within 6 months</option>
                <option value="1year">Within 1 year</option>
                <option value="2years">Within 2 years</option>
              </select>
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Priority Level</label>
              <select className="w-full bg-black/80 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:border-orange-400">
                <option value="">How important is this?</option>
                <option value="nice">Nice to have</option>
                <option value="want">I really want this</option>
                <option value="need">I need this</option>
                <option value="critical">This is critical</option>
              </select>
            </div>
          </div>
          
          <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-8 rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all">
            Analyze My Scenario
          </button>
        </div>
      </div>
    </div>
  );

  // About Page
  const renderAboutPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            ℹ️ About FinThera
          </h1>
          <p className="text-xl text-white/80">
            Your AI-powered financial therapy platform
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">🎯 Our Mission</h2>
            <p className="text-white/80 text-lg leading-relaxed">
              FinThera combines the warmth of therapy with the precision of financial planning. 
              We believe that your relationship with money is deeply personal, and generic advice 
              doesn't work. Our AI therapist helps you discover your unique financial personality 
              and creates a personalized path to financial wellness.
            </p>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">✨ What Makes Us Different</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">🤖 AI-Powered Therapy</h3>
                <p className="text-white/80">Human-like conversations that adapt to your personality and financial situation.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">📊 Personalized Insights</h3>
                <p className="text-white/80">Every recommendation is tailored to your unique financial archetype and goals.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">🛠️ Practical Tools</h3>
                <p className="text-white/80">Interactive calculators and simulators to test your financial strategies.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">📚 Continuous Learning</h3>
                <p className="text-white/80">Bite-sized lessons that evolve with your financial journey.</p>
              </div>
            </div>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">🔒 Privacy & Security</h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Your financial information is completely private and secure. We use bank-level encryption 
              and never share your personal data. Your conversations with our AI therapist are confidential 
              and designed to help you, not to sell you products.
            </p>
          </div>

          <div className="bg-black/90/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">🚀 Get Started</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              Ready to transform your relationship with money? Start with a simple conversation 
              with our AI therapist. No judgment, no pressure—just real talk about your financial life.
            </p>
            <button 
              onClick={() => setCurrentPage('conversation')}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-8 rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all"
            >
              Start Your Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black pointer-events-none"></div>
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {/* Starry Night Background */}
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-20 left-32 w-0.5 h-0.5 bg-yellow-200 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-32 left-64 w-1 h-1 bg-orange-200 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-16 right-20 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-40 right-40 w-1 h-1 bg-yellow-300 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-24 right-64 w-0.5 h-0.5 bg-orange-300 rounded-full animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute bottom-32 left-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-48 left-48 w-0.5 h-0.5 bg-yellow-200 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute bottom-20 right-32 w-1 h-1 bg-orange-200 rounded-full animate-pulse" style={{animationDelay: '1.8s'}}></div>
        <div className="absolute bottom-40 right-16 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{animationDelay: '2.8s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '6s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '6.5s'}}></div>
        <div className="absolute top-2/3 right-1/4 w-0.5 h-0.5 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '7s'}}></div>
      </div>
      
      <div className="relative z-10">
        {renderNavigation()}
        
        {currentPage === 'landing' && renderLandingPage()}
        {currentPage === 'conversation' && renderConversationPage()}
        {currentPage === 'health' && renderHealthPage()}
        {currentPage === 'tools' && renderToolsPage()}
        {currentPage === 'optimization' && renderOptimizationPage()}
        {currentPage === 'scenarios' && renderScenariosPage()}
        {currentPage === 'learn' && renderLearnPage()}
        {currentPage === 'profile' && renderProfilePage()}
        {currentPage === 'planning' && renderPlanningPage()}
        {currentPage === 'about' && renderAboutPage()}
      </div>
    </div>
  );
};

export default FinancialTherapyPlatform;