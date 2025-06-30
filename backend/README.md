# NovaVA Backend API

> Nova Virtual Assistant - AI-powered conversational interface backend

## 🚀 Overview

NovaVA Backend is a Node.js Express server that provides API endpoints for the Nova Virtual Assistant application. It integrates with Vapi API to provide both text and voice-based conversational AI capabilities.

### ✨ Features

- **Continuous Chat**: Maintain conversation context across requests using Vapi sessionId
- **Text Conversations**: Generate AI-powered text responses with memory
- **Voice Conversations**: Create web and phone-based voice calls
- **Assistant Management**: Create and manage AI assistants
- **Call Management**: Track and control voice calls
- **Session Management**: Track conversation history and continuity
- **Comprehensive Logging**: Detailed request/response logging
- **Error Handling**: Robust error handling with user-friendly messages
- **Security**: Rate limiting, CORS, and security headers
- **Health Monitoring**: Service health checks and monitoring

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **HTTP Client**: Axios
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Custom logger with colored output
- **External API**: Vapi.ai for conversational AI

## 📁 Project Structure

```
backend/
├── src/
│   ├── middleware/
│   │   └── errorHandler.js      # Global error handling
│   ├── routes/
│   │   └── api.js              # API route definitions
│   ├── services/
│   │   └── vapiService.js      # Vapi API integration
│   ├── utils/
│   │   └── logger.js           # Logging utility
│   └── server.js               # Main server file
├── config.example.js           # Configuration template
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm (comes with Node.js)
- Vapi API account and API key

### Installation

1. **Clone and Navigate**
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configuration**
   ```bash
   # Copy configuration template
   cp config.example.js config.js
   
   # Edit config.js with your actual values
   # - Add your Vapi API key
   # - Optionally add a default assistant ID for all conversations
   # - Adjust other settings as needed
   ```

4. **Environment Variables** (Optional)
   ```bash
   # You can also use environment variables
   export VAPI_API_KEY="your_vapi_api_key_here"
   export VAPI_DEFAULT_ASSISTANT_ID="your_assistant_id_here"  # Optional: Use specific assistant
   export PORT=5000
   export NODE_ENV=development
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Start Production Server**
   ```bash
   npm start
   ```

The server will start on port 5000 (or your configured port) and you'll see:
```
🚀 NovaVA Backend Server is running on port 5000
🌍 Environment: development
📋 Health check: http://localhost:5000/health
🔧 API endpoints: http://localhost:5000/api
```

## 🔄 Continuous Chat Implementation

NovaVA implements continuous chat functionality using Vapi's built-in session management:

### How It Works

1. **First Message**: When a user sends their first message without a `sessionId`, the system generates a new unique session ID and sends it to Vapi's Chat API.

2. **Conversation Continuity**: For subsequent messages, use the same `sessionId` from the previous response. Vapi automatically maintains the conversation context.

3. **Session Management**: The backend tracks session metadata (chat IDs, message counts, timestamps) for monitoring and debugging.

### Implementation Details

- **Vapi SessionId**: Used directly in the `/chat` endpoint for conversation continuity
- **Assistant Configuration**: Either uses a configured default assistant ID or creates a transient assistant
- **No Complex State**: Simplified approach removes the need for managing `previousChatId` or complex assistant creation
- **Memory Efficiency**: Sessions are stored in memory for development (consider Redis/database for production)

### Example Chat Flow

```javascript
// First message
POST /api/conversation/text
{
  "message": "Hello, what's the weather like?"
}
// Response includes: sessionId: "abc-123"

// Second message (continues conversation)
POST /api/conversation/text  
{
  "message": "What about tomorrow?",
  "sessionId": "abc-123"  // Same session ID
}
// Vapi remembers the weather context from previous message
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Currently uses hardcoded API keys in configuration. For production, implement proper authentication.

### Endpoints

#### 🏠 General

**GET /** - Server information
```json
{
  "message": "Welcome to NovaVA API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

**GET /health** - Health check
```json
{
  "status": "healthy",
  "services": {
    "api": { "status": "healthy" },
    "vapi": { "status": "healthy" }
  }
}
```

#### 💬 Conversation

**POST /api/conversation/text** - Generate text response with continuous chat
```json
// Request
{
  "message": "Hello, how are you?",
  "sessionId": "optional-session-id"  // Use same sessionId to continue conversation
}

// Response
{
  "success": true,
  "data": {
    "response": "Hello! I'm doing well, thank you for asking...",
    "sessionId": "session-id-12345",     // Use this sessionId for continuation
    "chatId": "chat-id-67890",           // Vapi chat ID
    "timestamp": "2025-01-01T12:00:00.000Z",
    "type": "text",
    "canPlayAudio": true,
    "vapiData": {
      "id": "chat-id-67890",
      "status": "completed",
      "cost": 0.001
    }
  }
}
```

**GET /api/conversation/history/:sessionId** - Get conversation history
```json
// Response
{
  "success": true,
  "data": {
    "sessionId": "session-id-12345",
    "lastChatId": "chat-id-67890",
    "messagesCount": 5,
    "lastMessageAt": "2025-01-01T12:00:00.000Z"
  }
}
```

**POST /api/conversation/voice** - Create voice conversation
```json
// Request (Web Call)
{
  "assistantId": "optional-assistant-id",
  "callType": "web"
}

// Request (Phone Call)
{
  "assistantId": "optional-assistant-id",
  "callType": "phone",
  "phoneNumber": "+1234567890"
}

// Response
{
  "success": true,
  "data": {
    "callId": "call-id-12345",
    "type": "web",
    "status": "active",
    "webCallUrl": "https://..."
  }
}
```

#### 🤖 Assistant Management

**POST /api/assistant** - Create assistant
```json
// Request
{
  "name": "Custom Assistant",
  "systemPrompt": "You are a helpful assistant...",
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "rachel"
  }
}

// Response
{
  "success": true,
  "data": {
    "assistantId": "assistant-id-12345",
    "name": "Custom Assistant",
    "createdAt": "2025-01-01T12:00:00.000Z"
  }
}
```

#### 📞 Call Management

**GET /api/call/:id** - Get call details
```json
{
  "success": true,
  "data": {
    "callId": "call-id-12345",
    "status": "completed",
    "duration": 120,
    "transcript": "...",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "endedAt": "2025-01-01T12:02:00.000Z"
  }
}
```

**POST /api/call/:id/end** - End active call
```json
{
  "success": true,
  "data": {
    "callId": "call-id-12345",
    "status": "ended",
    "endedAt": "2025-01-01T12:02:00.000Z"
  }
}
```

### Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  },
  "timestamp": "2025-01-01T12:00:00.000Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

## 🔧 Configuration

### config.js Settings

```javascript
export const config = {
  server: {
    port: 5000,                    // Server port
    nodeEnv: 'development'         // Environment
  },
  vapi: {
    apiKey: 'your_api_key',        // Vapi API key
    baseUrl: 'https://api.vapi.ai' // Vapi base URL
  },
  cors: {
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true
  },
  rateLimit: {
    windowMs: 900000,              // 15 minutes
    maxRequests: 100               // Max requests per window
  }
};
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `VAPI_API_KEY` | Vapi API key | Required |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `LOG_LEVEL` | Logging level | info |

## 🧪 Testing

```bash
# Run tests
npm test

# Health check
curl http://localhost:5000/health

# Test text conversation
curl -X POST http://localhost:5000/api/conversation/text \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!"}'
```

## 📝 Logging

The application includes comprehensive logging:

- **Request/Response**: All HTTP requests and responses
- **API Calls**: External API interactions with Vapi
- **Errors**: Detailed error information with stack traces
- **Performance**: Response times and duration metrics

Log levels: `error`, `warn`, `info`, `debug`

Example log output:
```
[2025-01-01T12:00:00.000Z] INFO  🚀 NovaVA Backend Server is running on port 5000
[2025-01-01T12:00:01.000Z] INFO  POST /api/conversation/text - 200
[2025-01-01T12:00:01.000Z] INFO  Vapi API: Request: POST /assistant
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for frontend domain only
- **Helmet**: Security headers for protection
- **Input Validation**: Request validation and sanitization
- **Error Handling**: No sensitive information in error responses

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   export NODE_ENV=production
   export PORT=5000
   export VAPI_API_KEY="your_production_api_key"
   ```

2. **Install Production Dependencies**
   ```bash
   npm ci --only=production
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Add comprehensive comments to all functions
3. Include error handling for all operations
4. Test all changes thoroughly
5. Update documentation for any API changes

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

**Abdur Rehman**
- Backend Developer & API Architect

---

**NovaVA Backend** - Part of the Nova Virtual Assistant project 