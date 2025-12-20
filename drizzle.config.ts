import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// For production with managed databases, disable TLS certificate verification
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Detect Cloud SQL socket connection (no SSL needed for socket connections)
const isCloudSQLSocket = process.env.DATABASE_URL.includes('/cloudsql/');

// Only use SSL for non-socket production connections
const sslConfig = process.env.NODE_ENV === 'production' && !isCloudSQLSocket 
  ? { rejectUnauthorized: false } 
  : false;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: sslConfig,
  },
});
