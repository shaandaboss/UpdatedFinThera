import React, { useState, useEffect, useRef } from 'react';
import elevenLabsAgentService from './services/elevenLabsAgentService';

const ConversationPageWithAgent = ({ onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState({
    archetype: '',
    keyTraits: [],
    emotionalState: '',
    financialGoals: [],
    riskLevel: ''
  });
  
  const chatContainerRef = useRef(null);
  const conversationStarted = useRef(false);

  // Initialize ElevenLabs agent service
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        // Initialize with API key from environment
        const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
        if (!apiKey) {
          throw new Error('ElevenLabs API key not found. Please add VITE_ELEVENLABS_API_KEY to your .env file');
        }

        elevenLabsAgentService.initialize(apiKey);

        // Set up event handlers
        elevenLabsAgentService.onConnectionChange = (connected) => {
          setIsConnected(connected);
          if (connected && !conversationStarted.current) {
            conversationStarted.current = true;
            addSystemMessage("Hi! I'm your personal AI financial therapist. I'm here to understand your relationship with money and help you build a personalized financial plan. Let's start - how are you feeling about your finances today?");
          }
        };

        elevenLabsAgentService.onError = (error) => {
          console.error('Agent error:', error);
          setError(error.message);
        };

        // Start the conversation
        const convId = await elevenLabsAgentService.startConversation();
        setConversationId(convId);

      } catch (error) {
        console.error('Failed to initialize agent:', error);
        setError(error.message);
      }
    };

    initializeAgent();

    // Cleanup on unmount
    return () => {
      elevenLabsAgentService.endConversation();
    };
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const addSystemMessage = (content) => {
    const message = {
      type: 'therapist',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content) => {
    const message = {
      type: 'user', 
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    if (!isConnected) {
      setError('Not connected to AI agent');
      return;
    }

    try {
      await elevenLabsAgentService.startRecording();
      setIsRecording(true);
      setError(null);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording: ' + error.message);
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    elevenLabsAgentService.stopRecording();
    setIsRecording(false);
  };

  // Send text message as fallback
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() || !isConnected) return;

    const userMessage = currentInput.trim();
    addUserMessage(userMessage);
    setCurrentInput('');

    try {
      await elevenLabsAgentService.sendTextMessage(userMessage);
    } catch (error) {
      console.error('Failed to send text message:', error);
      setError('Failed to send message: ' + error.message);
    }
  };

  // Analyze conversation for insights (placeholder)
  const analyzeConversation = async () => {
    // This would analyze the conversation transcript to extract insights
    // For now, we'll create sample insights based on the conversation
    const analysisInsights = {
      archetype: 'The Balanced Explorer', // Would be determined by AI analysis
      keyTraits: ['Thoughtful', 'Curious', 'Growth-minded'],
      emotionalState: 'Cautiously Optimistic',
      financialGoals: ['Financial Security', 'Long-term Growth'],
      riskLevel: 'Moderate'
    };

    setInsights(analysisInsights);
    return analysisInsights;
  };

  // End conversation and proceed to action plan
  const endConversationAndProceed = async () => {
    try {
      // Get conversation history
      const conversationHistory = await elevenLabsAgentService.getConversationHistory();
      
      // Analyze conversation for insights
      const finalInsights = await analyzeConversation();
      
      // End the ElevenLabs conversation
      await elevenLabsAgentService.endConversation();
      
      // Pass data to next step
      onComplete(conversationHistory, [], finalInsights);
      
    } catch (error) {
      console.error('Failed to end conversation:', error);
      setError('Failed to complete conversation: ' + error.message);
    }
  };

  // Monitor agent speaking status
  useEffect(() => {
    const checkSpeakingStatus = () => {
      const speaking = elevenLabsAgentService.isSpeaking();
      setIsAISpeaking(speaking);
    };

    const interval = setInterval(checkSpeakingStatus, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversation Area - Left 2/3 */}
          <div className="lg:col-span-2">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                AI Financial Therapy Session
              </h1>
              <p className="text-white/80 mb-4">
                Real-time conversation with your personal AI therapist
              </p>
              <div className="flex justify-center gap-4 items-center mb-4">
                <div className={`rounded-full px-4 py-2 ${
                  isConnected ? 'bg-green-500/20 border-green-400/30' : 'bg-red-500/20 border-red-400/30'
                } border`}>
                  <span className={`text-xs ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
                    {isConnected ? '🟢 Connected to AI Agent' : '🔴 Connecting...'}
                  </span>
                </div>
                {isAISpeaking && (
                  <div className="bg-blue-500/20 rounded-full px-3 py-1 border border-blue-400/30">
                    <span className="text-blue-300 text-xs">AI Speaking</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6">
                <div className="text-red-300 text-sm">
                  <strong>Error:</strong> {error}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-300 hover:text-red-100 text-xs mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}

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
              </div>
            </div>

            {/* Voice Control - Prominent Microphone Button */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  disabled={!isConnected || isAISpeaking}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 transform ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
                      : !isConnected || isAISpeaking
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
                  ? 'Recording... Tap to stop' 
                  : isAISpeaking 
                    ? 'AI is speaking...' 
                    : !isConnected
                      ? 'Connecting to AI agent...'
                      : 'Tap to start speaking'
                }
              </p>
            </div>

            {/* Text Input - Fallback Option */}
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-center mb-3">
                <span className="text-white/60 text-xs">
                  Or type your message below
                </span>
              </div>
              
              <form onSubmit={handleTextSubmit}>
                <div className="flex gap-4">
                  <textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Type your response here..."
                    className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 resize-none"
                    rows="2"
                    disabled={!isConnected || isRecording}
                  />
                  <button
                    type="submit"
                    disabled={!currentInput.trim() || !isConnected || isRecording}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Session Info Panel - Right 1/3 */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 border border-white/20 sticky top-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl text-white">🤖</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">AI Therapy Session</h3>
                <p className="text-sm text-gray-600 italic">Your Personal AI Therapist</p>
                <p className="text-xs text-gray-500">Powered by ElevenLabs AI</p>
              </div>

              {/* Connection Status */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">Session Status</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Connection:</span>
                    <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Agent ID:</span>
                    <span className="text-gray-600 text-xs font-mono">
                      {elevenLabsAgentService.agentId.slice(-8)}...
                    </span>
                  </div>
                  {conversationId && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Session ID:</span>
                      <span className="text-gray-600 text-xs font-mono">
                        {conversationId.slice(-8)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Insights */}
              {insights.archetype && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-3">Detected Insights</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Profile:</span>
                      <span className="text-gray-600 ml-2">{insights.archetype}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Emotional State:</span>
                      <span className="text-gray-600 ml-2">{insights.emotionalState}</span>
                    </div>
                    {insights.keyTraits.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-gray-700">Traits:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {insights.keyTraits.map((trait, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Conversation Progress */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Conversation Flow</h4>
                <div className="text-sm text-gray-600">
                  <p>🎙️ Real-time AI conversation</p>
                  <p>💭 Dynamic insights generation</p>
                  <p>📊 Personalized action planning</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={endConversationAndProceed}
                disabled={!isConnected || messages.length < 4}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-lg font-medium transition-all disabled:cursor-not-allowed"
              >
                {messages.length < 4 ? 'Continue Conversation...' : 'Complete & Create Action Plan'}
              </button>
              
              <p className="text-gray-500 text-xs mt-2 text-center">
                Have at least 4 exchanges to generate insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPageWithAgent;