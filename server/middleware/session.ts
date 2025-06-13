import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { db } from '../db';

const PgSession = connectPgSimple(session);

// Session-based authentication middleware
export const sessionConfig = {
  store: new PgSession({
    pool: db, // Use your existing database connection
    tableName: 'session', // Will be created automatically
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'clinic-session-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  name: 'clinic.session.id',
};

// Enhanced authentication middleware for sessions
export const authenticateSession = (req: any, res: any, next: any) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    res.status(401).json({ message: 'Authentication required' });
  }
};