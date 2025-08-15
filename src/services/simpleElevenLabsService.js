// Simple ElevenLabs Conversational AI Service
// Focused implementation that works with your specific API permissions

class SimpleElevenLabsService {
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
    this.onConnectionChange = null;
    this.onMessage = null;
    this.onError = null;
    
    // Audio handling
    this.isPlaying = false;
    this.currentAudio = null;
  }

  // Initialize with API key
  initialize(apiKey) {
    this.apiKey = apiKey;
    console.log('🤖 Simple ElevenLabs Service initialized');
    console.log('🔑 API Key:', apiKey ? `${apiKey.slice(0, 8)}...` : 'Missing');
  }

  // Start conversation - get signed URL and connect
  async startConversation() {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not provided');
    }

    try {
      console.log('🔗 Getting signed URL for agent:', this.agentId);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${this.agentId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);
      
      const signedUrl = data.signed_url;
      console.log('✅ Got signed URL, connecting...');
      
      // Connect to WebSocket
      await this.connectWebSocket(signedUrl);
      
      return signedUrl;
      
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      this.onError?.(error);
      throw error;
    }
  }

  // Connect to WebSocket
  async connectWebSocket(signedUrl) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to WebSocket...');
        this.websocket = new WebSocket(signedUrl);
        
        this.websocket.onopen = () => {
          console.log('🔌 WebSocket connected!');
          this.isConnected = true;
          this.onConnectionChange?.(true);
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message:', data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ Error parsing message:', error);
          }
        };

        this.websocket.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.onConnectionChange?.(false);
        };

        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnected = false;
          this.onConnectionChange?.(false);
          this.onError?.(error);
          reject(error);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
        
      } catch (error) {
        console.error('❌ WebSocket connection error:', error);
        reject(error);
      }
    });
  }

  // Handle incoming messages
  handleMessage(data) {
    switch (data.type) {
      case 'conversation_initiation_metadata':
        console.log('🎯 Conversation started!', data);
        if (data.conversation_initiation_metadata_event?.conversation_id) {
          this.conversationId = data.conversation_initiation_metadata_event.conversation_id;
        }
        // Send welcome message to start the conversation
        this.sendTextMessage("Hello! I'm ready to discuss my finances with you.");
        break;
        
      case 'audio':
        console.log('🔊 Received audio from agent');
        if (data.audio_event?.audio_base_64) {
          this.playAudio(data.audio_event.audio_base_64);
        }
        break;
        
      case 'user_transcript':
        console.log('📝 User transcript:', data);
        break;
        
      case 'agent_response':
        console.log('🤖 Agent response:', data);
        this.onMessage?.(data);
        break;
        
      case 'ping':
        // Send pong to keep connection alive
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

  // Send text message to agent
  sendTextMessage(text) {
    if (!this.isConnected || !this.websocket) {
      console.error('❌ Not connected to agent');
      return false;
    }

    try {
      const message = {
        type: 'conversation_input',
        conversation_input: {
          type: 'text_input',
          text_input: {
            text: text
          }
        }
      };
      
      console.log('📤 Sending text message:', text);
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ Error sending text message:', error);
      return false;
    }
  }

  // Play audio response
  async playAudio(audioBase64) {
    try {
      // Convert base64 to audio blob
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
        console.log('🔊 Audio playback finished');
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.isPlaying = false;
      };

      await audio.play();
      console.log('🔊 Playing agent response');
      
    } catch (error) {
      console.error('❌ Failed to play audio:', error);
    }
  }

  // Stop current audio
  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.isPlaying = false;
    }
  }

  // End conversation
  async endConversation() {
    this.stopAudio();
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.isConnected = false;
    console.log('👋 Conversation ended');
  }

  // Check if agent is speaking
  isSpeaking() {
    return this.isPlaying;
  }

  // Check connection status
  isConnectedToAgent() {
    return this.isConnected;
  }
}

// Export singleton instance
export const simpleElevenLabsService = new SimpleElevenLabsService();
export default simpleElevenLabsService;