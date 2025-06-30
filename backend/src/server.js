/**
 * NovaVA Backend Server
 * Main entry point for the Nova Virtual Assistant backend API
 * 
 * @author Abdur Rehman
 * @description Express server with Vapi API integration for conversational AI
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/api.js';

// Initialize Express application
const app = express();
const PORT = config.server.port;

// Security middleware - Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Allow cross-origin requests from frontend
app.use(cors(config.cors));

// Body parsing middleware - Parse JSON requests with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging middleware
app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));

// Rate limiting middleware - Prevent abuse and DoS attacks
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);



// API routes - Mount all API endpoints under /api prefix
app.use('/api', apiRoutes);

// Default route - Provide API information
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to NovaVA (Nova Virtual Assistant) API',
    version: '1.0.0',
    author: 'Abdur Rehman',
    description: 'AI-powered conversational assistant',
    endpoints: {
      api: '/api',
      conversation: '/api/conversation'
    },
    documentation: 'See README.md for API documentation'
  });
});

// 404 handler - Handle non-existent routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    statusCode: 404
  });
});

// Global error handling middleware - Must be last
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 NovaVA Backend Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`🔧 API endpoints: http://localhost:${PORT}/api`);
});

export default app; 