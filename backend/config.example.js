/**
 * NovaVA Backend Configuration Example
 * Copy this file to config.js and fill in your actual values
 * 
 * @author Abdur Rehman
 * @description Configuration settings for NovaVA backend server
 */

export const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Vapi API Configuration
  vapi: {
    apiKey: process.env.VAPI_API_KEY || '68ca4e80-831f-4348-bc32-fa41c6fb877b',
    baseUrl: process.env.VAPI_BASE_URL || 'https://api.vapi.ai',
    // Vapi API endpoints we'll be using
    endpoints: {
      createCall: '/call',
      getCall: '/call',
      createAssistant: '/assistant',
      getAssistant: '/assistant'
    }
  },

  // CORS Configuration
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001'
    ],
    credentials: true
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
}; 