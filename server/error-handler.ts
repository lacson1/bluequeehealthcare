import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { errorLogs, systemHealth, users } from '@shared/schema';
import { eq, desc, and, gte, count, avg } from 'drizzle-orm';
import { authenticateToken } from './middleware/auth';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    organizationId: number;
    username: string;
    role: string;
  };
}

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    
    res.on('finish', () => {
      // Perform logging asynchronously without blocking
      setImmediate(async () => {
        try {
          const responseTime = Date.now() - startTime;
          const organizationId = (req as AuthRequest).user?.organizationId;
          
          // Only log performance metrics for valid requests
          if (responseTime > 0 && responseTime < 60000) {
            await db.insert(systemHealth).values({
              metric: 'response_time',
              value: responseTime.toString(),
              unit: 'ms',
              organizationId: organizationId || null
            });
            
            // Log error rate if it's an error response
            if (res.statusCode >= 400) {
              await db.insert(systemHealth).values({
                metric: 'error_rate',
                value: '1',
                unit: 'count',
                organizationId: organizationId || null
              });
            }
          }
        } catch (error) {
          // Silently handle logging errors
          console.error('Performance logging failed:', error instanceof Error ? error.message : 'Unknown error');
        }
      });
    });
    
    next();
  } catch (error) {
    // If middleware setup fails, continue without performance monitoring
    next();
  }
};

// Global error handling middleware
export const globalErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  
  // Log error to database
  logServerError({
    error,
    req: authReq,
    severity: 'HIGH',
    type: 'SERVER'
  });
  
  // Determine error response
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (error.status) {
    statusCode = error.status;
  }
  
  if (error.message && statusCode < 500) {
    message = error.message;
  }
  
  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Server-side error logging function
export const logServerError = async (params: {
  error: any;
  req: AuthRequest;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'NETWORK' | 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'SERVER' | 'CLIENT' | 'UNKNOWN';
  action?: string;
  component?: string;
}) => {
  const { error, req, severity, type, action, component } = params;
  
  try {
    const errorId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Only include userId if it's a valid existing user
    let validUserId = null;
    if (req.user?.id && typeof req.user.id === 'number' && req.user.id > 0) {
      // Verify user exists before logging
      const userExists = await db.select({ id: users.id }).from(users).where(eq(users.id, req.user.id)).limit(1);
      if (userExists.length > 0) {
        validUserId = req.user.id;
      }
    }

    await db.insert(errorLogs).values({
      errorId,
      type,
      severity,
      message: error.message || 'Unknown server error',
      stack: error.stack,
      userId: validUserId,
      organizationId: req.user?.organizationId || null,
      sessionId: req.session?.id || 'unknown',
      url: req.originalUrl || req.url,
      userAgent: req.get('User-Agent') || null,
      action: action || req.method,
      component: component || 'Server',
      retryable: severity !== 'CRITICAL' && type === 'SERVER',
      metadata: {
        method: req.method,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip
      }
    });
    
    console.error(`🚨 Server Error [${errorId}]:`, {
      type,
      severity,
      message: error.message,
      url: req.originalUrl,
      userId: req.user?.id,
      organizationId: req.user?.organizationId
    });
  } catch (logError) {
    console.error('Failed to log server error:', logError);
  }
};

// Route handlers for error tracking
export const setupErrorRoutes = (app: any) => {
  // Track client-side errors
  app.post('/api/errors/track', async (req: AuthRequest, res: Response) => {
    try {
      const { error } = req.body;
      
      if (!error || !error.id || !error.type || !error.severity || !error.message) {
        return res.status(400).json({ message: 'Invalid error data' });
      }
      
      await db.insert(errorLogs).values({
        errorId: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        stack: error.stack || null,
        userId: req.user?.id || null,
        organizationId: req.user?.organizationId || null,
        patientId: error.context?.patientId || null,
        sessionId: error.context?.sessionId || null,
        url: error.context?.url || null,
        userAgent: error.context?.userAgent || null,
        action: error.context?.action || null,
        component: error.context?.component || null,
        retryable: error.retryable || false,
        metadata: error.context || {}
      });
      
      res.json({ success: true, errorId: error.id });
    } catch (error) {
      console.error('Failed to track client error:', error);
      res.status(500).json({ message: 'Failed to track error' });
    }
  });
  
  // Get error dashboard data
  app.get('/api/errors/dashboard', async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      const timeframe = req.query.timeframe as string || '24h';
      
      let timeFilter: Date;
      switch (timeframe) {
        case '1h':
          timeFilter = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }
      
      const baseWhere = organizationId 
        ? and(eq(errorLogs.organizationId, organizationId), gte(errorLogs.createdAt, timeFilter))
        : gte(errorLogs.createdAt, timeFilter);
      
      // Get error counts by type
      const errorsByType = await db
        .select({
          type: errorLogs.type,
          count: count()
        })
        .from(errorLogs)
        .where(baseWhere)
        .groupBy(errorLogs.type);
      
      // Get error counts by severity
      const errorsBySeverity = await db
        .select({
          severity: errorLogs.severity,
          count: count()
        })
        .from(errorLogs)
        .where(baseWhere)
        .groupBy(errorLogs.severity);
      
      // Get recent errors
      const recentErrors = await db
        .select()
        .from(errorLogs)
        .where(baseWhere)
        .orderBy(desc(errorLogs.createdAt))
        .limit(50);
      
      // Get performance metrics
      const performanceMetrics = await db
        .select({
          metric: systemHealth.metric,
          avgValue: avg(systemHealth.value),
          unit: systemHealth.unit
        })
        .from(systemHealth)
        .where(
          organizationId 
            ? and(eq(systemHealth.organizationId, organizationId), gte(systemHealth.timestamp, timeFilter))
            : gte(systemHealth.timestamp, timeFilter)
        )
        .groupBy(systemHealth.metric, systemHealth.unit);
      
      res.json({
        summary: {
          totalErrors: recentErrors.length,
          criticalErrors: recentErrors.filter(e => e.severity === 'CRITICAL').length,
          unresolvedErrors: recentErrors.filter(e => !e.resolved).length
        },
        errorsByType,
        errorsBySeverity,
        recentErrors: recentErrors.slice(0, 10),
        performanceMetrics
      });
    } catch (error) {
      console.error('Failed to get error dashboard:', error);
      res.status(500).json({ message: 'Failed to get error dashboard' });
    }
  });
  
  // Mark error as resolved
  app.patch('/api/errors/:errorId/resolve', async (req: AuthRequest, res: Response) => {
    try {
      const { errorId } = req.params;
      
      await db
        .update(errorLogs)
        .set({ 
          resolved: true, 
          resolvedAt: new Date() 
        })
        .where(eq(errorLogs.errorId, errorId));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to resolve error:', error);
      res.status(500).json({ message: 'Failed to resolve error' });
    }
  });
  
  // Get error details
  app.get('/api/errors/:errorId', async (req: AuthRequest, res: Response) => {
    try {
      const { errorId } = req.params;
      
      const [errorDetails] = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.errorId, errorId));
      
      if (!errorDetails) {
        return res.status(404).json({ message: 'Error not found' });
      }
      
      res.json(errorDetails);
    } catch (error) {
      console.error('Failed to get error details:', error);
      res.status(500).json({ message: 'Failed to get error details' });
    }
  });
  
  // Health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await db.select().from(errorLogs).limit(1);
      
      const dbResponseTime = Date.now() - startTime;
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: dbResponseTime < 1000 ? 'healthy' : 'slow',
            responseTime: `${dbResponseTime}ms`
          },
          api: {
            status: 'healthy',
            uptime: process.uptime()
          }
        }
      };
      
      res.json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // AI Insights endpoint
  app.get('/api/errors/ai-insights', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const timeframe = req.query.timeframe as string || '7d';
      const { aiErrorInsights } = await import('./ai-error-insights');
      
      const insights = await aiErrorInsights.generateInsights(organizationId, timeframe);
      res.json(insights);
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      res.status(500).json({ 
        message: 'Failed to generate AI insights',
        error: error.message 
      });
    }
  });

  // Predictive insights endpoint
  app.get('/api/errors/predictions', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { aiErrorInsights } = await import('./ai-error-insights');
      const predictions = await aiErrorInsights.generateErrorPredictions(organizationId);
      
      res.json({ predictions });
    } catch (error) {
      console.error('Failed to generate predictions:', error);
      res.status(500).json({ 
        message: 'Failed to generate predictions',
        error: error.message 
      });
    }
  });
};