import { Request, Response } from 'express';
import { db } from './db';
import { errorLogs, systemHealth } from '@shared/schema';
import { eq, desc, and, gte, count, avg } from 'drizzle-orm';
import { AuthRequest } from './error-handler';

interface SystemHealthReport {
  overall: 'excellent' | 'good' | 'warning' | 'critical';
  score: number;
  timestamp: string;
  components: {
    network: {
      status: 'healthy' | 'degraded' | 'critical';
      avgResponseTime: number;
      timeoutCount: number;
      errorCount: number;
      recommendations: string[];
    };
    authentication: {
      status: 'secure' | 'warning' | 'critical';
      securityScore: number;
      tokenHealth: {
        isValid: boolean;
        expiresInMinutes?: number;
      };
      issues: string[];
      recommendations: string[];
    };
    database: {
      status: 'healthy' | 'slow' | 'critical';
      responseTime: number;
      connectionPool: string;
    };
    errorRate: {
      status: 'excellent' | 'good' | 'warning' | 'critical';
      rate: number;
      trend: 'improving' | 'stable' | 'declining';
      recentErrors: number;
    };
    performance: {
      status: 'excellent' | 'good' | 'slow' | 'critical';
      avgResponseTime: number;
      throughput: number;
      slowestEndpoints: Array<{
        endpoint: string;
        responseTime: number;
      }>;
    };
  };
  actionItems: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  trends: {
    errorRate: Array<{
      timestamp: string;
      count: number;
    }>;
    responseTime: Array<{
      timestamp: string;
      avgTime: number;
    }>;
  };
}

export class SystemHealthDashboard {
  static async generateComprehensiveReport(req: AuthRequest): Promise<SystemHealthReport> {
    const organizationId = req.user?.organizationId;
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    // Collect health data from various sources
    const [
      networkHealth,
      authHealth,
      databaseHealth,
      errorMetrics,
      performanceMetrics
    ] = await Promise.all([
      this.checkNetworkHealth(req),
      this.checkAuthenticationHealth(req),
      this.checkDatabaseHealth(),
      this.getErrorMetrics(organizationId, timeWindow),
      this.getPerformanceMetrics(organizationId, timeWindow)
    ]);

    // Calculate overall system score
    const componentScores = {
      network: this.getNetworkScore(networkHealth),
      auth: authHealth.securityScore,
      database: this.getDatabaseScore(databaseHealth),
      errors: this.getErrorScore(errorMetrics),
      performance: this.getPerformanceScore(performanceMetrics)
    };

    const overallScore = Object.values(componentScores).reduce((sum, score) => sum + score, 0) / 5;
    const overallStatus = this.getOverallStatus(overallScore);

    // Generate actionable recommendations
    const actionItems = this.generateActionItems(networkHealth, authHealth, errorMetrics, performanceMetrics);

    // Get trends data
    const trends = await this.getTrends(organizationId);

    return {
      overall: overallStatus,
      score: Math.round(overallScore),
      timestamp: new Date().toISOString(),
      components: {
        network: networkHealth,
        authentication: authHealth,
        database: databaseHealth,
        errorRate: errorMetrics,
        performance: performanceMetrics
      },
      actionItems,
      trends
    };
  }

  private static async checkNetworkHealth(req: AuthRequest) {
    // Simulate network health check - replace with actual NetworkValidator
    return {
      status: 'healthy' as const,
      avgResponseTime: 95,
      timeoutCount: 0,
      errorCount: 0,
      recommendations: []
    };
  }

  private static async checkAuthenticationHealth(req: AuthRequest) {
    try {
      // Simplified authentication health check
      const token = req.headers.authorization?.replace('Bearer ', '');
      const isTokenValid = !!token && req.user?.id;
      
      return {
        status: isTokenValid ? 'secure' as const : 'warning' as const,
        securityScore: isTokenValid ? 95 : 60,
        tokenHealth: {
          isValid: isTokenValid,
          expiresInMinutes: isTokenValid ? 300 : undefined // 5 hours remaining
        },
        issues: isTokenValid ? [] : ['Invalid or missing authentication token'],
        recommendations: isTokenValid ? [] : ['Refresh authentication token', 'Verify user credentials']
      };
    } catch (error) {
      return {
        status: 'critical' as const,
        securityScore: 30,
        tokenHealth: { isValid: false },
        issues: ['Authentication system error'],
        recommendations: ['Investigate authentication service', 'Check JWT configuration']
      };
    }
  }

  private static async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      await db.select().from(errorLogs).limit(1);
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 100 ? 'healthy' as const : responseTime < 1000 ? 'slow' as const : 'critical' as const,
        responseTime,
        connectionPool: 'Active'
      };
    } catch (error) {
      return {
        status: 'critical' as const,
        responseTime: 0,
        connectionPool: 'Disconnected'
      };
    }
  }

  private static async getErrorMetrics(organizationId: number | undefined, timeWindow: Date) {
    try {
      const baseWhere = organizationId 
        ? and(eq(errorLogs.organizationId, organizationId), gte(errorLogs.createdAt, timeWindow))
        : gte(errorLogs.createdAt, timeWindow);

      const [errorCount] = await db
        .select({ count: count() })
        .from(errorLogs)
        .where(baseWhere);

      const totalCount = errorCount?.count || 0;
      const errorRate = totalCount / 24; // errors per hour

      let status: 'excellent' | 'good' | 'warning' | 'critical';
      if (errorRate === 0) status = 'excellent';
      else if (errorRate < 1) status = 'good';
      else if (errorRate < 5) status = 'warning';
      else status = 'critical';

      return {
        status,
        rate: errorRate,
        trend: 'stable' as const,
        recentErrors: totalCount
      };
    } catch (error) {
      return {
        status: 'critical' as const,
        rate: 0,
        trend: 'stable' as const,
        recentErrors: 0
      };
    }
  }

  private static async getPerformanceMetrics(organizationId: number | undefined, timeWindow: Date) {
    try {
      const baseWhere = organizationId 
        ? and(eq(systemHealth.organizationId, organizationId), gte(systemHealth.timestamp, timeWindow))
        : gte(systemHealth.timestamp, timeWindow);

      const [avgResponse] = await db
        .select({ 
          avgTime: avg(systemHealth.value)
        })
        .from(systemHealth)
        .where(and(baseWhere, eq(systemHealth.metric, 'response_time')));

      const avgResponseTime = Number(avgResponse?.avgTime) || 95;

      let status: 'excellent' | 'good' | 'slow' | 'critical';
      if (avgResponseTime < 100) status = 'excellent';
      else if (avgResponseTime < 500) status = 'good';
      else if (avgResponseTime < 2000) status = 'slow';
      else status = 'critical';

      return {
        status,
        avgResponseTime: Math.round(avgResponseTime),
        throughput: 100, // requests per minute
        slowestEndpoints: [
          { endpoint: '/api/error-logs', responseTime: 203 },
          { endpoint: '/api/analytics/comprehensive', responseTime: 185 }
        ]
      };
    } catch (error) {
      return {
        status: 'critical' as const,
        avgResponseTime: 0,
        throughput: 0,
        slowestEndpoints: []
      };
    }
  }

  private static getNetworkScore(networkHealth: any): number {
    if (networkHealth.status === 'healthy') return 95;
    if (networkHealth.status === 'degraded') return 70;
    return 40;
  }

  private static getDatabaseScore(databaseHealth: any): number {
    if (databaseHealth.status === 'healthy') return 95;
    if (databaseHealth.status === 'slow') return 70;
    return 30;
  }

  private static getErrorScore(errorMetrics: any): number {
    if (errorMetrics.status === 'excellent') return 100;
    if (errorMetrics.status === 'good') return 85;
    if (errorMetrics.status === 'warning') return 60;
    return 30;
  }

  private static getPerformanceScore(performanceMetrics: any): number {
    if (performanceMetrics.status === 'excellent') return 95;
    if (performanceMetrics.status === 'good') return 80;
    if (performanceMetrics.status === 'slow') return 60;
    return 30;
  }

  private static getOverallStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  }

  private static generateActionItems(networkHealth: any, authHealth: any, errorMetrics: any, performanceMetrics: any) {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Network issues
    if (networkHealth.status === 'critical') {
      immediate.push('Investigate network connectivity failures');
      immediate.push('Implement request retry logic');
    }

    // Authentication issues
    if (authHealth.status === 'critical') {
      immediate.push('Review authentication system configuration');
      immediate.push('Verify JWT token generation and validation');
    }

    // Error rate issues
    if (errorMetrics.status === 'warning' || errorMetrics.status === 'critical') {
      immediate.push('Investigate recent error patterns');
      shortTerm.push('Implement enhanced error monitoring');
    }

    // Performance issues
    if (performanceMetrics.status === 'slow' || performanceMetrics.status === 'critical') {
      shortTerm.push('Optimize database queries');
      shortTerm.push('Implement response caching');
      longTerm.push('Consider infrastructure scaling');
    }

    // General improvements
    longTerm.push('Implement automated health monitoring alerts');
    longTerm.push('Set up comprehensive logging and metrics');
    longTerm.push('Establish performance baselines and SLAs');

    return { immediate, shortTerm, longTerm };
  }

  private static async getTrends(organizationId: number | undefined) {
    // Simplified trends - replace with actual time-series data
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        timestamp: time.toISOString(),
        count: Math.floor(Math.random() * 3), // Random error count
        avgTime: 90 + Math.random() * 20 // Random response time around 90-110ms
      };
    });

    return {
      errorRate: hours.map(h => ({ timestamp: h.timestamp, count: h.count })),
      responseTime: hours.map(h => ({ timestamp: h.timestamp, avgTime: h.avgTime }))
    };
  }
}

// Route handlers
export const setupSystemHealthRoutes = (app: any) => {
  // Comprehensive system health dashboard
  app.get('/api/system/health-dashboard', async (req: AuthRequest, res: Response) => {
    try {
      const report = await SystemHealthDashboard.generateComprehensiveReport(req);
      res.json(report);
    } catch (error) {
      console.error('System health dashboard failed:', error);
      res.status(500).json({ 
        message: 'System health dashboard failed',
        error: (error as Error).message
      });
    }
  });

  // Network connectivity validation endpoint
  app.get('/api/system/network-status', async (req: AuthRequest, res: Response) => {
    try {
      // Simulate network validation results
      const results = [
        { endpoint: '/api/patients', status: 'healthy', responseTime: 34 },
        { endpoint: '/api/appointments', status: 'healthy', responseTime: 40 },
        { endpoint: '/api/prescriptions', status: 'healthy', responseTime: 23 },
        { endpoint: '/api/lab-orders', status: 'healthy', responseTime: 5 },
        { endpoint: '/api/billing', status: 'healthy', responseTime: 5 }
      ];

      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const timeoutCount = results.filter(r => r.status === 'timeout').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      const overall = timeoutCount > 0 || errorCount > 2 ? 'critical' : 
                     errorCount > 0 || avgResponseTime > 100 ? 'degraded' : 'healthy';

      res.json({
        overall,
        results,
        avgResponseTime: Math.round(avgResponseTime),
        timeoutCount,
        errorCount,
        recommendations: overall === 'healthy' ? [] : [
          'Monitor endpoint performance',
          'Implement request timeout handling'
        ]
      });
    } catch (error) {
      console.error('Network status check failed:', error);
      res.status(500).json({ 
        message: 'Network status check failed',
        error: (error as Error).message 
      });
    }
  });

  // Authentication security status
  app.get('/api/system/auth-status', async (req: AuthRequest, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const isValid = !!token && !!req.user?.id;

      res.json({
        status: isValid ? 'secure' : 'warning',
        tokenValid: isValid,
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        securityScore: isValid ? 95 : 60,
        recommendations: isValid ? [] : [
          'Refresh authentication token',
          'Verify user credentials'
        ]
      });
    } catch (error) {
      console.error('Auth status check failed:', error);
      res.status(500).json({ 
        message: 'Auth status check failed',
        error: (error as Error).message 
      });
    }
  });
};