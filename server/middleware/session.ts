import session from 'express-session';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { sessionLogger as logger } from '../lib/logger';

// SECURITY: Session secret from environment variable
const isProduction = process.env.NODE_ENV === 'production';
let SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  if (isProduction) {
    // CRITICAL: In production, require SESSION_SECRET to be set
    logger.error('SESSION_SECRET environment variable is required in production.');
    logger.error('Generate a secure secret with: openssl rand -base64 64');
    logger.error('Then set it in your environment: SESSION_SECRET="your-secret-here"');
    process.exit(1);
  } else {
    // Development: Generate a temporary secret with warning
    SESSION_SECRET = crypto.randomBytes(64).toString('base64');
    logger.warn('SESSION_SECRET not set. Generated temporary secret (dev mode only).');
    logger.warn('Sessions will not persist across server restarts.');
  }
}

// Use MemoryStore for development - faster and no DB issues
// In production, you should use a proper store like connect-pg-simple or connect-redis
const isDevelopment = !isProduction;

let sessionStore: session.Store | undefined;

// Detect Cloud SQL Unix socket connection (format: /cloudsql/PROJECT:REGION:INSTANCE)
const isCloudSQLSocket = process.env.DATABASE_URL?.includes('/cloudsql/') ||
  process.env.INSTANCE_UNIX_SOCKET !== undefined;

// Initialize session store asynchronously to prevent blocking server startup
function initializeSessionStore(): session.Store | undefined {
  if (!isDevelopment && process.env.DATABASE_URL) {
    // Use PostgreSQL session store in production
    try {
      const connectPgSimple = require('connect-pg-simple');
      const pg = require('pg');
      const PgSession = connectPgSimple(session);
      
      // SSL config - Cloud SQL sockets don't need SSL
      const sslConfig = isCloudSQLSocket ? false : {
        rejectUnauthorized: false, // Accept self-signed certificates
      };
      
      // Create a pool with SSL support for managed databases
      const pgPool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
        // Connection pool settings - keep small for session store
        max: 3,
        idleTimeoutMillis: 15000,
        connectionTimeoutMillis: 5000, // Faster timeout for Cloud Run cold starts
      });
      
      // Handle pool errors gracefully
      pgPool.on('error', (err: Error) => {
        // Log but don't crash - sessions will fall back gracefully
        logger.warn('Session store pool error:', err.message);
      });

      const store = new PgSession({
        pool: pgPool,
        tableName: 'sessions', // Must match Drizzle schema in shared/schema.ts
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
        errorLog: (err: Error) => {
          // Suppress "already exists" errors (expected during table creation)
          if (!err.message?.includes('already exists')) {
            logger.error('Session store error:', err.message);
          }
        },
      });
      
      logger.info('Using PostgreSQL session store');
      if (isCloudSQLSocket) {
        logger.info('Connected via Cloud SQL Unix socket');
      }
      return store;
    } catch (error: any) {
      logger.warn('Failed to initialize PostgreSQL session store:', error?.message || error);
      logger.warn('Falling back to MemoryStore (not recommended for production)');
      return undefined;
    }
  } else {
    if (isDevelopment) {
      logger.debug('Using in-memory session store (development mode)');
    } else {
      logger.warn('Using in-memory session store - DATABASE_URL not set');
    }
    return undefined;
  }
}

// Initialize store (may be undefined if using MemoryStore)
sessionStore = initializeSessionStore();

// Session configuration with environment-based security
export const sessionConfig = session({
  store: sessionStore, // Uses MemoryStore if sessionStore is undefined
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // SECURITY: Enable secure cookies in production (requires HTTPS)
    secure: isProduction,
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '2592000000', 10), // Default 30 days
    // SECURITY: Strict sameSite in production for CSRF protection
    sameSite: isProduction ? 'strict' : 'lax',
  },
  name: 'clinic.session.id',
});

// Session-based authentication middleware
export interface SessionRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    organizationId?: number;
    currentOrganizationId?: number;
  };
}

export const authenticateSession = (req: SessionRequest, res: Response, next: NextFunction) => {
  // Check for session-based authentication
  const sessionUser = (req.session as any)?.user;
  
  if (!sessionUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  req.user = {
    id: sessionUser.id,
    username: sessionUser.username,
    role: sessionUser.role,
    organizationId: sessionUser.organizationId,
    currentOrganizationId: sessionUser.currentOrganizationId || sessionUser.organizationId
  };
  
  next();
};
