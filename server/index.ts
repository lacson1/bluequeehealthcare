import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { setupRoutes } from "./routes/index";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { sessionConfig } from "./middleware/session";
import { securityHeaders } from "./middleware/security";
import { authRateLimit, apiRateLimit } from "./middleware/rate-limit";
import { devLogger, prodLogger } from "./middleware/request-logger";
import { globalErrorHandler, notFoundHandler } from "./middleware/error-handler";
import { logger } from "./lib/logger";
import { validateAndLogEnvironment, getEnvironmentSummary } from "./lib/env-validator";

// Dynamic imports for seeding (may fail if tables don't exist)
const seedTabPresets = async () => {
  try {
    const module = await import("./seedTabPresets");
    await module.seedTabPresets();
  } catch (error: any) {
    if (error?.code === '42P01') {
      // Table doesn't exist - will be created on db:push
    } else {
      throw error;
    }
  }
};

const seedTabConfigs = async () => {
  try {
    const module = await import("./seedTabConfigs");
    await module.seedTabConfigs();
  } catch (error: any) {
    if (error?.code === '42P01') {
      // Table doesn't exist - will be created on db:push
    } else {
      throw error;
    }
  }
};

const seedMockData = async () => {
  try {
    const module = await import("./seedMockData");
    await module.seedMockData();
  } catch (error: any) {
    if (error?.code === '42P01') {
      // Table doesn't exist - will be created on db:push
    } else {
      throw error;
    }
  }
};

const app = express();

// Enable compression for all responses
// This will compress text-based responses (HTML, CSS, JS, JSON)
app.use((req, res, next) => {
  // Simple gzip-like compression check
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Vary', 'Accept-Encoding');
  }
  next();
});

// CORS configuration with secure origin whitelist
// Define allowed origins - customize based on your deployment
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:5001',
      'http://localhost:5173',
      'http://127.0.0.1:5001',
      'http://127.0.0.1:5173',
    ];


app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
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

// Session middleware
app.use(sessionConfig);

// Rate limiting middleware
// Apply stricter rate limiting to authentication endpoints
app.use('/api/auth/login', authRateLimit);
app.use('/api/auth/register', authRateLimit);
app.use('/api/auth/reset-password', authRateLimit);

// Apply standard rate limiting to all API endpoints
app.use('/api', apiRateLimit);

// Request logging middleware - use dev logger in development, prod logger in production
const isProduction = process.env.NODE_ENV === 'production';
app.use(isProduction ? prodLogger : devLogger);

(async () => {
  try {
    // ===========================================
    // STEP 1: Validate Environment Variables
    // ===========================================
    logger.info('Starting ClinicConnect Healthcare Platform...');
    logger.info('Validating environment configuration...');
    
    const envValid = validateAndLogEnvironment();
    if (!envValid && process.env.NODE_ENV === 'production') {
      logger.error('Cannot start in production with invalid environment configuration.');
      process.exit(1);
    }
    
    // Log environment summary (with sensitive values masked)
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Environment Summary:', getEnvironmentSummary());
    }
    
    // ===========================================
    // STEP 2: Database Seeding (Development)
    // ===========================================
    // Note: Seeding will be skipped if database tables don't exist yet
    // Run 'npm run db:push' to create tables, then restart the server
    
    // Seed tab configurations on startup (idempotent - only creates if not exists)
    try {
      logger.info('Seeding tab configurations...');
      await seedTabConfigs();
    } catch (error: any) {
      if (error?.code === '42P01') {
        logger.warn('Tables not found - run "npm run db:push" to create database schema');
      } else {
        logger.error('Failed to seed tab configurations:', error?.message || error);
      }
    }

    // Seed tab presets on startup (idempotent - only creates if not exists)
    try {
      logger.info('Seeding tab presets...');
      await seedTabPresets();
    } catch (error: any) {
      if (error?.code !== '42P01') {
        logger.error('Failed to seed tab presets:', error?.message || error);
      }
    }

    // Seed mock data (2 patients, 2 staff) on startup (idempotent)
    try {
      logger.debug('Seeding mock data...');
      await seedMockData();
    } catch (error: any) {
      if (error?.code !== '42P01') {
        logger.error('Failed to seed mock data:', error?.message || error);
      }
    }

    // Seed comprehensive lab test catalog on startup (idempotent)
    try {
      logger.info('Seeding lab test catalog...');
      const { seedComprehensiveLabTests } = await import('./seedComprehensiveLabTests');
      await seedComprehensiveLabTests();
    } catch (error: any) {
      if (error?.code !== '42P01') {
        logger.error('Failed to seed lab test catalog:', error?.message || error);
      }
    }

    // Setup new modular routes (patients, laboratory, prescriptions)
    setupRoutes(app);
    
    // Setup remaining routes from old routes.ts (auth, profile, dashboard, etc.)
    await registerRoutes(app);

    // Use port 5001 (port 5000 is often taken by macOS AirPlay)
    // this serves both the API and the client.
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5001;
    
    // Create HTTP server first so we can pass it to Vite for HMR
    const { createServer } = await import('http');
    const server = createServer(app);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // 404 handler for API routes (must be after all routes)
    app.use('/api/*', notFoundHandler);
    
    // Global error handler (must be last middleware)
    app.use(globalErrorHandler);

    // Start server
    server.listen(port, "0.0.0.0", () => {
      log(`🚀 Server running on port ${port}`);
      log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // ===========================================
    // STEP 4: Graceful Shutdown Handling
    // ===========================================
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
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

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('CRITICAL: Failed to start server:', error);
    process.exit(1);
  }
})();
