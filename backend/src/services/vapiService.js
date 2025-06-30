/**
 * Vapi Service
 * Service layer for interacting with Vapi API
 * 
 * @author Abdur Rehman
 * @description Handles all Vapi API interactions for conversational AI and voice responses
 * 
 * TECHNICAL OVERVIEW:
 * - Uses Vapi Chat API for text generation with GPT-4o model
 * - Manages conversation sessions and continuity across multiple exchanges
 * - Provides enhanced TTS configuration for realistic voice synthesis
 * - Implements session-based chat history for context preservation
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config.js';

/**
 * Vapi API client with default configuration
 * 
 * ENDPOINT: https://api.vapi.ai (configured in config.vapi.baseUrl)
 * AUTHENTICATION: Bearer token authentication with Vapi API key
 * TIMEOUT: 30 seconds for all API calls to prevent hanging requests
 */
const vapiClient = axios.create({
  baseURL: config.vapi.baseUrl,
  headers: {
    'Authorization': `Bearer ${config.vapi.apiKey}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
});



/**
 * Default assistant configuration for NovaVA
 * 
 * TECHNICAL DETAILS:
 * - Uses OpenAI GPT-4o model for high-quality text generation
 * - Temperature 0.8 for balanced creativity and consistency
 * - Max 200 tokens to keep responses concise for voice playback
 * - System prompt includes current date/time for context awareness
 * - Configured for natural, conversational responses without markdown
 */
// Add today's date to the system prompt for model context
const today = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const defaultAssistantConfig = {
  model: {
    provider: 'openai', // Using OpenAI as the LLM provider
    model: 'gpt-4o', // Latest GPT-4 model for best performance
    temperature: 0.8, // Balanced creativity (0=deterministic, 1=creative)
    maxTokens: 200, // Limit response length for TTS compatibility
    messages: [
      {
        role: 'system',
        content: `You are NovaVA, a smart virtual assistant designed for natural, human-like conversation. Today is ${today}, and the current time is ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}. You speak clearly and conversationally, just like a real person would. Always respond in a warm, friendly tone without using any markdown formatting, abbreviations, or technical jargon. Keep your responses concise, to the point, and easy to understand. You help with quick questions and engage in natural dialogue as if you were speaking face-to-face with someone. Never use bullet points, asterisks, or any special formatting - just speak naturally like a human would in a conversation.`
      }
    ]
  },

  firstMessage: "Hello there! I'm NovaVA, your virtual assistant. I'm here to chat and help you with whatever you need. What's on your mind today?",
  recordingEnabled: true, // Enable voice recording capabilities
  endCallMessage: "It was great talking with you! Take care and feel free to reach out anytime you need assistance.",
  maxDurationSeconds: 600 // 10 minute maximum conversation length
};

/**
 * In-memory store for chat sessions
 * 
 * SESSION MANAGEMENT:
 * - Stores conversation continuity data using sessionId as key
 * - Contains lastChatId for Vapi conversation threading
 * - Tracks message count and timestamps for analytics
 * - In production, this should be stored in a database (Redis/MongoDB)
 */
const chatSessions = new Map();

/**
 * VapiService class - Main service for Vapi API interactions
 * 
 * CORE FUNCTIONALITY:
 * 1. Text generation using Vapi Chat API with session continuity
 * 2. TTS configuration management for voice synthesis
 * 3. Chat history management and session tracking
 * 4. Error handling and fallback responses
 */
class VapiService {






  /**
   * Generate text response using Vapi Chat API with session continuity
   * 
   * API ENDPOINT: POST /chat (Vapi Chat API)
   * 
   * TECHNICAL FLOW:
   * 1. Manages session continuity using previousChatId for threaded conversations
   * 2. Uses either configured assistantId or transient assistant configuration
   * 3. Sends user message to Vapi Chat API for GPT-4o processing
   * 4. Extracts AI response from Vapi's structured response format
   * 5. Updates session store with conversation metadata for continuity
   * 6. Returns formatted response with session data for frontend
   * 
   * CONVERSATION CONTINUITY:
   * - New conversations: Use assistant config or assistantId
   * - Continuing conversations: Use previousChatId to maintain context
   * - Session data stored in-memory Map for conversation threading
   * 
   * @param {string} message - User's message input
   * @param {string} sessionId - Session ID for conversation continuity (auto-generated if null)
   * @returns {Promise<object>} Generated response data with session info
   */
  async generateTextResponse(message, sessionId = null) {
    try {
      // SESSION MANAGEMENT: Use provided sessionId or generate a new one
      const currentSessionId = sessionId || uuidv4();
      
      // Check if this is a continuing session by looking up stored session data
      const sessionData = chatSessions.get(currentSessionId);
      const isContinuingSession = sessionId && sessionData && sessionData.lastChatId;

      // PAYLOAD CONSTRUCTION: Build chat request based on session state
      let chatPayload = {
        input: message // User's message to be processed by GPT-4o
      };

      if (isContinuingSession) {
        // CONTINUING CONVERSATION: Use previousChatId to maintain context thread
        chatPayload.previousChatId = sessionData.lastChatId;
        
        // Still need assistant information for continuation
        if (config.vapi.defaultAssistantId) {
          chatPayload.assistantId = config.vapi.defaultAssistantId;
        } else {
          chatPayload.assistant = { ...defaultAssistantConfig };
        }
      } else {
        // NEW CONVERSATION: Use assistantId or transient assistant
        if (config.vapi.defaultAssistantId) {
          // Use pre-configured assistant for consistent behavior
          chatPayload.assistantId = config.vapi.defaultAssistantId;
        } else {
          // Use transient assistant with our custom NovaVA configuration
          chatPayload.assistant = { ...defaultAssistantConfig };
        }
      }

      // API CALL: Send request to Vapi Chat API for text generation
      const response = await vapiClient.post('/chat', chatPayload);

      // RESPONSE EXTRACTION: Parse AI response from Vapi's structured format
      let aiResponse = '';
      
      if (response.data.output && Array.isArray(response.data.output)) {
        // Find the assistant's response in the output array (standard format)
        const assistantMessage = response.data.output.find(msg => msg.role === 'assistant');
        if (assistantMessage && assistantMessage.content) {
          aiResponse = assistantMessage.content;
        }
      } else if (response.data.content) {
        // Alternative response format
        aiResponse = response.data.content;
      } else if (response.data.message) {
        // Another possible response format
        aiResponse = response.data.message;
      } else if (response.data.response) {
        // Final fallback format
        aiResponse = response.data.response;
      }

      // FALLBACK RESPONSE: Provide helpful message if no response extracted
      if (!aiResponse) {
        aiResponse = "I'm here to help! Could you please rephrase your question?";
      }

      // SESSION PERSISTENCE: Store conversation metadata for continuity
      const updatedSessionData = {
        sessionId: currentSessionId,
        lastChatId: response.data.id, // Vapi chat ID for threading
        lastMessageAt: new Date().toISOString(),
        messagesCount: (sessionData?.messagesCount || 0) + 1,
        createdAt: sessionData?.createdAt || new Date().toISOString()
      };
      chatSessions.set(currentSessionId, updatedSessionData);



      // RESPONSE FORMATTING: Return structured data for frontend consumption
      return {
        success: true,
        data: {
          response: aiResponse, // Generated text from GPT-4o
          sessionId: currentSessionId, // Session identifier for continuity
          chatId: response.data.id, // Vapi chat ID for future threading
          timestamp: new Date().toISOString(),
          canPlayAudio: true, // Indicates TTS capability available
          vapiData: {
            id: response.data.id,
            status: response.data.status,
            cost: response.data.cost // Vapi API usage cost tracking
          }
        },
        message: 'Text response generated successfully using Vapi Chat API'
      };

    } catch (error) {
      // ERROR HANDLING: Provide meaningful error messages for debugging
      throw new Error(`Failed to generate text response: ${error.response?.data?.message || error.message}`);
    }
  }



  /**
   * Get enhanced TTS configuration for high-quality browser voices
   * 
   * TTS STRATEGY:
   * - Currently returns enhanced browser TTS configuration as primary method
   * - Provides realistic voice settings for immediate playback
   * - Future integration point for Vapi's TTS infrastructure
   * - Includes SSML support and natural speech enhancements
   * 
   * TECHNICAL IMPLEMENTATION:
   * - Enhanced browser voices with specific voice preferences
   * - Optimized speech rate (0.85) for natural delivery
   * - SSML support for improved prosody and pauses
   * - Fallback voice list for cross-platform compatibility
   * 
   * @param {string} text - Text content to convert to speech
   * @param {object} options - Voice configuration options
   * @returns {Promise<object>} TTS configuration for audio playback
   */
  async getTTSConfig(text, options = {}) {
    try {
      // INPUT VALIDATION: Ensure text is provided and valid
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Text is required for TTS generation');
      }

      console.log('🎵 Generating enhanced TTS configuration for realistic browser playback');

      // TTS CONFIGURATION: Return enhanced browser TTS setup for immediate playback
      return {
        success: true,
        data: {
          text: text.trim(), // Clean text for TTS processing
          audioUrl: null, // Will use enhanced browser TTS for immediate playback
          timestamp: new Date().toISOString(),
          voiceProvider: 'enhanced-browser', // Primary TTS method
          voiceId: options.voiceId || 'enhanced-natural',
          method: 'enhanced-browser-tts',
          voiceSettings: {
            rate: 0.85, // Slightly slower for more natural speech
            pitch: 1.0, // Normal pitch
            volume: 1.0, // Full volume
            lang: 'en-US', // English US locale
            voiceName: options.voiceName || 'Google US English', // Prefer specific voices
            quality: 'high' // Request highest quality synthesis
          },
          enhancedSettings: {
            // VOICE PREFERENCES: Ordered list of high-quality browser voices
            preferredVoices: [
              'Google US English',
              'Microsoft Zira - English (United States)', 
              'Microsoft David - English (United States)',
              'Alex', // macOS voice
              'Samantha', // macOS voice
              'Karen', // macOS voice
              'Daniel', // macOS voice
              'Moira', // macOS voice
              'Fiona' // macOS voice
            ],
            useSSML: true, // Use SSML for better speech quality when available
            pauseAfterSentences: true, // Natural pauses between sentences
            naturalPauses: true, // Enhanced pause detection
            improvedProsody: true // Better intonation and rhythm
          }
        },
        message: 'Enhanced TTS configuration generated for realistic browser playback'
      };

    } catch (error) {
      console.error('❌ TTS Config Error:', error.message);
      throw new Error(`Failed to generate TTS config: ${error.message}`);
    }
  }



  /**
   * Get chat history for a session
   * 
   * SESSION RETRIEVAL:
   * - Retrieves stored conversation metadata from in-memory store
   * - Returns session continuity data for frontend display
   * - Provides message count and timing information
   * - Handles missing sessions gracefully with empty response
   * 
   * @param {string} sessionId - Session ID to retrieve history for
   * @returns {Promise<object>} Chat history and session metadata
   */
  async getChatHistory(sessionId) {
    try {
      // SESSION LOOKUP: Retrieve session data from in-memory store
      const sessionData = chatSessions.get(sessionId);
      
      if (!sessionData) {
        // EMPTY SESSION: Return structured empty response for new sessions
        return {
          success: true,
          data: {
            sessionId,
            messages: [], // Empty message array
            totalMessages: 0,
            messagesCount: 0
          },
          message: 'No chat history found for this session'
        };
      }
      
      // SESSION DATA: Return stored conversation metadata
      return {
        success: true,
        data: {
          sessionId,
          lastChatId: sessionData.lastChatId, // For conversation threading
          lastMessageAt: sessionData.lastMessageAt, // Timestamp of last activity
          messagesCount: sessionData.messagesCount || 0, // Message counter
          createdAt: sessionData.createdAt || sessionData.lastMessageAt // Session creation time
        },
        message: 'Chat history retrieved successfully'
      };
    } catch (error) {
      logger.error('Failed to get chat history:', error);
      throw new Error(`Failed to get chat history: ${error.message}`);
    }
  }

  /**
   * Get session data for debugging
   * 
   * DEBUG UTILITY:
   * - Provides direct access to session data for troubleshooting
   * - Returns raw session object or null if not found
   * - Useful for interview demonstrations and debugging
   * 
   * @param {string} sessionId - Session ID to retrieve
   * @returns {object|null} Session data or null if not found
   */
  getSessionData(sessionId) {
    const sessionData = chatSessions.get(sessionId);
    return sessionData || null;
  }

  /**
   * @deprecated This method is no longer needed with the simplified session management
   * Get or create an assistant for a session
   * 
   * LEGACY METHOD:
   * - Previously used for complex assistant management
   * - Now simplified to use default assistant configuration
   * - Kept for backward compatibility
   */
  async getOrCreateSessionAssistant(sessionId) {
    return null;
  }




}

// EXPORT: Singleton instance for consistent service usage across the application
export const vapiService = new VapiService();
export default vapiService; 