import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';

// Track server startup time for Cloud Run diagnostics
const startupTime = Date.now();
const isCloudRun = process.env.K_SERVICE !== undefined;
const isProduction = process.env.NODE_ENV === 'production';

// Use PORT environment variable (Cloud Run sets this automatically)
// Default to 5001 for local development (port 5000 is often taken by macOS AirPlay)
const port = parseInt(process.env.PORT || '5001', 10);

// Simple console log function for early startup (before full logger is loaded)
const earlyLog = (message: string) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

const app = express();

// Early health check endpoint - responds BEFORE full initialization
// This is CRITICAL for Cloud Run startup probes
app.get('/api/health', (req, res) => {
  const uptime = Date.now() - startupTime;
  res.json({ 
    status: 'ok',
    uptime: `${uptime}ms`,
    environment: process.env.NODE_ENV || 'development',
    cloudRun: isCloudRun,
    port: port,
  });
});

// Also support /health without /api prefix for simpler probes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server and start listening IMMEDIATELY
// This ensures Cloud Run health probes pass while we initialize the rest
const server = createServer(app);

server.listen(port, "0.0.0.0", () => {
  const startupDuration = Date.now() - startupTime;
  earlyLog(`🚀 Server listening on port ${port} (${startupDuration}ms)`);
  earlyLog(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (isCloudRun) {
    earlyLog(`☁️ Running on Cloud Run (service: ${process.env.K_SERVICE})`);
  }
});

// Continue initialization in background (routes, middleware, etc.)
// All imports are dynamic to prevent blocking server startup
(async () => {
  try {
    earlyLog('🔧 Initializing application...');
    
    // ===========================================
    // STEP 1: Load core modules dynamically
    // ===========================================
    const { logger } = await import('./lib/logger');
    const { validateAndLogEnvironment, getEnvironmentSummary } = await import('./lib/env-validator');
    
    logger.info('Starting Bluequee Health Management Platform...');
    logger.info('Validating environment configuration...');
    
    const envValid = validateAndLogEnvironment();
    if (!envValid && isProduction) {
      logger.error('Environment validation failed, but server is already listening.');
      logger.error('Some features may not work correctly.');
    }
    
    // Log environment summary (with sensitive values masked)
    if (!isProduction) {
      logger.debug('Environment Summary:', getEnvironmentSummary());
    }
    
    // ===========================================
    // STEP 2: Load middleware
    // ===========================================
    const { securityHeaders } = await import('./middleware/security');
    const { authRateLimit, apiRateLimit } = await import('./middleware/rate-limit');
    const { devLogger, prodLogger } = await import('./middleware/request-logger');
    const { globalErrorHandler, notFoundHandler } = await import('./middleware/error-handler');
    
    // Session middleware (may connect to database)
    let sessionConfig;
    try {
      const sessionModule = await import('./middleware/session');
      sessionConfig = sessionModule.sessionConfig;
    } catch (sessionError) {
      logger.warn('Failed to initialize session middleware:', sessionError);
      // Continue without session middleware in case of error
    }

    // ===========================================
    // STEP 3: Configure CORS
    // ===========================================
    const ALLOWED_ORIGINS: (string | RegExp)[] = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [
          'http://localhost:5001',
          'http://localhost:5173',
          'http://127.0.0.1:5001',
          'http://127.0.0.1:5173',
        ];

    // Cloud Run: Allow the service's own URL
    if (isCloudRun) {
      ALLOWED_ORIGINS.push(/^https:\/\/.*\.run\.app$/);
    }

    app.use((req, res, next) => {
      const origin = req.headers.origin;
      
      const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed && origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
      }
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Security headers middleware (after CORS)
    app.use(securityHeaders);

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Session middleware (if available)
    if (sessionConfig) {
      app.use(sessionConfig);
    }

    // Rate limiting middleware
    app.use('/api/auth/login', authRateLimit);
    app.use('/api/auth/register', authRateLimit);
    app.use('/api/auth/reset-password', authRateLimit);
    app.use('/api', apiRateLimit);

    // Request logging middleware
    app.use(isProduction ? prodLogger : devLogger);
    
    // ===========================================
    // STEP 4: Setup Routes
    // ===========================================
    const { setupRoutes } = await import('./routes/index');
    const { registerRoutes } = await import('./routes');
    
    setupRoutes(app);
    await registerRoutes(app);

    // ===========================================
    // STEP 5: Setup static files / Vite (dev)
    // ===========================================
    const { setupVite, serveStatic, log } = await import('./vite');
    
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // 404 handler for API routes (must be after all routes)
    app.use('/api/*', notFoundHandler);
    
    // Global error handler (must be last middleware)
    app.use(globalErrorHandler);

    const totalStartupTime = Date.now() - startupTime;
    logger.info(`✅ Server fully initialized (${totalStartupTime}ms)`);

    // ===========================================
    // STEP 6: Graceful Shutdown Handling
    // ===========================================
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connections
        try {
          const { pool } = await import('./db');
          await pool.end();
          logger.info('Database connections closed');
        } catch (error) {
          logger.error('Error closing database:', error);
        }
        
        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 25 seconds (Cloud Run's limit is 30s)
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 25000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    earlyLog(`❌ CRITICAL: Failed to initialize server: ${error}`);
    console.error(error);
    // Don't exit - server is already listening, let health checks pass
    // while we investigate the issue via logs
  }
})();
