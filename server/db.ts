import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";
import { dbLogger as logger } from './lib/logger';

const { Pool: PgPool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For production with managed databases, disable TLS certificate verification globally
// This is needed because DigitalOcean and other providers use self-signed certificates
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Database connection pool configuration
const POOL_CONFIG = {
  // Maximum number of connections in the pool
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  // Minimum number of connections to keep open
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  // Close idle connections after this many milliseconds
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  // Return an error after this many milliseconds if connection cannot be established
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
};

// Detect if using Neon database (has neon.tech in URL) or local PostgreSQL
const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech') ||
  process.env.DATABASE_URL.includes('neon.serverless');

// Check if SSL should be enabled (for managed databases like DigitalOcean)
const isProduction = process.env.NODE_ENV === 'production';
const requireSSL = process.env.DATABASE_URL.includes('sslmode=require') || 
  process.env.DATABASE_URL.includes('digitalocean') ||
  process.env.DB_SSL === 'true' ||
  isProduction;

// SSL configuration for managed databases (accepts self-signed certificates)
const sslConfig = requireSSL ? {
  rejectUnauthorized: false, // Accept self-signed certificates (DigitalOcean, etc.)
} : false;

const { pool, db } = (() => {
  if (isNeonDatabase) {
    logger.info('Using Neon serverless database with WebSocket connection');
    logger.debug(`Pool config: max=${POOL_CONFIG.max}, min=${POOL_CONFIG.min}, idleTimeout=${POOL_CONFIG.idleTimeoutMillis}ms`);
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ 
      connectionString: process.env.DATABASE_URL,
      max: POOL_CONFIG.max,
      idleTimeoutMillis: POOL_CONFIG.idleTimeoutMillis,
      connectionTimeoutMillis: POOL_CONFIG.connectionTimeoutMillis,
    });
    const db = neonDrizzle({ client: pool, schema });
    return { pool, db };
  } else {
    logger.info('Using PostgreSQL database with standard connection');
    logger.debug(`Pool config: max=${POOL_CONFIG.max}, min=${POOL_CONFIG.min}, idleTimeout=${POOL_CONFIG.idleTimeoutMillis}ms`);
    if (sslConfig) {
      logger.debug('SSL: enabled (accepting self-signed certificates)');
    }
    const pool = new PgPool({ 
      connectionString: process.env.DATABASE_URL,
      max: POOL_CONFIG.max,
      min: POOL_CONFIG.min,
      idleTimeoutMillis: POOL_CONFIG.idleTimeoutMillis,
      connectionTimeoutMillis: POOL_CONFIG.connectionTimeoutMillis,
      ssl: sslConfig,
    });
    const db = pgDrizzle({ client: pool, schema });
    return { pool, db };
  }
})();

/**
 * Test database connection with retry logic
 * Use this during app startup to verify database is reachable
 */
export async function testConnection(maxRetries = 3, retryDelay = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      logger.info('Database connection verified');
      return true;
    } catch (error: any) {
      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        logger.info(`Retrying in ${retryDelay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  logger.error(`Failed to connect to database after ${maxRetries} attempts`);
  return false;
}

/**
 * Get database pool statistics
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

export { pool, db };