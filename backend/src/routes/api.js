/**
 * API Routes - Backend Express Router Configuration
 * Main routing configuration for NovaVA backend
 * 
 * @author Abdur Rehman
 * @description All API endpoints for NovaVA conversational AI application
 * 
 * ROUTING ARCHITECTURE:
 * - Express.js router handling all /api/* endpoints
 * - Async error handling with middleware wrapper
 * - Input validation and sanitization for all endpoints
 * - Structured JSON responses with success/error format
 * - Integration with Vapi service layer for AI functionality
 * 
 * API ENDPOINTS OVERVIEW:
 * 1. GET /api - API information and endpoint documentation
 * 2. POST /api/conversation/text - Text generation via Vapi Chat API
 * 3. GET /api/conversation/history/:sessionId - Session history retrieval
 * 4. POST /api/conversation/tts - TTS configuration for voice synthesis
 * 5. 404 handler for undefined routes
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { vapiService } from '../services/vapiService.js';

const router = express.Router();

/**
 * API Information Endpoint
 * 
 * ENDPOINT: GET /api
 * PURPOSE: Provides API documentation and server information
 * USAGE: Health checks, frontend connectivity testing, API discovery
 * 
 * RESPONSE STRUCTURE:
 * - API metadata (name, version, description)
 * - Available endpoints documentation
 * - Server timestamp for connectivity verification
 * - Used by frontend for health checking and connection status
 */
router.get('/', (req, res) => {
  res.json({
    name: 'NovaVA API', // Application identifier
    version: '1.0.0', // API version for compatibility tracking
    description: 'Nova Virtual Assistant - AI-powered conversational interface',
    author: 'Abdur Rehman',
    endpoints: {
      // ENDPOINT DOCUMENTATION: Self-documenting API structure
      conversation: {
        text: 'POST /api/conversation/text - Generate text response', // Main chat endpoint
        history: 'GET /api/conversation/history/:sessionId - Get conversation history', // Session retrieval
        tts: 'POST /api/conversation/tts - Generate TTS configuration for text-to-speech' // Voice synthesis
      }
    },
    timestamp: new Date().toISOString() // Server time for connectivity verification
  });
});



/**
 * CONVERSATION ROUTES
 * Core endpoints for AI conversation functionality
 */

/**
 * Generate Text Response
 * 
 * ENDPOINT: POST /api/conversation/text
 * PURPOSE: Main conversation endpoint - generates AI responses using Vapi Chat API
 * 
 * REQUEST FLOW:
 * 1. Frontend sends user message + optional sessionId
 * 2. Validates input (required, length, type checking)
 * 3. Calls vapiService.generateTextResponse() -> Vapi Chat API -> GPT-4o
 * 4. Returns AI response with session continuity data
 * 
 * TECHNICAL INTEGRATION:
 * - Calls Vapi Chat API through vapiService layer
 * - Manages conversation threading with session continuity
 * - Returns structured response with chatId for future threading
 * - Includes canPlayAudio flag for TTS capability indication
 * 
 * VALIDATION RULES:
 * - Message: Required, non-empty string, max 1000 characters
 * - SessionId: Optional UUID for conversation continuity
 */
router.post('/conversation/text', asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  
  // INPUT VALIDATION: Ensure message is provided and valid
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Message is required and must be a non-empty string',
        statusCode: 400
      }
    });
  }
  
  // LENGTH VALIDATION: Prevent excessively long messages for API efficiency
  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Message is too long. Maximum length is 1000 characters',
        statusCode: 400
      }
    });
  }
  
  // MAIN PROCESSING: Generate AI response through Vapi Chat API
  
  // SERVICE CALL: Delegate to Vapi service for AI text generation
  // This triggers: Router -> vapiService -> Vapi Chat API -> GPT-4o
  const result = await vapiService.generateTextResponse(message, sessionId);
  
  // RESPONSE FORMATTING: Structure response for frontend consumption
  res.json({
    success: true,
    data: {
      response: result.data.response, // AI-generated text from GPT-4o
      sessionId: result.data.sessionId, // Session identifier for continuity
      chatId: result.data.chatId, // Vapi chat ID for conversation threading
      timestamp: result.data.timestamp, // Response generation timestamp
      type: 'text', // Response type identifier
      canPlayAudio: result.data.canPlayAudio, // TTS capability flag
      debug: result.data.debug // Optional debug information
    },
    message: 'Text response generated successfully using Vapi Chat API'
  });
}));

/**
 * Get Chat History
 * 
 * ENDPOINT: GET /api/conversation/history/:sessionId
 * PURPOSE: Retrieve conversation metadata and session information
 * 
 * REQUEST FLOW:
 * 1. Frontend requests history with sessionId parameter
 * 2. Validates sessionId presence
 * 3. Calls vapiService.getChatHistory() to retrieve session data
 * 4. Returns session metadata, message counts, and continuity info
 * 
 * TECHNICAL DETAILS:
 * - Retrieves session data from in-memory storage (Map)
 * - Returns conversation metadata for UI display
 * - Provides session continuity information for threading
 * - Used for session management and conversation restoration
 * 
 * RESPONSE DATA:
 * - Session metadata (creation time, last activity)
 * - Message count and conversation statistics
 * - Last chat ID for Vapi conversation threading
 */
router.get('/conversation/history/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  // PARAMETER VALIDATION: Ensure sessionId is provided
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Session ID is required',
        statusCode: 400
      }
    });
  }
  

  
  // SERVICE CALL: Retrieve session history from Vapi service
  const result = await vapiService.getChatHistory(sessionId);
  
  // RESPONSE FORMATTING: Return session data with success wrapper
  res.json({
    success: true,
    data: result.data, // Session metadata and history information
    message: result.message // Status message from service layer
  });
}));

/**
 * Generate TTS Configuration
 * 
 * ENDPOINT: POST /api/conversation/tts
 * PURPOSE: Generate Text-to-Speech configuration for voice synthesis
 * 
 * REQUEST FLOW:
 * 1. Frontend sends text content + optional voice options
 * 2. Validates text input (required, length, type checking)
 * 3. Calls vapiService.getTTSConfig() for voice configuration
 * 4. Returns enhanced TTS settings for browser voice synthesis
 * 
 * CURRENT TTS IMPLEMENTATION:
 * - Returns enhanced browser TTS configuration
 * - Optimized voice settings for natural speech delivery
 * - Preferred voice list for cross-platform compatibility
 * - SSML support for improved prosody and pauses
 * 
 * FUTURE TTS INTEGRATION:
 * - Will integrate with Vapi's TTS infrastructure
 * - Support for premium voice models (ElevenLabs, etc.)
 * - Direct audio URL generation for immediate playback
 * - Advanced voice customization and speaker selection
 * 
 * VALIDATION RULES:
 * - Text: Required, non-empty string, max 2000 characters
 * - Options: Optional object with voice configuration parameters
 */
router.post('/conversation/tts', asyncHandler(async (req, res) => {
  const { text, options } = req.body;
  
  // INPUT VALIDATION: Ensure text is provided and valid for TTS
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Text is required and must be a non-empty string',
        statusCode: 400
      }
    });
  }
  
  // LENGTH VALIDATION: Prevent excessively long text for TTS processing
  if (text.length > 2000) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Text is too long for TTS. Maximum length is 2000 characters',
        statusCode: 400
      }
    });
  }
  
  // REQUEST LOGGING: Track TTS requests for monitoring and debugging
  console.log('🎤 TTS Request:', { text: text.substring(0, 50) + '...', options });
  
  // SERVICE CALL: Generate TTS configuration through Vapi service
  // Currently returns enhanced browser TTS config, future: premium voice URLs
  const result = await vapiService.getTTSConfig(text, options || {});
  
  // RESPONSE LOGGING: Track TTS generation success and method used
  console.log('🎵 TTS Success:', { 
    hasAudioUrl: !!result.data.audioUrl, // Whether direct audio URL is provided
    method: result.data.method // TTS method used (browser/api/etc.)
  });
  
  // RESPONSE FORMATTING: Return TTS configuration for frontend audio playback
  res.json({
    success: true,
    data: result.data, // TTS configuration and voice settings
    message: result.message // Status message from service layer
  });
}));











/**
 * 404 Error Handler for Invalid API Routes
 * 
 * ENDPOINT: * (wildcard - catches all unmatched routes)
 * PURPOSE: Provides helpful error messages for invalid API endpoints
 * 
 * ERROR RESPONSE:
 * - Clear error message indicating the invalid endpoint
 * - HTTP 404 status code
 * - List of available endpoints for API discovery
 * - Structured error format consistent with other endpoints
 * 
 * USAGE:
 * - Catches typos in endpoint URLs
 * - Provides API documentation through error responses
 * - Helps developers discover correct endpoint paths
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `API endpoint ${req.originalUrl} not found`, // Clear error message
      statusCode: 404,
      // ENDPOINT DOCUMENTATION: Help developers find correct endpoints
      availableEndpoints: [
        'GET /api', // API information and health check
        'POST /api/conversation/text', // Main conversation endpoint
        'GET /api/conversation/history/:sessionId', // Session history retrieval
        'POST /api/conversation/tts' // TTS configuration generation
      ]
    }
  });
});

export default router; 