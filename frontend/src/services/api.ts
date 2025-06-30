/**
 * Frontend API Service
 * 
 * API SERVICE LAYER:
 * - Centralized service for all backend API communications
 * - Handles HTTP requests with automatic logging and error handling
 * - Provides typed interfaces for all API endpoints
 * - Manages request/response transformation and validation
 * 
 * BACKEND ENDPOINTS INTEGRATION:
 * - Text conversations: POST /api/conversation/text -> Vapi Chat API
 * - TTS configuration: POST /api/conversation/tts -> Enhanced browser TTS config
 * - Chat history: GET /api/conversation/history/:sessionId -> Session metadata
 * - Health checks: GET /api/ -> Server status and connection info
 * 
 * TECHNICAL FEATURES:
 * - Axios instance with automatic request/response logging
 * - 30-second timeout for all API calls
 * - Structured error handling with detailed error information
 * - Response validation and data extraction
 * - Environment-based API URL configuration
 */

import axios, { AxiosResponse, AxiosError } from 'axios'
import type {
  ApiResponse,
  TextConversationRequest,
  TextConversationResponse,

  ApiError,
  ChatHistoryData,
} from '@/types'

// AXIOS CONFIGURATION: Configure axios instance for backend communication
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Use environment variable or default to /api
  timeout: 30000, // 30 seconds timeout to match backend Vapi API timeouts
  headers: {
    'Content-Type': 'application/json', // JSON content type for all requests
  },
})

// REQUEST INTERCEPTOR: Log all outgoing API requests for debugging and monitoring
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data, // Request payload for POST/PUT requests
      params: config.params, // URL parameters for GET requests
    })
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// RESPONSE INTERCEPTOR: Log all API responses and handle errors centrally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status, // HTTP status code
      data: response.data, // Response payload
    })
    return response
  },
  (error: AxiosError) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status, // HTTP error status
      data: error.response?.data, // Error response body
      message: error.message, // Error message
    })
    return Promise.reject(formatApiError(error))
  }
)

// ERROR FORMATTER: Convert axios errors to standardized ApiError format
function formatApiError(error: AxiosError): ApiError {
  if (error.response) {
    // SERVER ERROR: Server responded with error status (4xx, 5xx)
    const data = error.response.data as any
    return {
      message: data?.error || data?.message || `Server error: ${error.response.status}`,
      status: error.response.status,
      code: data?.code,
      details: data, // Include full error response for debugging
    }
  } else if (error.request) {
    // NETWORK ERROR: Request was made but no response received (connection issues)
    return {
      message: 'Network error: Unable to connect to server',
      code: 'NETWORK_ERROR',
    }
  } else {
    // REQUEST SETUP ERROR: Something happened in setting up the request
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'REQUEST_ERROR',
    }
  }
}

// API SERVICE FUNCTIONS: Centralized functions for all backend endpoints
export const apiService = {
  // HEALTH & STATUS ENDPOINTS
  
  /**
   * Get server health status
   * 
   * ENDPOINT: GET /api/
   * PURPOSE: Check backend server connectivity and status
   * RETURNS: Server info with version, timestamp, and service status
   */
  async getHealth(): Promise<any> {
    // Use the root API endpoint instead of the health endpoint
    const response = await api.get('/')
    return {
      status: 'healthy',
      timestamp: response.data.timestamp,
      version: response.data.version || '1.0.0',
      services: {
        vapi: 'connected' // Indicates Vapi API connectivity
      }
    }
  },

  /**
   * Get server information
   * 
   * ENDPOINT: GET /api/
   * PURPOSE: Retrieve server metadata and status information
   */
  async getServerInfo(): Promise<any> {
    const response = await api.get('/')
    return response.data
  },

  // TEXT CONVERSATION ENDPOINTS

  /**
   * Send text message for conversation
   * 
   * ENDPOINT: POST /api/conversation/text
   * BACKEND FLOW: 
   * 1. Frontend API -> Backend route (/api/conversation/text)
   * 2. Backend -> vapiService.generateTextResponse()
   * 3. Vapi Service -> Vapi Chat API (POST /chat)
   * 4. Vapi Chat API -> OpenAI GPT-4o model
   * 5. Response flows back through the chain
   * 
   * TECHNICAL DETAILS:
   * - Sends user message and optional sessionId for continuity
   * - Backend manages session threading using Vapi's previousChatId
   * - Returns GPT-4o generated response with session metadata
   * - Includes Vapi chat ID for future conversation threading
   * 
   * @param {TextConversationRequest} request - Message and session data
   * @returns {Promise<TextConversationResponse>} Generated response from GPT-4o
   */
  async sendTextMessage(request: TextConversationRequest): Promise<TextConversationResponse> {
    const response = await api.post<ApiResponse<TextConversationResponse>>(
      '/conversation/text', // Backend endpoint for text conversations
      request // { message: string, sessionId?: string }
    )
    
    // RESPONSE VALIDATION: Ensure successful response with data
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to send text message')
    }
    
    return response.data.data // Extract TextConversationResponse from ApiResponse wrapper
  },

  // CHAT HISTORY ENDPOINTS

  /**
   * Get chat history for a session
   * 
   * ENDPOINT: GET /api/conversation/history/:sessionId
   * BACKEND FLOW:
   * 1. Frontend API -> Backend route with sessionId parameter
   * 2. Backend -> vapiService.getChatHistory(sessionId)
   * 3. Vapi Service -> Retrieves from in-memory session store
   * 4. Returns session metadata and continuity information
   * 
   * PURPOSE:
   * - Retrieve conversation metadata for session management
   * - Get message count and timing information
   * - Verify session continuity data for threading
   * 
   * @param {string} sessionId - Session identifier to retrieve history for
   * @returns {Promise<ChatHistoryData>} Session metadata and history information
   */
  async getChatHistory(sessionId: string): Promise<ChatHistoryData> {
    const response = await api.get<ApiResponse<ChatHistoryData>>(
      `/conversation/history/${sessionId}` // REST endpoint with sessionId parameter
    )
    
    // RESPONSE VALIDATION: Ensure successful response with data
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get chat history')
    }
    
    return response.data.data // Extract ChatHistoryData from ApiResponse wrapper
  },

  // TEXT-TO-SPEECH ENDPOINTS

  /**
   * Get TTS configuration for text
   * 
   * ENDPOINT: POST /api/conversation/tts
   * BACKEND FLOW:
   * 1. Frontend API -> Backend route with text and options
   * 2. Backend -> vapiService.getTTSConfig(text, options)
   * 3. Vapi Service -> Generates enhanced browser TTS configuration
   * 4. Returns optimized voice settings and playback configuration
   * 
   * CURRENT TTS IMPLEMENTATION:
   * - Returns enhanced browser TTS configuration for immediate playback
   * - Optimized voice settings (rate: 0.85, quality: high)
   * - Preferred voice list for cross-platform compatibility
   * - SSML support for better speech quality
   * 
   * FUTURE TTS INTEGRATION:
   * - Will integrate with Vapi's TTS infrastructure
   * - Support for premium voice models and audio URL generation
   * - Advanced voice customization and speaker selection
   * 
   * @param {string} text - Text content to convert to speech
   * @param {any} options - TTS configuration options (voice, rate, etc.)
   * @returns {Promise<any>} TTS configuration and playback settings
   */
  async getTTSConfig(text: string, options?: any): Promise<any> {
    const response = await api.post<ApiResponse<any>>(
      '/conversation/tts', // Backend endpoint for TTS configuration
      { text, options } // Request payload with text and voice options
    )
    
    // RESPONSE VALIDATION: Ensure successful response with data
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get TTS configuration')
    }
    
    return response.data.data // Extract TTS configuration from ApiResponse wrapper
  },
}

export default apiService 