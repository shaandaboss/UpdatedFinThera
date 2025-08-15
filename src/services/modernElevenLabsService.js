// Modern ElevenLabs Conversational AI Service
// Uses the official @elevenlabs/client SDK for reliable agent connections

class ModernElevenLabsService {
  constructor() {
    this.agentId = 'agent_2501k20tsbcjeym9t8acz5j5cgw6';
    this.apiKey = 'sk_3fa9899ceffa2a23d809779919241a6594be1c86ae12c84a';
    this.conversation = null;
    this.isConnected = false;
    this.isRecording = false;
    this.isPlaying = false;
    
    // Event callbacks
    this.onConnectionChange = null;
    this.onMessage = null;
    this.onError = null;
    this.onUserTranscript = null;
    this.onAgentResponse = null;
  }

  // Initialize with API key (uses hardcoded key by default)
  async initialize(apiKey = null) {
    // Use provided key or fallback to hardcoded key
    if (apiKey) {
      this.apiKey = apiKey;
    }
    console.log('🤖 Modern ElevenLabs Service initialized');
    console.log('🔑 API Key:', this.apiKey ? `${this.apiKey.slice(0, 8)}...` : 'Missing');
    console.log('🎯 Agent ID:', this.agentId);
    
    // Test basic API connectivity first
    await this.testBasicAPI();
    
    try {
      // Request microphone access upfront
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Microphone access granted');
    } catch (error) {
      console.warn('⚠️ Microphone access denied:', error);
      if (this.onError) {
        this.onError(new Error('Microphone access is required for voice conversation'));
      }
    }
  }

  // Test basic API connectivity by checking agent access
  async testBasicAPI() {
    try {
      console.log('🧪 Testing ElevenLabs agent API connectivity...');
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${this.agentId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });
      
      console.log('📡 Agent API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Agent API test successful! Got signed URL:', data.signed_url ? 'YES' : 'NO');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Agent API test failed:', errorText);
        
        // Check for common errors
        if (response.status === 404) {
          throw new Error(`Agent not found. Please verify agent ID: ${this.agentId}`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(`API key authentication failed. Please check your ElevenLabs API key permissions.`);
        } else {
          throw new Error(`Agent API test failed: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error('❌ Agent API test error:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  // Start conversation with the agent
  async startConversation() {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not provided');
    }

    try {
      console.log('🚀 Starting conversation with agent...');
      console.log('🔑 Using API Key:', this.apiKey ? `${this.apiKey.slice(0, 8)}...${this.apiKey.slice(-4)}` : 'Missing');
      console.log('🎯 Agent ID:', this.agentId);
      
      // Dynamic import of ElevenLabs client
      const { Conversation } = await import('@elevenlabs/client');
      console.log('✅ ElevenLabs client imported successfully');
      
      // Start conversation session
      this.conversation = await Conversation.startSession({
        agentId: this.agentId,
        onConnect: () => {
          console.log('✅ Connected to ElevenLabs agent successfully!');
          this.isConnected = true;
          if (this.onConnectionChange) {
            this.onConnectionChange(true);
          }
        },
        onDisconnect: () => {
          console.log('🔌 Disconnected from ElevenLabs agent');
          this.isConnected = false;
          if (this.onConnectionChange) {
            this.onConnectionChange(false);
          }
        },
        onMessage: (message) => {
          console.log('📨 Agent message received:', message);
          
          // Handle different message types
          if (message.type === 'user_transcript') {
            console.log('📝 User transcript:', message.user_transcript?.text);
            if (this.onUserTranscript && message.user_transcript?.text) {
              this.onUserTranscript(message.user_transcript.text);
            }
          } else if (message.type === 'agent_response') {
            console.log('🤖 Agent response text:', message.agent_response?.text);
            if (this.onAgentResponse && message.agent_response?.text) {
              this.onAgentResponse(message.agent_response.text);
            }
          }
          
          if (this.onMessage) {
            this.onMessage(message);
          }
        },
        onError: (error) => {
          console.error('❌ Agent error:', error);
          if (this.onError) {
            this.onError(error);
          }
        },
        onStatusChange: (status) => {
          console.log('📊 Agent status change:', status);
        },
        onModeChange: (mode) => {
          console.log('🔄 Agent mode change:', mode);
        }
      });

      console.log('🎉 Conversation session created successfully');
      return this.conversation;
      
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  // Start recording user's voice
  async startRecording() {
    if (!this.conversation) {
      throw new Error('No active conversation');
    }

    try {
      console.log('🎤 Starting voice recording...');
      // The ElevenLabs SDK handles recording internally
      await this.conversation.startRecording();
      this.isRecording = true;
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  }

  // Stop recording user's voice
  async stopRecording() {
    if (!this.conversation) {
      return;
    }

    try {
      console.log('🛑 Stopping voice recording...');
      await this.conversation.stopRecording();
      this.isRecording = false;
      console.log('✅ Recording stopped');
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
    }
  }

  // Send text message to agent
  async sendTextMessage(text) {
    if (!this.conversation) {
      throw new Error('No active conversation');
    }

    try {
      console.log('📝 Sending text message:', text);
      await this.conversation.sendMessage(text);
    } catch (error) {
      console.error('❌ Failed to send text message:', error);
      throw error;
    }
  }

  // End the conversation
  async endConversation() {
    if (this.conversation) {
      try {
        console.log('👋 Ending conversation...');
        await this.conversation.endSession();
        this.conversation = null;
        this.isConnected = false;
        this.isRecording = false;
        this.isPlaying = false;
        console.log('✅ Conversation ended');
      } catch (error) {
        console.error('❌ Error ending conversation:', error);
      }
    }
  }

  // Check if agent is currently speaking
  isSpeaking() {
    // The SDK manages this internally
    return this.isPlaying;
  }

  // Check if currently recording
  isCurrentlyRecording() {
    return this.isRecording;
  }

  // Check connection status
  isConnectedToAgent() {
    return this.isConnected;
  }

  // Get conversation ID
  getConversationId() {
    return this.conversation?.getId() || null;
  }

  // Set volume (if supported)
  setVolume(volume) {
    if (this.conversation && this.conversation.setVolume) {
      this.conversation.setVolume(volume);
    }
  }
}

// Export singleton instance
export const modernElevenLabsService = new ModernElevenLabsService();
export default modernElevenLabsService;