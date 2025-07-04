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
 * API Health Check Endpoint
 * 
 * ENDPOINT: GET /api
 * PURPOSE: Dynamic health check with real external API connectivity testing
 * USAGE: Frontend connection status, service monitoring, debugging
 * 
 * HEALTH CHECK FEATURES:
 * - Tests actual Vapi API (OpenAI/GPT-4o) connectivity
 * - Tests actual ElevenLabs TTS API connectivity
 * - Returns detailed status for each service
 * - Provides error messages for troubleshooting
 * - Dynamic status: healthy, degraded, or critical
 * 
 * RESPONSE STRUCTURE:
 * - Overall health status (healthy/degraded/critical)
 * - Individual service status (Vapi/OpenAI, ElevenLabs)
 * - Detailed error messages for failed connections
 * - Service configuration info (models, voices, etc.)
 * - Timestamp for monitoring
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Starting comprehensive health check...');
    
    // DYNAMIC HEALTH CHECK: Test all external services
    const healthStatus = await vapiService.checkServicesHealth();
    
    // BASE API INFORMATION
    const apiInfo = {
      name: 'NovaVA API',
      version: '1.0.0',
      description: 'Nova Virtual Assistant - AI-powered conversational interface',
      author: 'Abdur Rehman',
      endpoints: {
        health: 'GET /api - Service health check with external API connectivity',
        conversation: {
          text: 'POST /api/conversation/text - Generate text response via Vapi/OpenAI',
          history: 'GET /api/conversation/history/:sessionId - Get conversation history',
          tts: 'POST /api/conversation/tts - Generate TTS audio via ElevenLabs'
        }
      }
    };
    
    // DETERMINE HTTP STATUS CODE BASED ON HEALTH
    let statusCode = 200; // Default: healthy
    if (healthStatus.overall === 'degraded') {
      statusCode = 206; // Partial Content: some services down
    } else if (healthStatus.overall === 'critical') {
      statusCode = 503; // Service Unavailable: critical services down
    }
    
    // COMPREHENSIVE RESPONSE WITH HEALTH DATA
    res.status(statusCode).json({
      ...apiInfo,
      health: {
        status: healthStatus.overall,
        services: healthStatus.services,
        errors: healthStatus.errors,
        lastChecked: healthStatus.timestamp
      },
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Health check completed - Status: ${healthStatus.overall}`);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    
    // FALLBACK RESPONSE FOR HEALTH CHECK FAILURES
    res.status(503).json({
      name: 'NovaVA API',
      version: '1.0.0',
      health: {
        status: 'critical',
        error: 'Health check system failure',
        message: error.message,
        lastChecked: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }
}));



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
 * PURPOSE: Generate Text-to-Speech audio using ElevenLabs
 * 
 * REQUEST FLOW:
 * 1. Frontend sends text content + optional voice options
 * 2. Validates text input (required, length, type checking)
 * 3. Calls vapiService.getTTSConfig() for ElevenLabs TTS generation
 * 4. Returns audio URL from ElevenLabs for direct playback
 * 
 * TTS IMPLEMENTATION:
 * - Uses ElevenLabs exclusively for high-quality TTS
 * - Returns base64 audio data URL for immediate playback
 * - No fallback to browser TTS - ensures consistent quality
 * - Rachel voice (21m00Tcm4TlvDq8ikWAM) with optimized settings
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
  console.log('🎤 ElevenLabs TTS Request:', { text: text.substring(0, 50) + '...', options });
  
  try {
    // SERVICE CALL: Generate TTS audio using ElevenLabs
    const result = await vapiService.getTTSConfig(text);
    
    // RESPONSE LOGGING: Track TTS generation success
    console.log('🎵 ElevenLabs TTS Success:', { 
      provider: result.provider,
      audioSize: result.audioSize,
      hasAudioUrl: !!result.audioUrl
    });
    
    // RESPONSE FORMATTING: Return ElevenLabs audio URL with standard API wrapper
    res.json({
      success: true,
      data: {
        text: text,
        audioUrl: result.audioUrl,
        voiceProvider: 'elevenlabs',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        model: 'eleven_flash_v2_5',
        audioSize: result.audioSize,
        timestamp: new Date().toISOString()
      },
      message: 'TTS audio generated successfully using ElevenLabs'
    });
    
  } catch (error) {
    // ERROR HANDLING: Return structured error for TTS failures
    console.error('🔴 ElevenLabs TTS Error:', error.message);
    
    return res.status(500).json({
      success: false,
      error: {
        message: `TTS generation failed: ${error.message}`,
        statusCode: 500
      }
    });
  }
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