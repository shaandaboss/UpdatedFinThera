import React, { useState, useEffect, useRef } from 'react';
import modernElevenLabsService from './services/modernElevenLabsService';

const ConversationPageWithAgent = ({ onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const [agentState, setAgentState] = useState('idle'); // idle, listening, thinking, speaking
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
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
        // Initialize with API key from environment (optional since key is hardcoded)
        const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
        console.log('🔑 API Key status:', apiKey ? `Found (${apiKey.slice(0, 8)}...)` : 'Using hardcoded key');

        await modernElevenLabsService.initialize(apiKey);
        console.log('🤖 Initializing YOUR custom ElevenLabs agent:', modernElevenLabsService.agentId);

        // Set up event handlers
        modernElevenLabsService.onConnectionChange = (connected) => {
          setIsConnected(connected);
          console.log(`🔌 Agent connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
          if (connected && !conversationStarted.current) {
            conversationStarted.current = true;
            console.log('🎯 Starting conversation with YOUR custom agent...');
            addSystemMessage("Hi! I'm your custom AI financial therapist agent. I'm here to understand your relationship with money and help you build a personalized financial plan. Let's start - how are you feeling about your finances today?");
          }
        };

        modernElevenLabsService.onError = (error) => {
          console.error('Agent error:', error);
          setError(error.message);
        };

        // Handle real-time voice transcripts
        modernElevenLabsService.onUserTranscript = (transcript) => {
          console.log('📝 Adding user transcript:', transcript);
          addUserMessage(transcript);
        };

        modernElevenLabsService.onAgentResponse = (response) => {
          console.log('🤖 Adding agent response:', response);
          addSystemMessage(response);
        };

        // Start the conversation
        const conversation = await modernElevenLabsService.startConversation();
        setConversationId(modernElevenLabsService.getConversationId());

      } catch (error) {
        console.error('Failed to initialize agent:', error);
        let errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('API key')) {
          errorMessage += '\n\nPlease check:\n1. API key is added to .env file\n2. Server is restarted after adding key\n3. Key format is correct (starts with sk_)';
        } else if (error.message.includes('Failed to create conversation')) {
          errorMessage += '\n\nThis could be due to:\n1. Invalid agent ID\n2. API key lacks permissions\n3. ElevenLabs service issues\n4. Network connectivity problems';
        }
        
        setError(errorMessage);
      }
    };

    initializeAgent();

    // Cleanup on unmount
    return () => {
      modernElevenLabsService.endConversation();
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
      id: Date.now() + Math.random(), // Unique ID
      type: 'therapist',
      content,
      timestamp: new Date(),
      editable: false
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content) => {
    const message = {
      id: Date.now() + Math.random(), // Unique ID
      type: 'user', 
      content,
      timestamp: new Date(),
      editable: true // User messages can be edited
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
      await modernElevenLabsService.startRecording();
      setIsRecording(true);
      setAgentState('listening');
      setError(null);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start recording: ' + error.message);
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    modernElevenLabsService.stopRecording();
    setIsRecording(false);
    setAgentState('thinking');
    
    // After a brief thinking state, it will become speaking when AI responds
    setTimeout(() => {
      if (!isAISpeaking) {
        setAgentState('idle');
      }
    }, 2000);
  };

  // Send text message as fallback
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() || !isConnected) return;

    const userMessage = currentInput.trim();
    addUserMessage(userMessage);
    setCurrentInput('');

    try {
      await modernElevenLabsService.sendTextMessage(userMessage);
    } catch (error) {
      console.error('Failed to send text message:', error);
      setError('Failed to send message: ' + error.message);
    }
  };

  // Edit message functions
  const startEditingMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditingText(content);
  };

  const saveEditedMessage = async (messageId) => {
    if (!editingText.trim()) return;

    // Update the message in the list
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: editingText.trim(), edited: true }
        : msg
    ));

    // If it's a user message, optionally resend to agent
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.type === 'user' && isConnected) {
      try {
        await modernElevenLabsService.sendTextMessage(editingText.trim());
      } catch (error) {
        console.error('Failed to resend edited message:', error);
      }
    }

    setEditingMessageId(null);
    setEditingText('');
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const deleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
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

  // Test API connection
  const testAPIConnection = async () => {
    try {
      console.log('🧪 Testing API connection...');
      // Test by trying to initialize the service
      await modernElevenLabsService.initialize(import.meta.env.VITE_ELEVENLABS_API_KEY);
      alert(`✅ Service initialized successfully!\n\nAgent ID: ${modernElevenLabsService.agentId}`);
    } catch (error) {
      console.error('❌ API test error:', error);
      alert(`API test error: ${error.message}`);
    }
  };

  // End conversation and proceed to action plan
  const endConversationAndProceed = async () => {
    try {
      // Get conversation history (modern service handles this internally)
      const conversationHistory = messages; // Use our tracked messages
      
      // Analyze conversation for insights
      const finalInsights = await analyzeConversation();
      
      // End the ElevenLabs conversation
      await modernElevenLabsService.endConversation();
      
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
      const speaking = modernElevenLabsService.isSpeaking();
      const wasAISpeaking = isAISpeaking;
      setIsAISpeaking(speaking);
      
      // Update agent state based on speaking status
      if (speaking && !wasAISpeaking) {
        setAgentState('speaking');
      } else if (!speaking && wasAISpeaking && !isRecording) {
        setAgentState('idle');
      }
    };

    const interval = setInterval(checkSpeakingStatus, 200);
    return () => clearInterval(interval);
  }, [isAISpeaking, isRecording]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your AI Financial Therapist</h1>
          <p className="text-white/80 text-lg">Powered by advanced ElevenLabs AI technology</p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* AI Character/Avatar Section */}
            <div className="flex flex-col items-center">
              {/* Large AI Avatar */}
              <div className="relative mb-8">
                <div className={`w-80 h-80 rounded-full flex items-center justify-center transition-all duration-500 ${
                  agentState === 'listening' 
                    ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-2xl shadow-red-500/50 animate-pulse' 
                    : agentState === 'speaking' 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-2xl shadow-blue-500/50'
                      : agentState === 'thinking'
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl shadow-yellow-500/50'
                        : 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl shadow-green-500/50'
                }`}>
                  
                  {/* AI Face/Character */}
                  <div className="text-8xl">
                    {agentState === 'listening' ? '👂' : 
                     agentState === 'speaking' ? '🗣️' :
                     agentState === 'thinking' ? '🤔' : '🧠'}
                  </div>
                  
                  {/* Animated rings around avatar when active */}
                  {(agentState === 'listening' || agentState === 'speaking') && (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-pulse"></div>
                    </>
                  )}
                </div>

                {/* Status indicator */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className={`px-6 py-2 rounded-full text-white font-semibold text-lg shadow-lg ${
                    isConnected 
                      ? agentState === 'listening' 
                        ? 'bg-red-500' 
                        : agentState === 'speaking' 
                          ? 'bg-blue-500'
                          : agentState === 'thinking'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      : 'bg-gray-500'
                  }`}>
                    {!isConnected ? 'Connecting...' :
                     agentState === 'listening' ? 'Listening to you...' :
                     agentState === 'speaking' ? 'AI is speaking...' :
                     agentState === 'thinking' ? 'Processing...' :
                     'Ready to chat!'}
                  </div>
                </div>
              </div>

              {/* AI Character Info */}
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-2">FinThera AI</h2>
                <p className="text-white/80 mb-4">Your personal financial wellness companion</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span>{isConnected ? 'Connected' : 'Connecting'}</span>
                  </div>
                  {conversationId && (
                    <div className="text-white/60">
                      Session: {conversationId.slice(-6)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conversation Interface */}
            <div className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="bg-red-500/20 border-2 border-red-400/50 rounded-2xl p-6">
                  <div className="text-red-100 mb-4">
                    <strong>Connection Error:</strong> {error}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={testAPIConnection}
                      className="bg-red-500/30 hover:bg-red-500/50 text-red-100 px-4 py-2 rounded-lg transition-all"
                    >
                      Retry Connection
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Large Voice Interaction Button */}
              <div className="text-center">
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  disabled={!isConnected || isAISpeaking}
                  className={`w-32 h-32 rounded-full flex items-center justify-center text-white transition-all duration-300 transform shadow-2xl ${
                    isRecording 
                      ? 'bg-gradient-to-br from-red-500 to-red-700 scale-110 animate-pulse shadow-red-500/50' 
                      : !isConnected || isAISpeaking
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:scale-110 shadow-green-500/50 hover:shadow-green-500/70'
                  }`}
                >
                  {isRecording ? (
                    <div className="text-4xl">🎙️</div>
                  ) : isAISpeaking ? (
                    <div className="text-4xl animate-pulse">🔊</div>
                  ) : (
                    <div className="text-4xl">🎤</div>
                  )}
                </button>
                
                <p className="text-white/90 text-xl font-medium mt-6">
                  {isRecording 
                    ? 'Listening... Tap to stop' 
                    : isAISpeaking 
                      ? 'AI is responding...' 
                      : !isConnected
                        ? 'Connecting to AI...'
                        : 'Tap to start conversation'
                  }
                </p>
              </div>

              {/* Conversation Transcript */}
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-h-80 overflow-y-auto">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>💬</span> Conversation
                </h3>
                
                {messages.length === 0 ? (
                  <div className="text-white/60 text-center py-8">
                    <div className="text-4xl mb-4">👋</div>
                    <p>Hi! I'm your AI financial therapist. I'm here to help you understand your relationship with money and create a personalized financial plan.</p>
                    <p className="mt-2 text-sm">Click the microphone above to start our conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.id || index}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-3 rounded-2xl group relative ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : 'bg-white/10 text-white border border-white/20'
                          }`}
                        >
                          {editingMessageId === message.id ? (
                            // Editing mode
                            <div className="space-y-2">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-white/50"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => saveEditedMessage(message.id)}
                                  className="bg-green-500/80 hover:bg-green-500 text-white px-3 py-1 rounded text-xs transition-all"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="bg-gray-500/80 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Display mode
                            <>
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs opacity-60">
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {message.edited && <span className="ml-1 italic">(edited)</span>}
                                </p>
                                
                                {/* Edit/Delete buttons for user messages */}
                                {message.editable && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                      onClick={() => startEditingMessage(message.id, message.content)}
                                      className="text-xs hover:bg-white/20 p-1 rounded transition-all"
                                      title="Edit message"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => deleteMessage(message.id)}
                                      className="text-xs hover:bg-red-500/50 p-1 rounded transition-all"
                                      title="Delete message"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Input Alternative */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <form onSubmit={handleTextSubmit}>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="Or type your message here..."
                      className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all"
                      disabled={!isConnected || isRecording}
                    />
                    <button
                      type="submit"
                      disabled={!currentInput.trim() || !isConnected || isRecording}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>

              {/* Action Button */}
              <div className="text-center">
                <button
                  onClick={endConversationAndProceed}
                  disabled={!isConnected || messages.length < 4}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all disabled:cursor-not-allowed shadow-xl"
                >
                  {messages.length < 4 ? `Continue chatting... (${4 - messages.length} more exchanges needed)` : '✨ Complete Session & Get Insights'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPageWithAgent;