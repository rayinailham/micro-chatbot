import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { conversationsRoutes } from './routes/conversations';
import { messagesRoutes } from './routes/messages';
import { logger } from './utils/logger';

// Load environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Elysia app
const app = new Elysia()
  // Add CORS support
  .use(cors())
  
  // Health check endpoint
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  }))
  
  // API info endpoint
  .get('/', () => ({
    service: 'Chatbot Microservice',
    version: '1.0.0',
    description: 'AI-powered chatbot service with OpenRouter integration',
    endpoints: {
      health: 'GET /health',
      conversations: {
        create: 'POST /v1/chatbot/conversations',
        list: 'GET /v1/chatbot/conversations?user_id={user_id}',
        get: 'GET /v1/chatbot/conversations/:id',
        update: 'PATCH /v1/chatbot/conversations/:id',
        delete: 'DELETE /v1/chatbot/conversations/:id',
      },
      messages: {
        send: 'POST /v1/chatbot/conversations/:id/messages',
        regenerate: 'POST /v1/chatbot/messages/:id/regenerate',
      },
    },
  }))
  
  // Register routes
  .use(conversationsRoutes)
  .use(messagesRoutes)
  
  // Global error handler
  .onError(({ code, error, set }) => {
    logger.error('Application error', { code, error: error.message });
    
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        error: 'Validation error',
        details: error.message,
      };
    }
    
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        success: false,
        error: 'Route not found',
      };
    }
    
    set.status = 500;
    return {
      success: false,
      error: 'Internal server error',
      message: NODE_ENV === 'development' ? error.message : undefined,
    };
  })
  
  // Start server
  .listen(PORT);

logger.info(`🚀 Chatbot Microservice is running at http://${app.server?.hostname}:${app.server?.port}`);
logger.info(`📝 Environment: ${NODE_ENV}`);
logger.info(`📚 API Documentation available at http://${app.server?.hostname}:${app.server?.port}/`);

export default app;

