// ElevenLabs Conversational AI Agent Service
// Handles real-time conversation with your custom ElevenLabs agent

class ElevenLabsAgentService {
  constructor() {
    this.agentId = 'agent_2501k20tsbcjeym9t8acz5j5cgw6';
    this.apiKey = null;
    this.websocket = null;
    this.isConnected = false;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.conversationId = null;
    
    // Event callbacks
    this.onMessage = null;
    this.onAudioReceived = null;
    this.onConnectionChange = null;
    this.onError = null;
    
    // Audio handling
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentAudio = null;
  }

  // Initialize with API key
  initialize(apiKey = 'sk_3fa9899ceffa2a23d809779919241a6594be1c86ae12c84a') {
    this.apiKey = apiKey;
    console.log('🤖 ElevenLabs Agent Service initialized with API key');
  }

  // Test API connectivity
  async testApiConnection() {
    try {
      console.log('🧪 Testing basic API connectivity...');
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': this.apiKey
        }
      });
      
      console.log('🧪 User API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API test successful:', data);
        return { success: true, data };
      } else {
        const errorText = await response.text();
        console.error('❌ API test failed:', errorText);
        return { success: false, error: `${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('❌ API test error:', error);
      return { success: false, error: error.message };
    }
  }

  // Start conversation with the agent
  async startConversation() {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not provided');
    }

    try {
      console.log('🔗 Starting conversation with agent:', this.agentId);
      
      try {
        // First, try to get signed URL for WebSocket connection (for private agents)
        console.log('🔐 Attempting signed URL approach...');
        const signedUrlResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${this.agentId}`, {
          method: 'GET',
          headers: {
            'xi-api-key': this.apiKey
          }
        });

        console.log('📡 Signed URL Response status:', signedUrlResponse.status);
        
        if (signedUrlResponse.ok) {
          const signedUrlData = await signedUrlResponse.json();
          console.log('📦 Signed URL data:', signedUrlData);
          
          this.signedUrl = signedUrlData.signed_url;
          console.log('✅ Got signed URL, connecting to WebSocket...');
        } else {
          console.log('⚠️ Signed URL failed, trying direct connection...');
          this.signedUrl = null;
        }
      } catch (signedUrlError) {
        console.log('⚠️ Signed URL error, trying direct connection:', signedUrlError.message);
        this.signedUrl = null;
      }
      
      // Connect to WebSocket (either with signed URL or direct)
      await this.connectWebSocket();
      
      return this.signedUrl || 'direct_connection';
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      this.onError?.(error);
      throw error;
    }
  }

  // Connect to WebSocket for real-time communication
  async connectWebSocket() {
    // Use signed URL if available, otherwise direct connection for public agents
    const wsUrl = this.signedUrl || `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.agentId}`;
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('🔌 WebSocket connected to ElevenLabs agent');
      this.isConnected = true;
      this.onConnectionChange?.(true);
    };

    this.websocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('❌ Error handling WebSocket message:', error);
      }
    };

    this.websocket.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.onConnectionChange?.(false);
    };

    this.websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.onError?.(error);
    };
  }

  // Handle incoming WebSocket messages
  async handleWebSocketMessage(data) {
    switch (data.type) {
      case 'conversation_initiation_metadata':
        console.log('🎯 Conversation initiated:', data);
        // Extract conversation ID from metadata
        if (data.conversation_initiation_metadata_event?.conversation_id) {
          this.conversationId = data.conversation_initiation_metadata_event.conversation_id;
          console.log('📝 Conversation ID:', this.conversationId);
        }
        break;
        
      case 'audio':
        // Received audio response from agent
        if (data.audio_event?.audio_base_64) {
          await this.playAudioResponse(data.audio_event.audio_base_64);
        }
        break;
        
      case 'interruption':
        console.log('⚠️ Conversation interrupted');
        this.stopCurrentAudio();
        break;
        
      case 'ping':
        // Send pong response to keep connection alive
        this.websocket.send(JSON.stringify({ type: 'pong' }));
        break;
        
      case 'error':
        console.error('❌ Agent error:', data);
        this.onError?.(new Error(data.message || 'Agent error'));
        break;
        
      default:
        console.log('📨 Unknown message type:', data.type, data);
    }
  }

  // Start recording user's voice
  async startRecording() {
    if (this.isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Create audio processor for real-time streaming
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (this.isRecording && this.isConnected) {
          const audioData = event.inputBuffer.getChannelData(0);
          this.sendAudioChunk(audioData);
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      this.isRecording = true;
      console.log('🎤 Recording started');
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.onError?.(error);
      throw error;
    }
  }

  // Stop recording user's voice
  stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Send end of input signal
    if (this.isConnected) {
      this.websocket.send(JSON.stringify({
        type: 'audio_event',
        audio_event: {
          type: 'input_audio_buffer_speech_stopped'
        }
      }));
    }

    console.log('🎤 Recording stopped');
  }

  // Send audio chunk to the agent
  sendAudioChunk(audioData) {
    if (!this.isConnected || !this.websocket) return;

    // Convert Float32Array to Int16Array
    const int16Data = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      int16Data[i] = Math.max(-1, Math.min(1, audioData[i])) * 0x7FFF;
    }

    // Convert to base64
    const audioBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(int16Data.buffer)));

    this.websocket.send(JSON.stringify({
      type: 'audio_event',
      audio_event: {
        type: 'input_audio_buffer_append',
        audio: audioBase64
      }
    }));
  }

  // Play audio response from agent
  async playAudioResponse(audioBase64) {
    try {
      const audioData = atob(audioBase64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isPlaying = true;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.isPlaying = false;
        console.log('🔊 Agent response finished playing');
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        this.currentAudio = null;
        this.isPlaying = false;
      };

      await audio.play();
      console.log('🔊 Playing agent response');
      
    } catch (error) {
      console.error('❌ Failed to play audio response:', error);
      this.onError?.(error);
    }
  }

  // Stop current audio playback
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isPlaying = false;
      console.log('🛑 Stopped current audio');
    }
  }

  // Send text message to agent (fallback for non-voice input)
  async sendTextMessage(text) {
    if (!this.isConnected || !this.websocket) {
      throw new Error('Not connected to agent');
    }

    this.websocket.send(JSON.stringify({
      type: 'text_event',
      text_event: {
        type: 'input_text',
        text: text
      }
    }));

    console.log('📝 Sent text to agent:', text);
  }

  // End the conversation
  async endConversation() {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.currentAudio) {
      this.stopCurrentAudio();
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.isConnected = false;
    console.log('👋 Conversation ended');
  }

  // Get conversation history (if needed for analysis)
  async getConversationHistory() {
    if (!this.conversationId || !this.apiKey) return null;

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${this.conversationId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('❌ Failed to get conversation history:', error);
    }

    return null;
  }

  // Check if agent is currently speaking
  isSpeaking() {
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
}

// Export singleton instance
export const elevenLabsAgentService = new ElevenLabsAgentService();
export default elevenLabsAgentService;