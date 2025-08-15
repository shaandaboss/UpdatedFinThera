import React, { useState, useEffect, useRef } from 'react';
import simpleElevenLabsService from './services/simpleElevenLabsService';

const SimpleConversationPage = ({ onComplete }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const chatContainerRef = useRef(null);

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get API key
        const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
        console.log('🔑 API Key check:', apiKey ? 'Found' : 'Missing');
        
        if (!apiKey) {
          throw new Error('ElevenLabs API key not found in environment variables');
        }
        
        // Initialize service
        simpleElevenLabsService.initialize(apiKey);
        
        // Set up event handlers
        simpleElevenLabsService.onConnectionChange = (connected) => {
          setIsConnected(connected);
          if (connected) {
            addMessage('system', 'Connected to your financial AI therapist! How can I help you with your finances today?');
          }
        };
        
        simpleElevenLabsService.onMessage = (data) => {
          console.log('📨 Agent message received:', data);
        };
        
        simpleElevenLabsService.onError = (error) => {
          console.error('Service error:', error);
          setError(error.message);
        };
        
        // Start conversation
        console.log('🚀 Starting conversation...');
        await simpleElevenLabsService.startConversation();
        
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      simpleElevenLabsService.endConversation();
    };
  }, []);

  // Monitor speaking status
  useEffect(() => {
    const checkSpeaking = () => {
      setIsAISpeaking(simpleElevenLabsService.isSpeaking());
    };
    
    const interval = setInterval(checkSpeaking, 200);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (type, content) => {
    const message = {
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentInput.trim() || !isConnected) return;

    const message = currentInput.trim();
    addMessage('user', message);
    
    // Send to agent
    const success = simpleElevenLabsService.sendTextMessage(message);
    if (!success) {
      addMessage('system', 'Failed to send message. Please check connection.');
    }
    
    setCurrentInput('');
  };

  const testConnection = async () => {
    try {
      setError(null);
      console.log('🧪 Testing connection...');
      
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=agent_2501k20tsbcjeym9t8acz5j5cgw6`, {
        headers: { 'xi-api-key': apiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ Connection test successful!\n\nSigned URL received: ${data.signed_url?.slice(0, 50)}...`);
      } else {
        const errorText = await response.text();
        alert(`❌ Connection test failed: ${response.status}\n${errorText}`);
      }
    } catch (error) {
      alert(`❌ Test error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Financial AI Therapist
          </h1>
          <p className="text-white/80 mb-4">
            Chat with your ElevenLabs AI agent about your finances
          </p>
          
          {/* Status */}
          <div className="flex justify-center gap-4 items-center mb-4">
            <div className={`px-4 py-2 rounded-full border ${
              isConnected 
                ? 'bg-green-500/20 border-green-400/30 text-green-300' 
                : 'bg-red-500/20 border-red-400/30 text-red-300'
            }`}>
              {isLoading ? '🔄 Connecting...' : 
               isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
            
            {isAISpeaking && (
              <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30">
                <span className="text-blue-300 text-sm">🔊 AI Speaking</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6">
            <div className="text-red-300 text-sm mb-3">
              <strong>Error:</strong> {error}
            </div>
            <div className="flex gap-2">
              <button
                onClick={testConnection}
                className="px-3 py-1 bg-red-500/30 text-red-200 rounded text-xs hover:bg-red-500/40"
              >
                Test Connection
              </button>
              <button
                onClick={() => setError(null)}
                className="px-3 py-1 text-red-300 hover:text-red-100 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div 
          ref={chatContainerRef}
          className="bg-black/80 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20 h-96 overflow-y-auto"
        >
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-white/60 py-8">
                {isLoading ? 'Connecting to your AI therapist...' : 
                 isConnected ? 'Connected! Send a message to start the conversation.' :
                 'Waiting for connection...'}
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                      ? 'bg-green-600/20 border border-green-400/30 text-green-300'
                      : 'bg-white/10 text-white border border-white/20'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={
                  isConnected 
                    ? "Type your message about finances..." 
                    : "Waiting for connection..."
                }
                className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!currentInput.trim() || !isConnected}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
          
          {/* Debug Info */}
          <div className="mt-3 text-xs text-white/60 text-center">
            Agent: agent_2501k20tsbcjeym9t8acz5j5cgw6 | 
            Status: {isConnected ? 'Connected' : 'Disconnected'} | 
            Messages: {messages.length}
          </div>
        </div>

        {/* Continue Button */}
        {messages.length > 4 && (
          <div className="text-center mt-6">
            <button
              onClick={() => onComplete?.({}, [], { archetype: 'The Balanced Explorer' })}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
            >
              Complete Session & Continue
            </button>
            <p className="text-white/60 text-sm mt-3">
              Continue to your personalized action plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleConversationPage;