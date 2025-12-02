import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

const { Pool: PgPool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
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
    console.log('📡 Using Neon serverless database with WebSocket connection');
    console.log(`   Pool config: max=${POOL_CONFIG.max}, min=${POOL_CONFIG.min}, idleTimeout=${POOL_CONFIG.idleTimeoutMillis}ms`);
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
    console.log('🐘 Using PostgreSQL database with standard connection');
    console.log(`   Pool config: max=${POOL_CONFIG.max}, min=${POOL_CONFIG.min}, idleTimeout=${POOL_CONFIG.idleTimeoutMillis}ms`);
    if (sslConfig) {
      console.log('   SSL: enabled (accepting self-signed certificates)');
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

export { pool, db };