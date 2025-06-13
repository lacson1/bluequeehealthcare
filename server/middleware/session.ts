import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Request, Response, NextFunction } from 'express';

const PgSession = connectPgSimple(session);

// Session configuration
export const sessionConfig = session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions',
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
});

// Session-based authentication middleware
export interface SessionRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    organizationId?: number;
  };
}

export const authenticateSession = (req: SessionRequest, res: Response, next: NextFunction) => {
  if (req.session && (req.session as any).user) {
    req.user = (req.session as any).user;
    next();
  } else {
    res.status(401).json({ message: 'Authentication required' });
  }
};