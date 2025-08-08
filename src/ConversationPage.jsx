import React, { useState, useEffect, useRef } from 'react';
import voiceService from './services/voiceService';

const ConversationPage = ({ onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [conversationStep, setConversationStep] = useState(0);
  const [conversationData, setConversationData] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  // Voice-related state
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [transcript, setTranscript] = useState('');
  
  // Refs for voice control
  const recognitionRef = useRef(null);
  const isManualStopRef = useRef(false);

  // Therapist notes state
  const [therapistNotes, setTherapistNotes] = useState([]);
  const [currentInsights, setCurrentInsights] = useState({
    archetype: '',
    keyTraits: [],
    emotionalState: '',
    financialGoals: [],
    riskLevel: ''
  });

  // Structured conversation questions based on your outline
  const conversationFlow = [
    {
      id: 'intro',
      message: "Hi! I'm here to have a real conversation with you about money - not to judge, just to understand. Let's start simple: when you think about money, what's the first feeling that comes up for you?",
      category: 'feelings'
    },
    {
      id: 'daily_life',
      message: "That gives me great insight into your mindset. Let's talk about your day-to-day life - what does a typical week look like for you right now? I'm curious about your routine, work, and how you spend your time.",
      category: 'current_situation'
    },
    {
      id: 'financial_responsibilities',
      message: "Thanks for sharing that! Now I'm curious - are there any big financial responsibilities you're focusing on right now? Maybe rent, student loans, family support, or saving for something specific?",
      category: 'current_situation'
    },
    {
      id: 'money_management',
      message: "I appreciate your honesty about that. How do you feel about managing your money at this stage in life? Are you feeling confident, overwhelmed, curious to learn more, or somewhere in between?",
      category: 'current_situation'
    },
    {
      id: 'decision_making',
      message: "That's really insightful. When you have to make big financial decisions - like a major purchase or choosing where to live - how do you usually approach them? Do you research extensively, go with your gut, ask others for advice?",
      category: 'financial_behaviors'
    },
    {
      id: 'money_relationship',
      message: "I love learning about how people think through decisions. Here's a deeper question - do you see money as a source of stress, freedom, security, or something else entirely? What's your gut reaction to that?",
      category: 'financial_behaviors'
    },
    {
      id: 'dream_life_intro',
      message: "That's such an honest perspective. Now let's dream a little - if money wasn't a concern at all, what would your ideal life look like? Think about where you'd live, how you'd spend your days, what experiences you'd have.",
      category: 'dream_life'
    },
    {
      id: 'lifestyle_specifics',
      message: "That sounds amazing! Let's get specific about your dream lifestyle. What kind of home appeals to you? And what about travel - are you someone who dreams of exploring the world, or do you prefer staying closer to home with occasional getaways?",
      category: 'dream_life'
    },
    {
      id: 'activities_experiences',
      message: "I can really picture that lifestyle! What kind of activities and experiences would fill your ideal days? Think about hobbies, social life, personal growth, or ways you'd want to contribute to the world.",
      category: 'dream_life'
    },
    {
      id: 'retirement_vision',
      message: "That all sounds so fulfilling. Here's my final question - at what point in life would you love to have the freedom to stop working if you wanted to? Not that you'd necessarily stop, but when would you want that financial freedom to choose?",
      category: 'dream_life'
    }
  ];

  // Initialize voice service and speech recognition
  useEffect(() => {
    // Initialize voice service with API key
    voiceService.initialize({
      openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY
    });

    // Set up speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsRecording(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
        setCurrentInput(finalTranscript + interimTranscript);
      };
      
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsRecording(false);
        
        // Reset the manual stop flag (submission is handled in stopVoiceRecording)
        isManualStopRef.current = false;
      };
      
      recognition.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsRecording(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions to use voice features.');
        }
      };
      
      recognitionRef.current = recognition;
      setSpeechRecognition(recognition);
    }
  }, []);

  // Initialize conversation with first message
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        const firstMessage = {
          type: 'therapist',
          content: conversationFlow[0].message,
          timestamp: new Date(),
          id: conversationFlow[0].id
        };
        setMessages([firstMessage]);
        
        // Speak the first message if voice is enabled
        if (voiceEnabled) {
          setTimeout(() => {
            speakMessage(conversationFlow[0].message);
          }, 1500);
        }
      }, 1000);
    }
  }, [voiceEnabled]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Voice control functions
  const speakMessage = async (message) => {
    if (!voiceEnabled) return;
    
    setIsAISpeaking(true);
    try {
      await voiceService.speak(
        message,
        () => console.log('🔊 AI started speaking'),
        () => {
          console.log('🔊 AI finished speaking');
          setIsAISpeaking(false);
        },
        (error) => {
          console.error('🔊 Speech error:', error);
          setIsAISpeaking(false);
        }
      );
    } catch (error) {
      console.error('🔊 Speech failed:', error);
      setIsAISpeaking(false);
    }
  };

  const startVoiceRecording = async () => {
    if (!speechRecognition || isRecording || isAISpeaking) return;
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Clear previous transcript
      setTranscript('');
      setCurrentInput('');
      isManualStopRef.current = false;
      
      // Start recognition
      recognitionRef.current.start();
    } catch (error) {
      console.error('🎤 Microphone access error:', error);
      alert('Unable to access microphone. Please check your browser settings.');
    }
  };

  const stopVoiceRecording = () => {
    if (!speechRecognition || !isRecording) return;
    
    isManualStopRef.current = true;
    recognitionRef.current.stop();
    
    // Auto-submit after stopping
    setTimeout(() => {
      if (transcript.trim()) {
        handleVoiceSubmit();
      }
    }, 300);
  };

  const handleVoiceSubmit = () => {
    if (!transcript.trim() || isTyping) return;
    
    // Process the voice input same as text input
    processUserInput(transcript.trim());
    
    // Clear transcript
    setTranscript('');
    setCurrentInput('');
  };

  // Generate therapist notes based on user response
  const generateTherapistNote = (userResponse, questionType, step) => {
    const response = userResponse.toLowerCase();
    let note = '';
    let insights = {};

    switch(questionType) {
      case 'feelings':
        if (response.includes('stress') || response.includes('worry') || response.includes('anxious')) {
          note = 'Shows financial stress/anxiety - common pattern. May benefit from mindfulness approach to money decisions.';
          insights.emotionalState = 'Financial Anxiety';
          insights.archetype = 'The Mindful Worrier';
        } else if (response.includes('excited') || response.includes('hopeful') || response.includes('optimistic')) {
          note = 'Positive money mindset - great foundation for growth. Shows readiness for financial exploration.';
          insights.emotionalState = 'Optimistic';
          insights.archetype = 'The Balanced Explorer';
        } else if (response.includes('confused') || response.includes('lost') || response.includes('overwhelmed')) {
          note = 'Seeking clarity and direction. Authentic about not having all the answers - shows growth mindset.';
          insights.emotionalState = 'Seeking Clarity';
          insights.archetype = 'The Authentic Explorer';
        } else {
          note = 'Thoughtful relationship with money. Shows self-awareness and emotional intelligence.';
          insights.emotionalState = 'Reflective';
        }
        break;

      case 'current_situation':
        if (response.includes('stable') || response.includes('routine') || response.includes('organized')) {
          note = 'Structured lifestyle suggests good planning skills. Likely responds well to systematic approaches.';
          insights.keyTraits = [...(insights.keyTraits || []), 'Organized', 'Structured'];
        } else if (response.includes('busy') || response.includes('hectic') || response.includes('chaotic')) {
          note = 'High-energy lifestyle. May need simple, automated financial solutions that work in background.';
          insights.keyTraits = [...(insights.keyTraits || []), 'Busy', 'Action-oriented'];
        }
        
        if (response.includes('debt') || response.includes('loans') || response.includes('paying off')) {
          note = 'Managing debt responsibilities - common challenge. Focus on debt payoff strategies.';
          insights.riskLevel = 'Conservative - Debt Focus';
        } else if (response.includes('saving') || response.includes('investing') || response.includes('growing')) {
          note = 'Already building wealth. Ready for more advanced strategies.';
          insights.riskLevel = 'Growth-Oriented';
        }
        break;

      case 'financial_behaviors':
        if (response.includes('research') || response.includes('analyze') || response.includes('study')) {
          note = 'Analytical decision-maker. Appreciates data and thorough analysis before acting.';
          insights.keyTraits = [...(insights.keyTraits || []), 'Analytical', 'Research-focused'];
          insights.archetype = 'The Strategic Freedom Builder';
        } else if (response.includes('gut') || response.includes('instinct') || response.includes('feeling')) {
          note = 'Intuitive decision-maker. Trusts instincts - can be powerful when combined with basic analysis.';
          insights.keyTraits = [...(insights.keyTraits || []), 'Intuitive', 'Quick-acting'];
        }

        if (response.includes('freedom') || response.includes('independence') || response.includes('choice')) {
          note = 'Values financial freedom highly. Strong motivation for wealth building and independence.';
          insights.financialGoals = [...(insights.financialGoals || []), 'Financial Independence'];
        } else if (response.includes('security') || response.includes('safety') || response.includes('stable')) {
          note = 'Security-focused approach. Prefers stability over high returns - conservative strategy fits well.';
          insights.financialGoals = [...(insights.financialGoals || []), 'Financial Security'];
        }
        break;

      case 'dream_life':
        if (response.includes('travel') || response.includes('explore') || response.includes('adventure')) {
          note = 'Experience-focused dreams. Lifestyle inflation planning needed - budget for meaningful experiences.';
          insights.financialGoals = [...(insights.financialGoals || []), 'Travel & Experiences'];
          insights.archetype = 'The Experience Collector';
        }
        
        if (response.includes('house') || response.includes('home') || response.includes('property')) {
          note = 'Home ownership is priority. Need mortgage planning and down payment savings strategy.';
          insights.financialGoals = [...(insights.financialGoals || []), 'Home Ownership'];
        }

        if (response.includes('early') || response.includes('retire') || response.includes('quit work')) {
          note = 'Early retirement goal identified. FIRE strategy and aggressive savings rate needed.';
          insights.financialGoals = [...(insights.financialGoals || []), 'Early Retirement'];
        }
        break;

      default:
        note = '📝 Gathering insights about financial personality and goals...';
    }

    return { note, insights };
  };

  const processUserInput = (inputText) => {
    console.log('📝 User submitted:', inputText);
    console.log('📝 Current step:', conversationStep);

    // Add user message
    const userMessage = {
      type: 'user',
      content: inputText,
      timestamp: new Date(),
      step: conversationStep
    };

    setMessages(prev => [...prev, userMessage]);

    // Store user response
    const currentQuestion = conversationFlow[conversationStep];
    setConversationData(prev => ({
      ...prev,
      [currentQuestion.id]: inputText
    }));

    // Generate therapist note
    const { note, insights } = generateTherapistNote(
      inputText, 
      currentQuestion.category, 
      conversationStep
    );

    // Add note to therapist notes
    setTherapistNotes(prev => [...prev, {
      step: conversationStep + 1,
      question: currentQuestion.category,
      note: note,
      timestamp: new Date()
    }]);

    // Update current insights
    setCurrentInsights(prev => ({
      archetype: insights.archetype || prev.archetype,
      keyTraits: [...new Set([...prev.keyTraits, ...(insights.keyTraits || [])])],
      emotionalState: insights.emotionalState || prev.emotionalState,
      financialGoals: [...new Set([...prev.financialGoals, ...(insights.financialGoals || [])])],
      riskLevel: insights.riskLevel || prev.riskLevel
    }));

    // Check if conversation is complete
    const nextStep = conversationStep + 1;
    if (nextStep >= conversationFlow.length) {
      console.log('🎯 Conversation complete!');
      // Add final message
      setIsTyping(true);
      setTimeout(() => {
        const finalMessage = {
          type: 'therapist',
          content: "This has been such a rich conversation! Thank you for sharing your dreams and being so open about your relationship with money. Let me analyze everything you've shared and create your personalized FinThera report. This will just take a moment...",
          timestamp: new Date(),
          id: 'completion'
        };
        setMessages(prev => [...prev, finalMessage]);
        setIsTyping(false);

        // Speak final message
        if (voiceEnabled) {
          speakMessage(finalMessage.content);
        }

        // Complete conversation after a delay
        setTimeout(() => {
          onComplete(conversationData, therapistNotes, currentInsights);
        }, 3000);
      }, 1500);
      return;
    }

    // Generate next therapist response
    setIsTyping(true);
    setTimeout(() => {
      const therapistMessage = {
        type: 'therapist',
        content: conversationFlow[nextStep].message,
        timestamp: new Date(),
        id: conversationFlow[nextStep].id
      };

      setMessages(prev => [...prev, therapistMessage]);
      setConversationStep(nextStep);
      setIsTyping(false);

      // Speak the next question
      if (voiceEnabled) {
        setTimeout(() => {
          speakMessage(therapistMessage.content);
        }, 500);
      }
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentInput.trim() || isTyping) return;

    // Use the shared processing function
    processUserInput(currentInput.trim());
    setCurrentInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversation Area - Left 2/3 */}
          <div className="lg:col-span-2">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Financial Therapy Session
          </h1>
          <p className="text-white/80 mb-4">
            A safe space to explore your relationship with money
          </p>
          <div className="flex justify-center gap-4 items-center mb-4">
            <div className="bg-white/10 rounded-full px-4 py-2">
              <span className="text-white/80 text-sm">
                Question {Math.min(conversationStep + 1, conversationFlow.length)} of {conversationFlow.length}
              </span>
            </div>
            {voiceEnabled && (
              <div className="bg-green-500/20 rounded-full px-3 py-1 border border-green-400/30">
                <span className="text-green-300 text-xs">Voice Ready</span>
              </div>
            )}
            {isAISpeaking && (
              <div className="bg-blue-500/20 rounded-full px-3 py-1 border border-blue-400/30">
                <span className="text-blue-300 text-xs">AI Speaking</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="bg-black/80 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20 h-96 overflow-y-auto"
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voice Control - Prominent Microphone Button */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              disabled={isTyping || isAISpeaking}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 transform ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
                  : isAISpeaking
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
              } shadow-lg`}
            >
              {isRecording ? (
                <div className="text-2xl animate-bounce">●</div>
              ) : isAISpeaking ? (
                <div className="text-2xl">♪</div>
              ) : (
                <div className="text-2xl">○</div>
              )}
            </button>
            
            {isRecording && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          <p className="text-white/80 text-sm mt-4">
            {isRecording 
              ? 'Listening... Tap to stop' 
              : isAISpeaking 
                ? 'AI is speaking...' 
                : speechRecognition 
                  ? 'Tap to start speaking' 
                  : 'Voice not available'
            }
          </p>
          
          {transcript && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20 max-w-md mx-auto">
              <p className="text-white/60 text-xs mb-1">Live Transcript:</p>
              <p className="text-white text-sm">{transcript}</p>
            </div>
          )}
        </div>

        {/* Text Input - Fallback Option */}
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="text-center mb-3">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="text-white/60 text-xs hover:text-white transition-colors"
            >
              {voiceEnabled ? 'Voice ON' : 'Voice OFF'} • Or type below
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Or type your response here..."
                className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 resize-none"
                rows="2"
                disabled={isTyping || isRecording}
              />
              <button
                type="submit"
                disabled={!currentInput.trim() || isTyping || isRecording}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
              >
                Send
              </button>
            </div>
          </form>
        </div>
        </div>

        {/* Therapist Notes Panel - Right 1/3 */}
        <div className="lg:col-span-1">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 border border-white/20 sticky top-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl text-white">👩‍⚕️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Financial Therapy Session</h3>
              <p className="text-sm text-gray-600 italic">Your Personal AI Therapist</p>
              <p className="text-xs text-gray-500">Smart investing & wealth building</p>
            </div>

            {/* Current Insights Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">Session Overview</h4>
              <div className="space-y-2 text-xs">
                {currentInsights.archetype && (
                  <div>
                    <span className="font-medium text-gray-700">Profile:</span>
                    <span className="text-gray-600 ml-2">{currentInsights.archetype}</span>
                  </div>
                )}
                {currentInsights.emotionalState && (
                  <div>
                    <span className="font-medium text-gray-700">Mindset:</span>
                    <span className="text-gray-600 ml-2">{currentInsights.emotionalState}</span>
                  </div>
                )}
                {currentInsights.riskLevel && (
                  <div>
                    <span className="font-medium text-gray-700">Risk Level:</span>
                    <span className="text-gray-600 ml-2">{currentInsights.riskLevel}</span>
                  </div>
                )}
              </div>

              {/* Key Traits */}
              {currentInsights.keyTraits.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-gray-700">Key Traits:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentInsights.keyTraits.map((trait, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Goals */}
              {currentInsights.financialGoals.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-gray-700">Goals:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentInsights.financialGoals.map((goal, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Therapist's Notes */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Therapist's Notes</h4>
              
              {therapistNotes.length === 0 ? (
                <div className="text-center text-gray-500 text-xs italic py-4">
                  Session notes will appear here as we talk...
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {therapistNotes.map((note, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-600">Question {note.step}</span>
                        <span className="text-xs text-gray-500">
                          {note.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Session Progress</span>
                <span>{Math.min(conversationStep + 1, conversationFlow.length)}/{conversationFlow.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((conversationStep + 1) / conversationFlow.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;