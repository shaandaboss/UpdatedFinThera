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
  const [conversationCount, setConversationCount] = useState(0);
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
  
  // Scenarios page state
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioInputs, setScenarioInputs] = useState({});
  const [selectedLearnTopic, setSelectedLearnTopic] = useState(null);
  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);
  const currentTranscriptRef = useRef('');
  const isManualStopRef = useRef(false);

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



  // Initialize therapeutic conversation
  useEffect(() => {
    if (currentPage === 'conversation' && chatMessages.length === 0) {
      setChatMessages([
        {
          type: 'therapist',
          message: "Hi there! I'm really glad you're here. I'm genuinely curious about your relationship with money - not to judge or lecture, just to understand. So let me start with this: when you think about your financial life right now, what feelings come up for you?",
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
          recognition.continuous = true; // Keep listening until manually stopped
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          
          recognition.onstart = () => {
            setIsRecording(true);
            currentTranscriptRef.current = ''; // Reset transcript when starting new recording
            isManualStopRef.current = false; // Reset manual stop flag
          };
          
          recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }
            
            // Accumulate final results
            if (finalTranscript) {
              currentTranscriptRef.current += finalTranscript;
            }
            
            // Update chat input with accumulated final + current interim
            const fullTranscript = currentTranscriptRef.current + interimTranscript;
            setChatInput(fullTranscript.trim());
          };
          
          recognition.onend = () => {
            setIsRecording(false);
            
            // Only process when manually stopped (not auto-stopped)
            if (isManualStopRef.current) {
              const finalMessage = currentTranscriptRef.current.trim();
              if (finalMessage) {
                // Process the complete voice message
                const newMessage = {
                  type: 'user',
                  message: finalMessage,
                  timestamp: new Date()
                };
                
                setChatMessages(prev => [...prev, newMessage]);
                
                // Update conversation count and store response
                const newCount = conversationCount + 1;
                setConversationCount(newCount);
                
                const updatedResponses = {
                  ...conversationResponses,
                  [`message_${newCount}`]: finalMessage
                };
                setConversationResponses(updatedResponses);
                
                // Parse financial data from user response
                parseFinancialData(finalMessage, newCount);
                
                // Clear input and generate conversational response
                setChatInput('');
                
                setTimeout(async () => {
                  // Generate AI-powered conversation response
                  const therapistMessage = await getDynamicConversationResponse(finalMessage, newCount);
                  
                  const therapistResponse = {
                    type: 'therapist',
                    message: therapistMessage,
                    timestamp: new Date()
                  };
                  setChatMessages(prev => [...prev, therapistResponse]);
                }, 1500);
              }
              
              // Reset for next recording
              currentTranscriptRef.current = '';
              isManualStopRef.current = false;
            }
          };
          
          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            currentTranscriptRef.current = '';
          };
          
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
        console.log('🎤 Auto-speaking therapist message:', lastMessage.message.substring(0, 50) + '...');
        speakMessage(lastMessage.message);
      }
    }
  }, [chatMessages, voiceEnabled]);

  const startRecording = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not available. Please try typing your response.');
      return;
    }
    
    if (isRecording) return; // Already recording
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setChatInput('');
      currentTranscriptRef.current = '';
      recognitionRef.current.start();
    } catch (error) {
      alert('Unable to access microphone. Please check your browser settings.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      isManualStopRef.current = true; // Mark as manual stop
      recognitionRef.current.stop();
    }
  };

  const speakMessage = async (text) => {
    if (!voiceEnabled) {
      console.log('🔇 Voice disabled, skipping speech');
      return;
    }
    
    if (!apiKey) {
      console.warn('🔇 No API key available for voice synthesis');
      return;
    }
    
    console.log('🎤 Speaking message with voice:', selectedVoice, 'API key length:', apiKey?.length);
    
    // Stop any current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    voiceService.stop();
    
    try {
      // Ensure voice service is initialized with current API key
      voiceService.initialize({ openaiApiKey: apiKey });
      
      const audio = await voiceService.speak(
        text,
        () => {
          console.log('🎤 Voice started speaking');
          setIsAISpeaking(true);
        },  // onStart
        () => {
          console.log('🎤 Voice finished speaking');
          setIsAISpeaking(false);
        }, // onEnd
        (error) => {                  // onError
          console.error('❌ Voice synthesis error:', error);
          setIsAISpeaking(false);
        },
        selectedVoice // Pass the selected voice
      );
      
      currentAudioRef.current = audio;
    } catch (error) {
      console.error('❌ Speech synthesis failed:', error);
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

  // Therapeutic conversation questions
  const therapyQuestions = [
    {
      id: 'feelings',
      question: "When you think about your financial life right now, what feelings come up for you?",
      used: false
    },
    {
      id: 'good_decision',
      question: "Tell me about a money decision you made recently that you felt really good about — what made it feel right?",
      used: false
    },
    {
      id: 'bad_decision', 
      question: "Was there a money choice you made that didn't sit well with you — what do you think led to that?",
      used: false
    },
    {
      id: 'daily_approach',
      question: "What's your current approach to handling money day-to-day — do you plan, track, or just go with the flow?",
      used: false
    },
    {
      id: 'upbringing',
      question: "Growing up, how did the people around you (family, friends) influence how you think about money today?",
      used: false
    },
    {
      id: 'zero_stress',
      question: "If you had zero money stress for the next year, how would your life look different?",
      used: false
    },
    {
      id: 'wish_change',
      question: "What's one thing about your money situation that you wish could change right now?",
      used: false
    },
    {
      id: 'freedom_meaning',
      question: "Looking at the bigger picture, what does 'financial freedom' mean to you personally?",
      used: false
    },
    {
      id: 'barriers',
      question: "What usually holds you back from making the money moves you know you should?",
      used: false
    },
    {
      id: 'small_habit',
      question: "If we could work on one small money habit together that would make your life easier, where would you want to start?",
      used: false
    }
  ];

  // AI-powered conversation using OpenAI Chat Completion API
  const getDynamicConversationResponse = async (userResponse, messageCount) => {
    console.log(`🤖 AI CONVERSATION - Message count: ${messageCount}, User response: "${userResponse}"`);
    
    if (!apiKey) {
      console.warn('🤖 No API key available for AI conversation');
      return `I'd love to continue our conversation, but I need an API key to provide personalized responses.`;
    }
    
    // Check if we should wrap up the conversation (after 6-8 exchanges)
    if (messageCount >= 7) {
      console.log('🤖 Conversation complete - triggering insights generation');
      setTimeout(() => {
        try {
          generateLifestyleAnalysis();
        } catch (error) {
          console.error('❌ Error generating insights:', error);
        }
        
        setTimeout(() => {
          setShowConversationResults(true);
          setUserJourney(prev => ({
            ...prev,
            hasCompletedConversation: true,
            currentStep: 'profile'
          }));
        }, 500);
      }, 1500);
      
      return `This has been such an insightful conversation! Let me create your personalized financial analysis based on everything you've shared...`;
    }
    
    // Build conversation history for context
    const conversationHistory = Object.entries(conversationResponses)
      .sort(([a], [b]) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))
      .map(([key, response]) => response)
      .join('\n\nUser: ');
    
    const systemPrompt = `You are a warm, empathetic financial therapist talking to a young adult. Your goal is to understand their relationship with money through natural conversation.

Guidelines:
- Keep responses to 1-2 sentences maximum
- Ask ONE follow-up question that builds naturally on their response
- Sound like a supportive friend who's genuinely curious
- Focus on their goals, dreams, obstacles, and motivations
- Be encouraging and non-judgmental
- After 6-8 total exchanges, you'll wrap up for their personalized report

Previous conversation:
User: ${conversationHistory}
User: ${userResponse}

Respond naturally as their financial therapist:`;

    try {
      console.log('🤖 Making OpenAI API call...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            }
          ],
          max_tokens: 150,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();
      
      console.log('🤖 AI Response received:', aiResponse);
      return aiResponse || "That's really interesting. Tell me more about what drives that feeling.";
      
    } catch (error) {
      console.error('🤖 AI API Error:', error);
      // Fallback to ensure conversation continues
      const fallbackResponses = [
        "That's really insightful. What would achieving that goal mean to you?",
        "I can hear the passion in that. What's motivating you most right now?",
        "That makes so much sense. What do you think is your biggest obstacle?",
        "I love that vision! What would make the biggest difference in getting there?",
        "That's such an honest perspective. What change would excite you most?",
        "You're being so thoughtful about this. What drives you to improve your finances?"
      ];
      return fallbackResponses[Math.min(messageCount - 1, fallbackResponses.length - 1)];
    }
  };

  // Generate contextual acknowledgments based on what user said
  const generateContextualAcknowledgment = (response) => {
    if (response.includes('family') || response.includes('parents') || response.includes('grew up')) {
      return "Those early experiences with money really shape us, don't they? The messages we got as kids often stick with us way longer than we realize. ";
    } else if (response.includes('freedom') || response.includes('security') || response.includes('peace')) {
      return "That vision of freedom and security is so powerful. When you can see what you're working toward, it changes everything. ";
    } else if (response.includes('mistake') || response.includes('regret') || response.includes('bad decision')) {
      return "We all have those money decisions we'd love to take back. But those experiences teach us so much about ourselves. ";
    } else if (response.includes('habit') || response.includes('routine') || response.includes('small steps')) {
      return "I love that you're thinking about small, manageable changes. That's often where the real transformation happens. ";
    } else {
      return "That's such an honest and thoughtful response. ";
    }
  };


  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const newUserMessage = {
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);

    // Update conversation count and store response
    const newCount = conversationCount + 1;
    setConversationCount(newCount);
    
    const updatedResponses = {
      ...conversationResponses,
      [`message_${newCount}`]: chatInput
    };
    setConversationResponses(updatedResponses);
    
    // Parse financial data from user response
    parseFinancialData(chatInput, newCount);

    setTimeout(async () => {
      // Generate AI-powered conversation response
      const therapistMessage = await getDynamicConversationResponse(chatInput, newCount);
      
      const therapistResponse = {
        type: 'therapist',
        message: therapistMessage,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, therapistResponse]);
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

  // Analyze therapeutic conversation responses for personalized insights
  const analyzeTherapeuticResponses = (responses, allText) => {
    const insights = [];
    
    // Analyze emotional patterns from first response (feelings question)
    const message1 = responses.message_1?.toLowerCase() || '';
    let emotionalArchetype = null;
    
    if (message1.includes('stress') || message1.includes('anxiety') || message1.includes('overwhelm') || message1.includes('worried')) {
      emotionalArchetype = {
        category: "🧠 Your Money Mindset",
        title: "💭 The Thoughtful Worrier",
        description: "You're deeply aware of how money affects your emotional well-being. This consciousness is actually a superpower—most people ignore these feelings and make poor decisions.",
        deepInsight: "Your financial anxiety might be your intuition telling you to take more control of your money situation.",
        actionItems: [
          "Start with a simple 'money check-in' once a week to acknowledge your feelings",
          "Create an emergency fund of just $500 first—small wins build confidence",
          "Use the '24-hour rule' for purchases over $100 to reduce impulse stress"
        ]
      };
    } else if (message1.includes('confused') || message1.includes('complicated') || message1.includes('lost') || message1.includes('don\'t know')) {
      emotionalArchetype = {
        category: "🧠 Your Money Mindset", 
        title: "🗺️ The Authentic Explorer",
        description: "Your confusion isn't weakness—it's honesty. You're not pretending to have it all figured out, which means you're open to learning and growing.",
        deepInsight: "The fact that you admit confusion shows emotional intelligence that many 'confident' people lack.",
        actionItems: [
          "Start tracking just one thing: where your money goes each week",
          "Read one personal finance article per week—build knowledge slowly",
          "Find one person whose financial approach you admire and ask them questions"
        ]
      };
    } else if (message1.includes('good') || message1.includes('fine') || message1.includes('stable') || message1.includes('confident')) {
      emotionalArchetype = {
        category: "🧠 Your Money Mindset",
        title: "🎯 The Grounded Optimist", 
        description: "Your financial confidence is rare and valuable. You've likely developed healthy money habits that serve as a foundation for bigger goals.",
        deepInsight: "Your stability gives you the freedom to take calculated risks that others can't afford.",
        actionItems: [
          "Consider increasing your investing rate by 1-2% since you have a solid foundation",
          "Explore higher-yield opportunities like index funds or real estate",
          "Use your confidence to help others—teaching reinforces your own knowledge"
        ]
      };
    } else {
      emotionalArchetype = {
        category: "🧠 Your Money Mindset",
        title: "⚡ The Reflective Realist",
        description: "Your nuanced relationship with money shows emotional maturity. You understand that finances are personal and complex.",
        deepInsight: "Your ability to see money's complexity will help you make more thoughtful decisions than people who oversimplify.",
        actionItems: [
          "Trust your instincts—they're more sophisticated than generic advice",
          "Create a personal mission statement for your money",
          "Focus on systems that align with your values rather than chasing returns"
        ]
      };
    }
    
    insights.push(emotionalArchetype);
    
    // Analyze decision-making patterns from good/bad decision responses
    const decisionPatterns = analyzeDecisionPatterns(allText);
    if (decisionPatterns) insights.push(decisionPatterns);
    
    // Analyze barriers and motivations
    const barrierAnalysis = analyzeBarriers(allText);
    if (barrierAnalysis) insights.push(barrierAnalysis);
    
    // Analyze family influences if mentioned
    const familyInfluence = analyzeFamilyInfluence(allText);
    if (familyInfluence) insights.push(familyInfluence);
    
    // Generate overall financial archetype
    const archetype = getAdvancedFinancialArchetype(allText, responses);
    insights.push(archetype);
    
    return insights;
  };
  
  // Analyze decision-making patterns
  const analyzeDecisionPatterns = (text) => {
    if (text.includes('research') || text.includes('plan') || text.includes('compare') || text.includes('think')) {
      return {
        category: "💡 Your Decision Style",
        title: "🔍 The Methodical Analyst",
        description: "You naturally research and analyze before making money moves. This careful approach protects you from costly mistakes.",
        deepInsight: "Your tendency to overthink might sometimes prevent you from taking action when you should.",
        actionItems: [
          "Set decision deadlines—give yourself 1 week max for purchases under $1000",
          "Create a simple decision framework with 3 key criteria",
          "Remember: a good decision made quickly often beats a perfect decision made too late"
        ]
      };
    } else if (text.includes('gut') || text.includes('feeling') || text.includes('intuition') || text.includes('instant')) {
      return {
        category: "💡 Your Decision Style", 
        title: "⚡ The Intuitive Mover",
        description: "You trust your instincts and make decisions quickly. This confidence allows you to seize opportunities others miss.",
        deepInsight: "Your quick decision-making is a strength, but adding just a little analysis could improve your hit rate.",
        actionItems: [
          "Keep trusting your gut—it's gotten you this far", 
          "Add a simple 'sleep on it' rule for decisions over $500",
          "Track your intuitive decisions to see patterns in what works vs. what doesn't"
        ]
      };
    }
    return null;
  };
  
  // Analyze barriers and limitations
  const analyzeBarriers = (text) => {
    if (text.includes('time') || text.includes('busy') || text.includes('overwhelm')) {
      return {
        category: "🚧 Your Key Challenge",
        title: "⏰ The Time Crunch",
        description: "You know what you should do with money, but finding time to actually do it feels impossible.",
        deepInsight: "The 'I don't have time' barrier often masks fear or confusion about where to start.",
        actionItems: [
          "Automate everything possible—savings, investments, bill payments",
          "Batch money tasks: do everything financial on Sunday mornings",
          "Use apps that require less than 5 minutes: Mint, YNAB, or your bank's app"
        ]
      };
    } else if (text.includes('knowledge') || text.includes('understand') || text.includes('learn') || text.includes('complicated')) {
      return {
        category: "🚧 Your Key Challenge",
        title: "📚 The Knowledge Gap",
        description: "You're smart enough to know you don't know everything about money, which actually puts you ahead of most people.",
        deepInsight: "Analysis paralysis often comes from trying to learn everything before taking any action.",
        actionItems: [
          "Start with basics: emergency fund, then employer 401k match, then index funds",
          "Learn while doing—start investing $50/month while you read about investing",
          "Focus on principles over tactics—Warren Buffett's advice beats day trading tips"
        ]
      };
    }
    return null;
  };
  
  // Analyze family and background influences
  const analyzeFamilyInfluence = (text) => {
    if (text.includes('family') || text.includes('parents') || text.includes('grew up') || text.includes('childhood')) {
      let title = "👨‍👩‍👧‍👦 Your Money Story";
      let description = "Your family's approach to money has shaped your relationship with finances in ways you might not even realize.";
      let insight = "";
      let actions = [];
      
      if (text.includes('strict') || text.includes('careful') || text.includes('save')) {
        title = "💪 The Saver's Legacy";
        description = "You learned the value of saving and being careful with money from your family. This foundation serves you well.";
        insight = "Your conservative approach might be holding you back from wealth-building opportunities.";
        actions = [
          "Honor your family's wisdom while updating it for today's economy",
          "Consider that 'risky' investing might actually be riskier than not investing due to inflation",
          "Start small with investing—your family's discipline will serve you well"
        ];
      } else if (text.includes('stress') || text.includes('fight') || text.includes('struggle') || text.includes('tight')) {
        title = "🌱 The Resilience Builder";
        description = "Growing up around money stress taught you resourcefulness and the real value of financial security.";
        insight = "Your fear of financial instability, while protective, might be preventing you from taking growth opportunities.";
        actions = [
          "Recognize that your money fears come from a place of protection, not weakness",
          "Build confidence with small wins—save $1000, then $5000, then invest",
          "Create multiple income streams to feel more secure"
        ];
      } else {
        title = "🎯 The Independent Thinker";
        description = "You're creating your own relationship with money, separate from your family's approach.";
        insight = "Your independence is powerful, but don't be afraid to learn from others' experiences.";
        actions = [
          "Define what financial success means to YOU, not your family or society",
          "Take the best from your family's approach and leave the rest",
          "Find mentors who have the financial life you want"
        ];
      }
      
      return {
        category: "🏠 Your Origins",
        title,
        description,
        deepInsight: insight,
        actionItems: actions
      };
    }
    return null;
  };
  
  // Advanced financial archetype based on conversation
  const getAdvancedFinancialArchetype = (text, responses) => {
    // Analyze multiple dimensions
    const isSecurityFocused = text.includes('security') || text.includes('safe') || text.includes('stable') || text.includes('emergency');
    const isGrowthFocused = text.includes('grow') || text.includes('invest') || text.includes('build') || text.includes('future');
    const isExperienceFocused = text.includes('travel') || text.includes('experience') || text.includes('enjoy') || text.includes('memories');
    const isFreedomFocused = text.includes('freedom') || text.includes('independent') || text.includes('choice') || text.includes('control');
    
    if (isFreedomFocused && isGrowthFocused) {
      return {
        category: "🎯 Your Financial Archetype",
        title: "🚀 The Freedom Builder",
        description: "You see money as the key to personal freedom and choices. You're willing to sacrifice now for independence later.",
        deepInsight: "Your drive for freedom might make you too focused on the future—remember to enjoy the journey.",
        actionItems: [
          "Set up automatic investing so freedom building happens without constant decisions",
          "Calculate your 'freedom number'—the amount that would make you financially independent",
          "Create a 'freedom fund' separate from emergency savings for opportunities"
        ]
      };
    } else if (isExperienceFocused) {
      return {
        category: "🎯 Your Financial Archetype", 
        title: "✨ The Life Maximizer",
        description: "You understand that money is meant to be used to create meaningful experiences and memories.",
        deepInsight: "Your focus on experiences is wise, but don't neglect your future self who will also want choices.",
        actionItems: [
          "Use the 50/30/20 rule: 50% needs, 30% experiences, 20% future",
          "Create an 'experience fund' that makes spending on memories guilt-free",
          "Consider experiences that also build wealth: travel while working remotely, etc."
        ]
      };
    } else if (isSecurityFocused) {
      return getFinancialArchetype(text); // Use existing logic for security-focused
    } else {
      return {
        category: "🎯 Your Financial Archetype",
        title: "🎨 The Balanced Creator", 
        description: "You're creating a unique approach to money that balances security, growth, and enjoyment based on your values.",
        deepInsight: "Your balanced approach is sophisticated—trust the process as you find what works for you.",
        actionItems: [
          "Continue experimenting with different approaches until you find your sweet spot",
          "Track what gives you the most satisfaction per dollar spent", 
          "Don't let others' financial goals pressure you into their strategies"
        ]
      };
    }
  };

  // Financial data parsing function
  const parseFinancialData = (text, messageCount) => {
    const lowerText = text.toLowerCase();
    let updates = {};
    
    // Parse income mentions
    const incomeRegex = /(?:make|earn|income|salary)(?:\s+(?:about|around|roughly))?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand|per year|annually|year|monthly|month|per month)?/gi;
    let match = incomeRegex.exec(lowerText);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      if (lowerText.includes('k') || lowerText.includes('thousand')) amount *= 1000;
      if (lowerText.includes('month') && !lowerText.includes('year')) amount *= 12;
      updates.currentIncome = amount;
    }
    
    // Parse expenses mentions
    const expenseRegex = /(?:spend|expenses|cost|pay)(?:\s+(?:about|around|roughly))?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand|per month|monthly|month|year|annually)?/gi;
    match = expenseRegex.exec(lowerText);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      if (lowerText.includes('k') || lowerText.includes('thousand')) amount *= 1000;
      if (lowerText.includes('year') && !lowerText.includes('month')) amount /= 12;
      updates.monthlyExpenses = amount;
    }
    
    // Parse debt mentions
    const debtRegex = /(?:debt|owe|loan|borrowed)(?:\s+(?:about|around|roughly))?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand)?/gi;
    match = debtRegex.exec(lowerText);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      if (lowerText.includes('k') || lowerText.includes('thousand')) amount *= 1000;
      
      // Categorize debt type
      if (lowerText.includes('student') || lowerText.includes('college') || lowerText.includes('school')) {
        updates['debt.student'] = amount;
      } else if (lowerText.includes('credit') || lowerText.includes('card')) {
        updates['debt.credit'] = amount;
      } else if (lowerText.includes('car') || lowerText.includes('auto') || lowerText.includes('vehicle')) {
        updates['debt.car'] = amount;
      } else if (lowerText.includes('mortgage') || lowerText.includes('house') || lowerText.includes('home')) {
        updates['debt.mortgage'] = amount;
      } else {
        updates['debt.other'] = amount;
      }
    }
    
    // Parse savings mentions
    const savingsRegex = /(?:saved|savings|save|emergency fund|nest egg)(?:\s+(?:about|around|roughly))?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|thousand)?/gi;
    match = savingsRegex.exec(lowerText);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      if (lowerText.includes('k') || lowerText.includes('thousand')) amount *= 1000;
      if (lowerText.includes('emergency')) {
        updates.emergencyFund = amount;
      } else {
        updates.currentSavings = amount;
      }
    }
    
    // Parse age mentions
    const ageRegex = /(?:i'm|i am|age|years old)(?:\s+)(\d+)/gi;
    match = ageRegex.exec(lowerText);
    if (match) {
      updates.age = parseInt(match[1]);
    }
    
    // Parse family status
    if (lowerText.includes('married') || lowerText.includes('spouse') || lowerText.includes('husband') || lowerText.includes('wife')) {
      updates.familyStatus = 'married';
    } else if (lowerText.includes('single') || lowerText.includes('alone') || lowerText.includes('by myself')) {
      updates.familyStatus = 'single';
    }
    
    // Parse financial goals
    if (lowerText.includes('buy a house') || lowerText.includes('home') || lowerText.includes('mortgage')) {
      updates['financialGoals.buyHome'] = true;
    }
    if (lowerText.includes('travel') || lowerText.includes('vacation') || lowerText.includes('trip')) {
      updates['financialGoals.travel'] = true;
    }
    if (lowerText.includes('retire early') || lowerText.includes('early retirement')) {
      updates['financialGoals.earlyRetirement'] = true;
    }
    if (lowerText.includes('business') || lowerText.includes('start my own') || lowerText.includes('entrepreneur')) {
      updates['financialGoals.startBusiness'] = true;
    }
    if (lowerText.includes('pay off debt') || lowerText.includes('debt free') || lowerText.includes('pay down')) {
      updates['financialGoals.payOffDebt'] = true;
    }
    
    return updates;
  };
  
  // Calculate comprehensive financial metrics
  const calculateFinancialMetrics = (profile) => {
    const monthlyIncome = profile.currentIncome / 12;
    const totalDebt = Object.values(profile.debt || {}).reduce((sum, debt) => sum + (debt || 0), 0);
    const debtToIncomeRatio = totalDebt / profile.currentIncome;
    const monthlyDebtPayment = profile.monthlyDebtPayment || (totalDebt * 0.02); // Assume 2% minimum
    const emergencyFundMonths = profile.emergencyFund / profile.monthlyExpenses;
    const monthlyBalance = monthlyIncome - profile.monthlyExpenses - monthlyDebtPayment;
    const savingsRate = monthlyBalance / monthlyIncome;
    
    return {
      monthlyIncome: Math.round(monthlyIncome),
      totalDebt: Math.round(totalDebt),
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100,
      monthlyDebtPayment: Math.round(monthlyDebtPayment),
      emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
      monthlyBalance: Math.round(monthlyBalance),
      savingsRate: Math.round(savingsRate * 100),
      netWorth: Math.round((profile.currentSavings + profile.investments + profile.retirement401k) - totalDebt)
    };
  };
  
  // Generate personalized insights based on actual financial data
  const generatePersonalizedInsights = (responses, allText, profile, metrics) => {
    const insights = [];
    
    // Financial Health Assessment
    insights.push({
      category: "💰 Your Financial Health",
      title: `Net Worth: $${metrics.netWorth.toLocaleString()}`,
      description: `Based on your conversation, here's your current financial snapshot.`,
      deepInsight: `Your debt-to-income ratio is ${(metrics.debtToIncomeRatio * 100).toFixed(1)}% ${metrics.debtToIncomeRatio > 0.36 ? '(consider reducing debt)' : '(healthy level)'}. Emergency fund covers ${metrics.emergencyFundMonths} months of expenses ${metrics.emergencyFundMonths < 3 ? '(build to 3-6 months)' : '(good coverage)'}.`,
      actionItems: [
        `Monthly surplus: $${metrics.monthlyBalance} - ${metrics.monthlyBalance > 0 ? 'allocate to savings/investments' : 'reduce expenses or increase income'}`,
        `Emergency fund goal: $${Math.round(profile.monthlyExpenses * 6)} (${metrics.emergencyFundMonths < 6 ? `need $${Math.round((6 - metrics.emergencyFundMonths) * profile.monthlyExpenses)} more)` : 'fully funded!'}`
      ]
    });
    
    // Debt Analysis
    if (metrics.totalDebt > 0) {
      const payoffTime = Math.ceil(metrics.totalDebt / metrics.monthlyDebtPayment / 12);
      insights.push({
        category: "🎯 Debt Strategy",
        title: `Total Debt: $${metrics.totalDebt.toLocaleString()}`,
        description: `At current payments of $${metrics.monthlyDebtPayment}/month, you'll be debt-free in ${payoffTime} years.`,
        deepInsight: `Increasing payments by just $100/month could save you ${Math.round(payoffTime * 0.2)} years and thousands in interest.`,
        actionItems: [
          `Consider debt avalanche: pay minimums on all debts, extra on highest interest rate`,
          `If you paid $${metrics.monthlyDebtPayment + 200}/month instead, you'd save approximately $${Math.round(metrics.totalDebt * 0.15)} in interest`,
          `Focus on credit card debt first (typically 18-25% interest vs 3-7% for student loans)`
        ]
      });
    }
    
    // Savings & Investment Recommendations
    const recommendedSavingsRate = 20;
    const currentSavingsRate = metrics.savingsRate;
    insights.push({
      category: "📈 Wealth Building",
      title: `Savings Rate: ${currentSavingsRate}%`,
      description: `You're currently saving ${currentSavingsRate}% of income. Target is ${recommendedSavingsRate}% for financial independence.`,
      deepInsight: `At your current rate, you'll have $${Math.round(metrics.monthlyBalance * 12 * 10 * 1.07).toLocaleString()} in 10 years (7% growth). Reaching 20% savings rate would give you $${Math.round(profile.currentIncome * 0.2 * 10 * 1.07).toLocaleString()}.`,
      actionItems: [
        `Automate $${Math.round((recommendedSavingsRate - currentSavingsRate) * profile.currentIncome / 100 / 12)}/month to reach 20% savings rate`,
        `Max out 401k match first (free money), then Roth IRA ($6,500/year limit)`,
        `Consider low-cost index funds: VTI (total market) or VOO (S&P 500) with 0.03% fees`
      ]
    });
    
    // Personalized goals based on conversation
    if (profile.financialGoals.buyHome) {
      const homePrice = profile.currentIncome * 3; // Conservative estimate
      const downPayment = homePrice * 0.2;
      const monthsToSave = Math.ceil(downPayment / metrics.monthlyBalance);
      insights.push({
        category: "🏠 Home Buying Plan",
        title: `Target Home: $${homePrice.toLocaleString()}`,
        description: `Based on your income, a $${homePrice.toLocaleString()} home is realistic (3x income rule).`,
        deepInsight: `You'll need $${downPayment.toLocaleString()} for 20% down payment. At current savings rate, that's ${Math.round(monthsToSave/12)} years.`,
        actionItems: [
          `Save $${Math.round(downPayment / (monthsToSave > 36 ? 36 : monthsToSave))}/month for ${monthsToSave > 36 ? 3 : Math.round(monthsToSave/12)} years`,
          `Keep down payment in high-yield savings (currently ~5% APY)`,
          `Get pre-approved to understand exact budget and improve credit score if needed`
        ]
      });
    }
    
    // Analyze conversation for emotional insights
    const emotionalInsight = analyzeEmotionalPatterns(allText, responses);
    if (emotionalInsight) insights.push(emotionalInsight);
    
    return insights;
  };
  
  // Analyze emotional patterns for personalized coaching
  const analyzeEmotionalPatterns = (text, responses) => {
    const firstResponse = responses.message_1?.toLowerCase() || '';
    
    if (firstResponse.includes('stress') || firstResponse.includes('anxiety') || firstResponse.includes('overwhelm')) {
      return {
        category: "🧠 Money Psychology",
        title: "Managing Financial Anxiety",
        description: "You mentioned feeling stressed about money. This is completely normal and shows you care about your financial future.",
        deepInsight: "Financial anxiety often decreases as you gain control and clarity. Having concrete numbers and a plan can reduce the unknown that creates stress.",
        actionItems: [
          "Schedule weekly 'money dates' - 30 minutes to review progress and feel in control",
          "Use the 'worst case scenario' exercise: what would you do if income dropped 20%?",
          "Celebrate small wins: every $500 saved, every month of expenses covered by emergency fund"
        ]
      };
    } else if (firstResponse.includes('excited') || firstResponse.includes('hopeful') || firstResponse.includes('motivated')) {
      return {
        category: "🚀 Momentum Building",
        title: "Channeling Your Financial Energy",
        description: "Your positive attitude toward money is a huge asset. Let's turn that energy into sustainable habits.",
        deepInsight: "Motivation gets you started, but systems keep you going. Your enthusiasm can fuel the creation of automated financial systems.",
        actionItems: [
          "Set up automatic transfers the day after payday (pay yourself first)",
          "Use apps like Mint or YNAB to track progress visually",
          "Join financial independence communities (Reddit FIRE, Facebook groups) for continued motivation"
        ]
      };
    }
    
    return null;
  };

  const generateLifestyleAnalysis = () => {
    const responses = conversationResponses;
    const allResponsesText = Object.values(responses).filter(Boolean).join(' ').toLowerCase();
    
    console.log('🔍 Generating insights with responses:', responses);
    console.log('🔍 All text:', allResponsesText);
    
    // Parse financial data from all responses
    let parsedData = {};
    Object.values(responses).forEach((response, index) => {
      if (response) {
        const data = parseFinancialData(response, index + 1);
        parsedData = { ...parsedData, ...data };
      }
    });
    
    // Calculate comprehensive financial metrics
    const metrics = calculateFinancialMetrics(financialProfile);
    
    // Generate data-driven insights
    const insights = generatePersonalizedInsights(responses, allResponsesText, financialProfile, metrics);
    console.log('🔍 Generated personalized insights:', insights);
    
    // Use insights or fallback
    let finalInsights;
    if (insights && insights.length > 0) {
      finalInsights = insights;
      setPersonalizedInsights(insights);
      console.log('✅ Personalized insights set successfully');
    } else {
      console.error('❌ No insights generated, using fallback');
      // Fallback insights if analysis fails
      finalInsights = [{
        category: "🧠 Your Money Mindset",
        title: "📝 The Thoughtful Responder",
        description: "You've shared valuable insights about your relationship with money. Your responses show genuine self-reflection and awareness.",
        deepInsight: "Your willingness to engage in this conversation shows you're ready to make positive changes in your financial life.",
        actionItems: [
          "Continue this self-reflection by reviewing your responses",
          "Identify 1-2 key patterns you noticed about yourself",
          "Set a small, achievable financial goal based on what you learned"
        ]
      }];
      setPersonalizedInsights(finalInsights);
    }
    
    setFinancialProfile(prev => ({
      ...prev,
      lifeValues: {
        coreMotivations: ['Personal Growth'],
        personalityType: 'Balanced Explorer',
        financialArchetype: finalInsights.find(i => i.category.includes('Archetype'))?.title || 'The Balanced Seeker',
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
    const metrics = calculateFinancialMetrics(financialProfile);
    
    // Calculate real financial projections
    const monthlyBalance = metrics.monthlyBalance;
    const yearlyBalance = monthlyBalance * 12;
    const tenYearInvested = yearlyBalance * 10 * 1.07; // Assuming 7% annual return
    const twentyYearInvested = yearlyBalance * 20 * 1.07;
    
    // Emergency fund progress
    const emergencyFundGoal = financialProfile.monthlyExpenses * 6;
    const emergencyFundProgress = (financialProfile.emergencyFund / emergencyFundGoal) * 100;
    
    // Debt payoff timeline
    const debtPayoffYears = metrics.totalDebt > 0 ? Math.ceil(metrics.totalDebt / metrics.monthlyDebtPayment / 12) : 0;
    
    return {
      monthlyBalance,
      yearlyBalance,
      tenYearInvested,
      twentyYearInvested,
      emergencyFundProgress: Math.min(emergencyFundProgress, 100),
      emergencyFundGoal,
      currentEmergencyFund: financialProfile.emergencyFund,
      debtPayoffYears,
      netWorth: metrics.netWorth,
      savingsRate: metrics.savingsRate,
      debtToIncomeRatio: metrics.debtToIncomeRatio,
      totalDebt: metrics.totalDebt,
      monthlyIncome: metrics.monthlyIncome
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
          <div className="inline-flex items-center px-6 py-3 rounded-lg bg-white/90 text-gray-900 border mb-8">
            <span className="text-lg font-medium">AI Financial Therapy Platform</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8">
            <span className="block text-white">
              Feel better about
            </span>
            <span className="block text-white/80">
              your money
            </span>
          </h1>

          <p className="text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            AI-powered financial therapy through <span className="text-white font-semibold">natural conversation</span>.
            Understand your money patterns and build a healthier financial future.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto mb-12 border border-white/20">
            <p className="text-lg text-white/90 leading-relaxed">
              <span className="font-semibold">Talk naturally.</span> Get personalized insights.
              <br/>Transform your relationship with money through intelligent conversation.
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('conversation')}
            className="group relative px-12 py-4 bg-white text-gray-900 rounded-lg font-semibold text-xl hover:bg-white/90 transform hover:scale-105 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-3">
              <span>Start Conversation</span>
              <span>→</span>
            </span>
          </button>
        </div>

        {/* Step-by-Step Journey */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-xl text-white/80">Simple, professional, effective</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 transform -translate-x-1/2 hidden md:block"></div>
              
              <div className="space-y-12">
                {[
                  {
                    step: 1,
                    title: "Start Your Conversation",
                    description: "Click the button and start talking naturally. I'll ask thoughtful questions about your relationship with money - no judgment, just understanding.",
                    duration: "5 minutes"
                  },
                  {
                    step: 2,
                    title: "Analysis & Insights",
                    description: "While we talk, I'm identifying your financial personality, money beliefs, and spending patterns. I discover what makes you feel secure vs. anxious about money.",
                    duration: "Real-time"
                  },
                  {
                    step: 3,
                    title: "Personal Report",
                    description: "Receive deep insights about your financial psychology, personalized recommendations, and see how small changes could impact your future wealth.",
                    duration: "Instant"
                  },
                  {
                    step: 4,
                    title: "Take Action",
                    description: "Use our What-If scenarios, learn from our finance guides, track your progress, and build the financial life you want with confidence.",
                    duration: "Ongoing"
                  }
                ].map((item, index) => (
                  <div key={index} className="relative flex items-center">
                    {/* Step indicator */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-gray-900 text-sm z-10 hidden md:flex">
                      {item.step}
                    </div>
                    
                    {/* Content */}
                    <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8 md:ml-auto'}`}>
                      <div className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 ${index % 2 === 0 ? 'md:text-right' : ''}`}>
                        <div className={`flex items-center gap-3 mb-4 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                          <div className="md:hidden w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-900 text-sm">
                            {item.step}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                        <p className="text-white/80 mb-3">{item.description}</p>
                        <div className="inline-flex items-center px-3 py-1 rounded bg-white/20 text-white text-sm font-medium">
                          {item.duration}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Voice Conversation", 
              desc: "Talk naturally - I'll listen and respond with my voice too"
            },
            {
              title: "Personalized Insights",
              desc: "See the real financial impact of your daily choices"
            },
            {
              title: "Your Money Story",
              desc: "Understand your relationship with money - no judgment"
            }
          ].map((item, i) => (
            <div key={i} className="group bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
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
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Financial Therapy Session
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
                  <option value="nova" className="bg-black text-white">Nova (Warm)</option>
                  <option value="alloy" className="bg-black text-white">Alloy (Neutral)</option>
                  <option value="echo" className="bg-black text-white">Echo (Clear)</option>
                  <option value="fable" className="bg-black text-white">Fable (Expressive)</option>
                  <option value="onyx" className="bg-black text-white">Onyx (Deep)</option>
                  <option value="shimmer" className="bg-black text-white">Shimmer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side: Input Controls */}
            <div className="bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Your Response</h2>
              
              {/* Voice Controls */}
              <div className="mb-8">
                <div className="text-center mb-4">
                  <div className="text-white/80 font-medium mb-2">🎤 Voice Option</div>
                  <div className="text-white/60 text-sm">Click to record your response</div>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  {speechRecognition ? (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-24 h-24 rounded-full transition-all duration-300 flex flex-col items-center justify-center text-white font-bold text-sm shadow-2xl transform hover:scale-105 ${
                        isRecording 
                          ? 'bg-gradient-to-br from-orange-600 to-yellow-600 animate-pulse shadow-orange-500/50 border-4 border-orange-300' 
                          : 'bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 shadow-orange-500/30'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <div className="text-2xl mb-1">⏹️</div>
                          <div className="text-xs">Stop</div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl mb-1">🎤</div>
                          <div className="text-xs">Record</div>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-black/80 border-2 border-white/30 flex flex-col items-center justify-center text-white/70">
                      <div className="text-2xl mb-1">🚫</div>
                      <div className="text-xs text-center">No Voice</div>
                    </div>
                  )}
                  
                  <div className="text-center text-sm">
                    {isRecording ? (
                      <div className="text-orange-400 font-medium">🎤 Listening...</div>
                    ) : speechRecognition ? (
                      <div className="text-white/80">Ready to record</div>
                    ) : (
                      <div className="text-white/70">Voice not supported</div>
                    )}
                  </div>
                </div>
                
                {/* Voice Settings */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <button 
                      onClick={toggleVoice}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        voiceEnabled 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {voiceEnabled ? '🔊 On' : '🔇 Off'}
                    </button>
                  </div>
                  
                  <div className="inline-flex items-center bg-black/80 rounded-full border border-white/20">
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="bg-transparent text-white text-xs px-3 py-1 rounded-full focus:outline-none focus:border-orange-400 appearance-none cursor-pointer"
                      style={{minWidth: '120px'}}
                    >
                      <option value="nova" className="bg-black text-white">Nova (Warm)</option>
                      <option value="alloy" className="bg-black text-white">Alloy (Neutral)</option>
                      <option value="echo" className="bg-black text-white">Echo (Clear)</option>
                      <option value="fable" className="bg-black text-white">Fable (Expressive)</option>
                      <option value="onyx" className="bg-black text-white">Onyx (Deep)</option>
                      <option value="shimmer" className="bg-black text-white">Shimmer (Upbeat)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/20 my-8"></div>

              {/* Text Input */}
              <div>
                <div className="text-center mb-4">
                  <div className="text-white/80 font-medium mb-2">💬 Text Option</div>
                  <div className="text-white/60 text-sm">Type your response instead</div>
                </div>
                
                <div className="space-y-3">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your response here... (Press Enter to send)"
                    className="w-full bg-black/80 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 min-h-[100px] max-h-[200px]"
                    rows="4"
                    disabled={isRecording}
                  />
                  
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || isRecording}
                    className="w-full bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {isRecording ? '📢 Voice Active' : '💬 Send Message'}
                  </button>
                  
                  {chatInput && !isRecording && (
                    <div className="text-center text-white/60 text-xs">
                      Press Enter to send, or Shift+Enter for new line
                    </div>
                  )}
                </div>
              </div>
              
              {/* Live Transcript Preview */}
              {chatInput && isRecording && (
                <div className="mt-4 bg-orange-900/30 backdrop-blur-sm rounded-xl p-3 border border-orange-700/30">
                  <div className="text-orange-300 text-xs font-medium mb-1">🎤 Live transcript:</div>
                  <div className="text-white text-sm italic">"{chatInput}"</div>
                </div>
              )}
            </div>

            {/* Right Side: Chat Messages */}
            <div className="bg-black/60 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Conversation</h2>
              
              <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm px-4 py-3 rounded-2xl ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white' 
                        : 'bg-white/10 text-white border border-white/20'
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
                      <div className="text-sm leading-relaxed">{msg.message}</div>
                      <div className="text-xs opacity-70 mt-2">
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {chatMessages.length === 0 && (
                <div className="text-center text-white/50 mt-12">
                  <div className="text-4xl mb-4">💭</div>
                  <div>Your conversation will appear here</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Conversation Results Page
  const renderConversationResults = () => {
    const impact = calculateFinancialImpact();
    
    console.log('🔍 Report rendering - personalizedInsights:', personalizedInsights);
    console.log('🔍 Report rendering - conversationResponses:', conversationResponses);
    
    // Always ensure we have at least basic insights
    const insights = personalizedInsights && personalizedInsights.length > 0 ? personalizedInsights : [
      {
        category: "Your Conversation Summary",
        title: "Thank You for Sharing",
        description: "You completed our financial therapy session and shared valuable insights about your relationship with money.",
        deepInsight: "Every conversation about money is a step toward better financial wellness.",
        actionItems: [
          "Reflect on the questions you answered today",
          "Identify one pattern you noticed about your money habits",
          "Set a small financial goal for the week ahead"
        ]
      }
    ];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
        <div className="max-w-4xl mx-auto p-6 text-white">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Your Financial Therapy Results
          </h1>
          <p className="text-xl text-white/80">
            Here's what your lifestyle choices reveal about your financial future
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-2xl font-bold text-white">Personal Analysis</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-white font-medium mb-2">How You Feel About Money:</div>
                <div className="text-white/80 italic">"{conversationResponses.message_1 || 'Your honest feelings about your financial situation'}"</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-white font-medium mb-2">What Brings You Joy:</div>
                <div className="text-white/80 italic">"{conversationResponses.message_2 || 'Decisions that made you feel good'}"</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-white font-medium mb-2">Your Goals:</div>
                <div className="text-white/80 italic text-sm">"{conversationResponses.message_3 || 'What you want to change about your financial life'}"</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-2xl font-bold text-white">Financial Impact</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">${impact.monthlyWaste}</div>
                <div className="text-white/80 text-sm">Monthly redirectable spending</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">${impact.yearlyWaste.toLocaleString()}</div>
                <div className="text-white/80 text-sm">Yearly opportunity</div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">${impact.tenYearInvested.toLocaleString()}</div>
                <div className="text-white/80 text-sm">If invested for 10 years at 7% return</div>
              </div>
            </div>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Your Personal Insights
              </h2>
              <p className="text-white/80">Deep insights into your financial personality and patterns</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20"
                >
                  <div className="mb-6">
                    <div className="text-sm text-white/60 font-medium mb-2">{insight.category}</div>
                    <h3 className="text-2xl font-bold text-white mb-4">{insight.title}</h3>
                    <p className="text-white/80 leading-relaxed mb-4">{insight.description}</p>
                    
                    {insight.deepInsight && (
                      <div className="bg-white/10 rounded-lg p-4 mb-4 border border-white/20">
                        <div className="text-white font-medium mb-2 text-sm">Key Insight:</div>
                        <p className="text-white/80 text-sm">{insight.deepInsight}</p>
                      </div>
                    )}
                  </div>

                  {insight.actionItems && insight.actionItems.length > 0 && (
                    <div>
                      <div className="text-white font-medium mb-3">Next Steps:</div>
                      <div className="space-y-2">
                        {insight.actionItems.map((action, actionIndex) => (
                          <div
                            key={actionIndex}
                            className="flex items-start gap-3 text-sm text-white/80 bg-white/10 rounded-lg p-3"
                          >
                            <div className="text-white mt-0.5">•</div>
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

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 mb-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Key Realization</h3>
          <p className="text-lg text-white/80 leading-relaxed">
            You're not broke. You're not behind. You just need to <span className="text-white font-semibold">redirect money you're already spending</span> from things that don't bring joy to things that build your future. The money is there - it's just going to the wrong places.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center">
          <h3 className="text-2xl font-bold text-white mb-6">Your Next Steps</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h4 className="font-bold text-white mb-2">Track for 1 Week</h4>
              <p className="text-sm text-white/80">Notice what brings joy vs what you regret</p>
            </div>

            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h4 className="font-bold text-white mb-2">Cut One Thing</h4>
              <p className="text-sm text-white/80">Cancel one subscription or habit that doesn't spark joy</p>
            </div>

            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <h4 className="font-bold text-white mb-2">Redirect</h4>
              <p className="text-sm text-white/80">Put that money toward your goal automatically</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setCurrentPage('profile')}
              className="bg-white text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/90 transform hover:scale-105 transition-all"
            >
              Set Up Your Profile
            </button>
            
            <button
              onClick={() => {
                setCurrentPage('landing');
                setChatMessages([]);
                setConversationResponses({});
                setCurrentConversationStep('intro');
                setShowConversationResults(false);
              }}
              className="bg-white/20 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/30 transform hover:scale-105 transition-all border border-white/20"
            >
              Start Fresh Session
            </button>
          </div>
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

  // Learn Content Pages
  const renderLearnContent = () => {
    const topics = {
      investing: {
        title: "Investment Basics",
        subtitle: "Your Guide to Growing Wealth",
        content: [
          {
            section: "What is Investing?",
            text: "Investing is putting your money to work to generate more money over time. Instead of letting your savings sit in a low-interest account, you can invest in assets that have the potential to grow in value."
          },
          {
            section: "Types of Investments",
            text: "Stocks represent ownership in companies. Bonds are loans to governments or corporations. Index funds spread your risk across many stocks. ETFs are like index funds but trade like stocks. Real estate can provide rental income and appreciation."
          },
          {
            section: "The Power of Compound Interest",
            text: "Albert Einstein allegedly called compound interest the eighth wonder of the world. When you invest $1,000 and earn 7% annually, you don't just earn $70 each year forever. In year two, you earn 7% on $1,070, then 7% on $1,144.90, and so on. Over 30 years, that $1,000 becomes over $7,600."
          },
          {
            section: "Getting Started",
            text: "Start with low-cost index funds through apps like Vanguard, Fidelity, or Charles Schwab. Many have no minimum investment. Consider target-date funds that automatically adjust as you age. The most important step is starting - even $25/month can grow significantly over time."
          },
          {
            section: "Common Mistakes to Avoid",
            text: "Don't try to time the market - even experts can't predict short-term moves. Avoid putting all your money in one stock or sector. Don't panic sell during market downturns. Don't chase last year's hot investment. Stay consistent with regular contributions."
          }
        ]
      },
      budgeting: {
        title: "Budgeting 101",
        subtitle: "Creating a Budget That Actually Works",
        content: [
          {
            section: "Why Budgeting Matters",
            text: "A budget isn't about restriction - it's about giving every dollar a purpose before you spend it. It helps you avoid living paycheck to paycheck and creates space for both your needs and wants."
          },
          {
            section: "The 50/30/20 Rule",
            text: "Allocate 50% of after-tax income to needs (rent, groceries, utilities), 30% to wants (dining out, entertainment, hobbies), and 20% to savings and debt repayment. This is a starting point - adjust based on your situation."
          },
          {
            section: "Track Your Spending",
            text: "For one month, write down every expense. Use apps like Mint, YNAB, or simply a notes app. You'll be surprised where your money actually goes. Most people underestimate their spending by 20-30%."
          },
          {
            section: "Zero-Based Budgeting",
            text: "Give every dollar a job before the month begins. Income minus expenses should equal zero. If you have money left over, assign it to savings, debt payment, or a specific goal rather than letting it disappear into miscellaneous spending."
          },
          {
            section: "Making It Stick",
            text: "Automate savings and bill payments. Use cash or debit for discretionary spending to avoid overspending. Review and adjust monthly - your budget should evolve with your life. Celebrate small wins when you stick to your plan."
          }
        ]
      },
      emergency: {
        title: "Emergency Fund",
        subtitle: "Building Your Financial Safety Net",
        content: [
          {
            section: "Why You Need an Emergency Fund",
            text: "Life happens - car repairs, medical bills, job loss, home maintenance. Without an emergency fund, these unexpected expenses force you into debt or derail your financial progress. An emergency fund provides peace of mind and financial stability."
          },
          {
            section: "How Much to Save",
            text: "Start with $1,000 as your initial goal - this covers most minor emergencies. Then build toward 3-6 months of expenses. If you spend $3,000/month, aim for $9,000-$18,000. Self-employed or commission-based workers should lean toward 6 months or more."
          },
          {
            section: "Where to Keep It",
            text: "Keep your emergency fund in a high-yield savings account that's separate from your checking account. You want it easily accessible but not so convenient that you're tempted to use it for non-emergencies. Online banks typically offer better rates."
          },
          {
            section: "Building It Gradually",
            text: "Start small - even $25 per paycheck adds up. Use windfalls like tax refunds, bonuses, or gifts. Sell items you no longer need. Consider a side hustle temporarily to boost the fund faster. Automate transfers so it happens without thinking."
          },
          {
            section: "When to Use It",
            text: "True emergencies: job loss, major medical expenses, essential home/car repairs, unexpected travel for family emergencies. NOT for: vacations, shopping sales, routine maintenance you should have planned for, or investments."
          }
        ]
      }
    };

    const topic = topics[selectedLearnTopic];
    if (!topic) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setSelectedLearnTopic(null)}
              className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors mb-4"
            >
              ← Back to Learn Topics
            </button>
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                {topic.title}
              </h1>
              <p className="text-xl text-white/80">
                {topic.subtitle}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {topic.content.map((section, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">{section.section}</h2>
                <p className="text-white/80 leading-relaxed text-lg">{section.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Take Action?</h3>
            <p className="text-white/80 mb-6">Apply what you've learned with our personalized tools and planning features.</p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => {
                  setSelectedLearnTopic(null);
                  setCurrentPage('scenarios');
                }}
                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-white/90 transform hover:scale-105 transition-all"
              >
                Try What-If Scenarios
              </button>
              
              <button
                onClick={() => {
                  setSelectedLearnTopic(null);
                  setCurrentPage('conversation');
                }}
                className="bg-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transform hover:scale-105 transition-all border border-white/20"
              >
                Start Financial Therapy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Learn Page
  const renderLearnPage = () => {
    if (selectedLearnTopic) {
      return renderLearnContent();
    }

    return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-white">
            Financial Education
          </h1>
          <p className="text-xl text-white/80">
            Master your money with expert guidance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Investment Basics */}
          <div 
            onClick={() => setSelectedLearnTopic('investing')}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all cursor-pointer group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">Investment Basics</h3>
            <p className="text-white/70 mb-4">Learn the fundamentals of growing your wealth</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">5 min read</span>
              <span className="text-white/80 hover:text-white font-medium group-hover:translate-x-1 transition-transform">Start →</span>
            </div>
          </div>

          {/* Budgeting 101 */}
          <div 
            onClick={() => setSelectedLearnTopic('budgeting')}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all cursor-pointer group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">Budgeting 101</h3>
            <p className="text-white/70 mb-4">Create a budget that actually works for you</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">7 min read</span>
              <span className="text-white/80 hover:text-white font-medium group-hover:translate-x-1 transition-transform">Start →</span>
            </div>
          </div>

          {/* Emergency Fund */}
          <div 
            onClick={() => setSelectedLearnTopic('emergency')}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all cursor-pointer group"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">Emergency Fund</h3>
            <p className="text-white/70 mb-4">Build your financial safety net</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">4 min read</span>
              <span className="text-white/80 hover:text-white font-medium group-hover:translate-x-1 transition-transform">Start →</span>
            </div>
          </div>

          {/* Debt Management */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 opacity-60">
            <h3 className="text-xl font-bold text-white mb-2">Debt Management</h3>
            <p className="text-white/70 mb-4">Smart strategies to pay off debt faster</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Coming Soon</span>
              <span className="text-white/40 font-medium">Start →</span>
            </div>
          </div>

          {/* Retirement Planning */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 opacity-60">
            <h3 className="text-xl font-bold text-white mb-2">Retirement Planning</h3>
            <p className="text-white/70 mb-4">Secure your future with smart planning</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Coming Soon</span>
              <span className="text-white/40 font-medium">Start →</span>
            </div>
          </div>

          {/* Financial Psychology */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 opacity-60">
            <h3 className="text-xl font-bold text-white mb-2">Money Psychology</h3>
            <p className="text-white/70 mb-4">Understand your relationship with money</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Coming Soon</span>
              <span className="text-white/40 font-medium">Start →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

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
  // Scenario calculation functions
  const calculateMoveOutScenario = (inputs) => {
    const rent = parseFloat(inputs.rent) || 0;
    const utilities = parseFloat(inputs.utilities) || 150;
    const groceries = parseFloat(inputs.groceries) || 400;
    const transport = parseFloat(inputs.transport) || 200;
    const misc = parseFloat(inputs.misc) || 300;
    const income = parseFloat(inputs.income) || 0;
    
    const totalExpenses = rent + utilities + groceries + transport + misc;
    const leftover = income - totalExpenses;
    const affordability = (totalExpenses / income) * 100;
    
    return {
      totalExpenses,
      leftover,
      affordability,
      canAfford: affordability <= 70, // 70% rule
      recommendation: affordability <= 50 ? "Great choice! Very affordable." :
                     affordability <= 70 ? "Doable, but budget carefully." :
                     "Consider waiting or finding cheaper options."
    };
  };

  const renderScenariosPage = () => {
    if (selectedScenario) {
      return renderSelectedScenario();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              🤔 What If Scenarios
            </h1>
            <p className="text-xl text-white/80">
              Interactive calculators to explore life possibilities
            </p>
          </div>

          {/* Popular Scenarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div 
              onClick={() => setSelectedScenario('moveOut')}
              className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl p-6 border border-orange-700/30 hover:border-orange-500/50 transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-white mb-2">Can I Move Out?</h3>
              <p className="text-white/80 text-sm mb-4">Calculate if you can afford your own place based on rent, utilities, and lifestyle</p>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 text-sm">✓ Most Popular</span>
                <button className="text-orange-400 hover:text-orange-300">Try It →</button>
              </div>
            </div>

            <div 
              onClick={() => setSelectedScenario('buyCar')}
              className="bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-2xl p-6 border border-yellow-700/30 hover:border-yellow-500/50 transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-bold text-white mb-2">Should I Buy a Car?</h3>
              <p className="text-white/80 text-sm mb-4">Compare buying vs leasing vs rideshare for your specific situation</p>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 text-sm">⭐ Trending</span>
                <button className="text-yellow-400 hover:text-yellow-300">Try It →</button>
              </div>
            </div>

            <div 
              onClick={() => setSelectedScenario('vacation')}
              className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-2xl p-6 border border-orange-700/30 hover:border-orange-500/50 transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-bold text-white mb-2">Can I Afford This Trip?</h3>
              <p className="text-white/80 text-sm mb-4">Plan your dream vacation without breaking your budget</p>
              <div className="flex items-center justify-between">
                <span className="text-orange-400 text-sm">🔥 Hot</span>
                <button className="text-orange-400 hover:text-orange-300">Try It →</button>
              </div>
            </div>

            <div 
              onClick={() => setSelectedScenario('backToSchool')}
              className="bg-gradient-to-br from-orange-900/50 to-yellow-900/50 rounded-2xl p-6 border border-orange-700/30 hover:border-orange-500/50 transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-white mb-2">Should I Go Back to School?</h3>
              <p className="text-white/80 text-sm mb-4">ROI analysis of education vs current earning potential</p>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">💭 Life Changer</span>
                <button className="text-orange-400 hover:text-orange-300">Try It →</button>
              </div>
            </div>

            <div 
              onClick={() => setSelectedScenario('getMarried')}
              className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-2xl p-6 border border-yellow-700/30 hover:border-orange-500/50 transition-all cursor-pointer transform hover:scale-105"
            >
              <div className="text-4xl mb-4">💍</div>
              <h3 className="text-xl font-bold text-white mb-2">Can I Afford to Get Married?</h3>
              <p className="text-white/80 text-sm mb-4">Wedding costs, combined finances, and lifestyle changes</p>
              <div className="flex items-center justify-between">
                <span className="text-orange-400 text-sm">💕 Relationship</span>
                <button className="text-yellow-400 hover:text-yellow-300">Try It →</button>
              </div>
            </div>

            <div 
              onClick={() => setSelectedScenario('quitJob')}
              className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-2xl p-6 border border-yellow-700/30 hover:border-yellow-500/50 transition-all cursor-pointer transform hover:scale-105"
            >
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
  };

  // Render individual scenario calculator
  const renderSelectedScenario = () => {
    const scenarios = {
      moveOut: {
        title: "🏠 Can I Move Out?",
        description: "Calculate if you can afford your own place",
        inputs: [
          { key: 'income', label: 'Monthly Take-Home Income', type: 'number', placeholder: '3500' },
          { key: 'rent', label: 'Monthly Rent', type: 'number', placeholder: '1200' },
          { key: 'utilities', label: 'Utilities (Electric, Internet, etc.)', type: 'number', placeholder: '150' },
          { key: 'groceries', label: 'Groceries & Food', type: 'number', placeholder: '400' },
          { key: 'transport', label: 'Transportation', type: 'number', placeholder: '200' },
          { key: 'misc', label: 'Other Expenses (Entertainment, etc.)', type: 'number', placeholder: '300' }
        ]
      },
      vacation: {
        title: "✈️ Can I Afford This Trip?",
        description: "Plan your dream vacation within budget",
        inputs: [
          { key: 'income', label: 'Monthly Take-Home Income', type: 'number', placeholder: '3500' },
          { key: 'tripCost', label: 'Total Trip Cost', type: 'number', placeholder: '2500' },
          { key: 'timeframe', label: 'Months to Save', type: 'number', placeholder: '6' },
          { key: 'currentSavings', label: 'Current Savings Available', type: 'number', placeholder: '500' },
          { key: 'monthlyExpenses', label: 'Monthly Fixed Expenses', type: 'number', placeholder: '2800' }
        ]
      }
    };

    const currentScenario = scenarios[selectedScenario];
    if (!currentScenario) return null;

    const handleInputChange = (key, value) => {
      setScenarioInputs(prev => ({
        ...prev,
        [key]: value
      }));
    };

    const calculateResult = () => {
      if (selectedScenario === 'moveOut') {
        return calculateMoveOutScenario(scenarioInputs);
      } else if (selectedScenario === 'vacation') {
        return calculateVacationScenario(scenarioInputs);
      }
      return null;
    };

    const result = calculateResult();

    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => {
                setSelectedScenario(null);
                setScenarioInputs({});
              }}
              className="text-orange-400 hover:text-orange-300 text-2xl"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold">{currentScenario.title}</h1>
              <p className="text-white/80">{currentScenario.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-black/60 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-6">Enter Your Information</h2>
              <div className="space-y-4">
                {currentScenario.inputs.map((input) => (
                  <div key={input.key}>
                    <label className="block text-white font-medium mb-2">{input.label}</label>
                    <input
                      type={input.type}
                      placeholder={input.placeholder}
                      value={scenarioInputs[input.key] || ''}
                      onChange={(e) => handleInputChange(input.key, e.target.value)}
                      className="w-full bg-black/80 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="bg-black/60 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-6">Your Results</h2>
              {result ? (
                <div className="space-y-4">
                  {selectedScenario === 'moveOut' && (
                    <>
                      <div className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-xl p-4">
                        <div className="text-2xl font-bold text-center mb-2">
                          {result.canAfford ? '✅ You Can Afford It!' : '❌ Wait & Save More'}
                        </div>
                        <div className="text-center text-white/80">{result.recommendation}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-orange-400">${result.totalExpenses.toLocaleString()}</div>
                          <div className="text-sm text-white/70">Total Monthly Expenses</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                          <div className={`text-2xl font-bold ${result.leftover >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${result.leftover.toLocaleString()}
                          </div>
                          <div className="text-sm text-white/70">Monthly Leftover</div>
                        </div>
                      </div>
                      
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span>Budget Usage</span>
                          <span className={`font-bold ${result.affordability <= 70 ? 'text-green-400' : 'text-red-400'}`}>
                            {result.affordability.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all ${result.affordability <= 50 ? 'bg-green-400' : result.affordability <= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(result.affordability, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-white/60 mt-2">Recommended: Under 70%</div>
                      </div>
                    </>
                  )}
                  
                  {selectedScenario === 'vacation' && result && (
                    <>
                      <div className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-xl p-4">
                        <div className="text-2xl font-bold text-center mb-2">
                          {result.canAfford ? '✈️ Trip is Doable!' : '💸 Need More Time/Money'}
                        </div>
                        <div className="text-center text-white/80">{result.recommendation}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-orange-400">${result.monthlyNeeded.toLocaleString()}</div>
                          <div className="text-sm text-white/70">Monthly Savings Needed</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">${result.totalAvailable.toLocaleString()}</div>
                          <div className="text-sm text-white/70">Total Available</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center text-white/60 py-8">
                  Fill out the form to see your results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Additional calculation functions
  const calculateVacationScenario = (inputs) => {
    const income = parseFloat(inputs.income) || 0;
    const tripCost = parseFloat(inputs.tripCost) || 0;
    const timeframe = parseFloat(inputs.timeframe) || 1;
    const currentSavings = parseFloat(inputs.currentSavings) || 0;
    const monthlyExpenses = parseFloat(inputs.monthlyExpenses) || 0;

    const monthlyLeftover = income - monthlyExpenses;
    const totalNeeded = tripCost - currentSavings;
    const monthlyNeeded = totalNeeded / timeframe;
    const totalAvailable = currentSavings + (monthlyLeftover * timeframe);
    
    return {
      monthlyNeeded,
      totalAvailable,
      canAfford: totalAvailable >= tripCost,
      recommendation: totalAvailable >= tripCost ? 
        "You can afford this trip with your current savings plan!" :
        `You need to save $${Math.ceil((tripCost - totalAvailable) / timeframe)} more per month or extend your timeline.`
    };
  };

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