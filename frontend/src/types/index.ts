/**
 * TypeScript Type Definitions for NovaVA Application
 * 
 * TYPE SYSTEM OVERVIEW:
 * - Defines all interfaces and types used throughout the application
 * - Ensures type safety for API requests/responses and component props
 * - Provides structured data models for chat messages, sessions, and API interactions
 * - Includes Vapi-specific types for chat API integration
 * 
 * MAIN TYPE CATEGORIES:
 * 1. API Response Types - Standard response wrappers and error handling
 * 2. Chat & Conversation Types - Message and session data structures
 * 3. Application State Types - Global app state management
 * 4. Component Props Types - React component interface definitions
 * 5. API Request/Response Types - Specific endpoint data contracts
 * 6. Utility Types - Helper types for pagination, loading states, etc.
 */

// API RESPONSE TYPES
/**
 * Standard API response wrapper
 * 
 * USAGE: All backend API endpoints return this structure
 * - Consistent success/error handling across the application
 * - Optional data payload for successful responses
 * - Error message for failed responses
 * - Additional message field for status information
 */
export interface ApiResponse<T = any> {
  success: boolean // Indicates if the API call was successful
  data?: T // Response payload (present on success)
  error?: string // Error message (present on failure)
  message?: string // Additional status or info message
}

// CHAT & CONVERSATION TYPES
/**
 * Individual chat message data structure
 * 
 * CORE MESSAGE MODEL:
 * - Used for all message types (user, assistant, system)
 * - Includes metadata for session tracking and display
 * - Compatible with Vapi Chat API message format
 * - Supports additional Vapi-specific properties for advanced features
 */
export interface ChatMessage {
  id: string // Unique message identifier (can be Vapi chat ID)
  type: 'user' | 'assistant' | 'system' // Message type for styling and behavior
  content: string // Message text content
  timestamp: string // ISO timestamp for message creation
  sessionId?: string // Optional session identifier for grouping

  isLoading?: boolean // Optional loading state for messages
  // Additional properties for Vapi chat messages
  time?: number // Message time in seconds (Vapi format)
  secondsFromStart?: number // Seconds from conversation start (Vapi format)
}

/**
 * Conversation session container
 * 
 * SESSION MANAGEMENT:
 * - Groups related messages in a conversation thread
 * - Tracks session metadata and timing
 * - Used for conversation continuity and UI organization
 * - Maps to backend session storage and Vapi conversation threading
 */
export interface ConversationSession {
  id: string // Unique session identifier
  createdAt: Date // Session creation timestamp
  updatedAt: Date // Last activity timestamp
  messages: ChatMessage[] // All messages in this session
  title?: string // Optional session title for UI display
}

// APPLICATION STATE TYPES
/**
 * Global application state structure
 * 
 * STATE MANAGEMENT:
 * - Tracks connection status to backend
 * - Manages current active session
 * - Stores all user sessions for navigation
 * - Handles global loading and error states
 * - Includes detailed service health information
 */
export interface AppState {
  isConnected: boolean // Backend connectivity status
  isLoading: boolean // Global loading state
  currentSession: ConversationSession | null // Active conversation session
  sessions: ConversationSession[] // All user sessions
  error: string | null // Global error message
  healthStatus?: {
    status: 'healthy' | 'degraded' | 'critical' // Overall system health
    services: any // Individual service statuses
    errors: string[] // Specific error messages
    connectionDetails: {
      vapi: boolean // Vapi/OpenAI connection status
      elevenlabs: boolean // ElevenLabs connection status
      vapiError?: string // Vapi connection error message
      elevenlabsError?: string // ElevenLabs connection error message
      networkError?: boolean // Network connectivity issue
    }
  }
}

// COMPONENT PROPS TYPES
/**
 * Props for ChatMessage component
 * 
 * COMPONENT INTERFACE:
 * - Defines required props for message rendering
 * - Used by ChatMessage component for individual message display
 */
export interface MessageProps {
  message: ChatMessage // Message data to render
}



// TEXT CONVERSATION API TYPES
/**
 * Request payload for text conversation API
 * 
 * API ENDPOINT: POST /api/conversation/text
 * BACKEND SERVICE: vapiService.generateTextResponse()
 * PURPOSE: Send user message and maintain session continuity
 */
export interface TextConversationRequest {
  message: string // User's text message
  sessionId?: string // Optional session ID for conversation threading
}

/**
 * Response from text conversation API
 * 
 * API ENDPOINT: POST /api/conversation/text
 * BACKEND SOURCE: Vapi Chat API with GPT-4o
 * PURPOSE: Deliver AI-generated response with session metadata
 */
export interface TextConversationResponse {
  response: string // AI-generated text response from GPT-4o
  sessionId: string // Session identifier (new or existing)
  chatId?: string // Vapi chat ID for conversation threading
  timestamp: string // Response generation timestamp
  type: 'text' // Response type identifier
  canPlayAudio: boolean // Indicates TTS capability availability
}







// HEALTH CHECK TYPES
/**
 * Server health check response
 * 
 * API ENDPOINT: GET /api/
 * PURPOSE: Monitor backend server status and service connectivity
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' // Overall server health status
  timestamp: string // Health check timestamp
  version: string // Server version information
  uptime: number // Server uptime in seconds
  services: {
    vapi: 'connected' | 'disconnected' // Vapi API connectivity status
    database?: 'connected' | 'disconnected' // Optional database status
  }
}

// ERROR HANDLING TYPES
/**
 * Standardized error structure
 * 
 * ERROR HANDLING:
 * - Used throughout the application for consistent error reporting
 * - Includes HTTP status codes and error categorization
 * - Provides detailed error information for debugging
 */
export interface ApiError {
  message: string // Human-readable error message
  status?: number // HTTP status code (if applicable)
  code?: string // Error code for categorization
  details?: any // Additional error details for debugging
}

// UTILITY TYPES
/**
 * Loading state enumeration
 * 
 * STATE MANAGEMENT:
 * - Standardized loading states across components
 * - Used for UI state management and user feedback
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Pagination parameters for list endpoints
 * 
 * API PAGINATION:
 * - Standard pagination interface for future list endpoints
 * - Supports both page-based and cursor-based pagination
 */
export interface PaginationParams {
  page?: number // Page number for page-based pagination
  limit?: number // Number of items per page
  cursor?: string // Cursor for cursor-based pagination
}

/**
 * Paginated response wrapper
 * 
 * API RESPONSES:
 * - Standard structure for paginated API responses
 * - Includes pagination metadata for UI controls
 */
export interface PaginatedResponse<T> {
  data: T[] // Array of paginated items
  pagination: {
    page: number // Current page number
    limit: number // Items per page
    total: number // Total number of items
    hasMore: boolean // Whether more pages exist
    nextCursor?: string // Cursor for next page (cursor-based pagination)
  }
}

// CHAT HISTORY TYPES
/**
 * Chat history data structure
 * 
 * API ENDPOINT: GET /api/conversation/history/:sessionId
 * BACKEND SOURCE: vapiService.getChatHistory()
 * PURPOSE: Retrieve session metadata and conversation continuity data
 */
export interface ChatHistoryData {
  sessionId: string // Session identifier
  assistantId?: string // Vapi assistant ID (if using pre-configured assistant)
  lastChatId?: string // Last Vapi chat ID for conversation threading
  lastMessage?: string // Last user message (for display)
  lastResponse?: string // Last assistant response (for display)
  messages?: ChatMessage[] // Optional full message history
  totalMessages?: number // Total message count in session
  createdAt?: string // Session creation timestamp
  updatedAt?: string // Last session update timestamp
}

// VAPI INTEGRATION TYPES
/**
 * Vapi-specific message format for raw API responses
 * 
 * VAPI INTEGRATION:
 * - Direct format from Vapi Chat API responses
 * - Used for processing raw Vapi data before conversion to ChatMessage
 * - Includes Vapi-specific timing and metadata fields
 */
export interface VapiChatMessage {
  role: 'user' | 'assistant' // Message role in conversation
  message: string // Message content
  time?: number // Message timestamp in seconds
  secondsFromStart?: number // Seconds from conversation start
} 