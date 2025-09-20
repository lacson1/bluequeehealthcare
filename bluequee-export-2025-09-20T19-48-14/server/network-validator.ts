import { Request, Response } from 'express';
import { db } from './db';
import { errorLogs, systemHealth } from '@shared/schema';
import { AuthRequest, logServerError } from './error-handler';

interface NetworkCheck {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  timeout: number;
  expectedStatus?: number;
}

interface ConnectivityResult {
  endpoint: string;
  status: 'healthy' | 'slow' | 'timeout' | 'error';
  responseTime: number;
  statusCode?: number;
  error?: string;
}

export class NetworkValidator {
  private static readonly CRITICAL_ENDPOINTS: NetworkCheck[] = [
    { endpoint: '/api/patients', method: 'GET', timeout: 5000, expectedStatus: 200 },
    { endpoint: '/api/appointments', method: 'GET', timeout: 5000, expectedStatus: 200 },
    { endpoint: '/api/prescriptions', method: 'GET', timeout: 5000, expectedStatus: 200 },
    { endpoint: '/api/lab-orders', method: 'GET', timeout: 5000, expectedStatus: 200 },
    { endpoint: '/api/billing', method: 'GET', timeout: 5000, expectedStatus: 200 },
    { endpoint: '/api/health', method: 'GET', timeout: 3000, expectedStatus: 200 }
  ];

  private static readonly TIMEOUT_THRESHOLDS = {
    EXCELLENT: 100,
    GOOD: 500,
    SLOW: 2000,
    CRITICAL: 5000
  };

  static async validateSystemConnectivity(req: AuthRequest): Promise<ConnectivityResult[]> {
    const results: ConnectivityResult[] = [];
    
    for (const check of this.CRITICAL_ENDPOINTS) {
      try {
        const result = await this.checkEndpoint(check, req);
        results.push(result);
        
        // Log slow responses
        if (result.responseTime > this.TIMEOUT_THRESHOLDS.SLOW) {
          await logServerError({
            error: new Error(`Slow response detected: ${result.endpoint} took ${result.responseTime}ms`),
            req,
            severity: result.responseTime > this.TIMEOUT_THRESHOLDS.CRITICAL ? 'HIGH' : 'MEDIUM',
            type: 'NETWORK',
            action: 'connectivity_check',
            component: 'NetworkValidator'
          });
        }
        
        // Log system health metric
        await db.insert(systemHealth).values({
          metric: 'endpoint_response_time',
          value: result.responseTime.toString(),
          unit: 'ms',
          organizationId: req.user?.organizationId || null,
          metadata: { endpoint: result.endpoint, status: result.status }
        });
        
      } catch (error) {
        const errorResult: ConnectivityResult = {
          endpoint: check.endpoint,
          status: 'error',
          responseTime: check.timeout,
          error: error.message
        };
        results.push(errorResult);
        
        await logServerError({
          error,
          req,
          severity: 'HIGH',
          type: 'NETWORK',
          action: 'connectivity_check',
          component: 'NetworkValidator'
        });
      }
    }
    
    return results;
  }

  private static async checkEndpoint(check: NetworkCheck, req: AuthRequest): Promise<ConnectivityResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          endpoint: check.endpoint,
          status: 'timeout',
          responseTime: check.timeout,
          error: `Request timeout after ${check.timeout}ms`
        });
      }, check.timeout);

      // Simulate internal API call using fetch
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      const fullUrl = `${protocol}://${host}${check.endpoint}`;
      
      fetch(fullUrl, {
        method: check.method,
        headers: {
          'Authorization': req.get('Authorization') || '',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(check.timeout)
      })
      .then(response => {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        
        let status: ConnectivityResult['status'] = 'healthy';
        if (responseTime > this.TIMEOUT_THRESHOLDS.SLOW) {
          status = 'slow';
        }
        if (check.expectedStatus && response.status !== check.expectedStatus) {
          status = 'error';
        }
        
        resolve({
          endpoint: check.endpoint,
          status,
          responseTime,
          statusCode: response.status
        });
      })
      .catch(error => {
        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;
        
        resolve({
          endpoint: check.endpoint,
          status: error.name === 'TimeoutError' ? 'timeout' : 'error',
          responseTime,
          error: error.message
        });
      });
    });
  }

  static async generateNetworkReport(req: AuthRequest): Promise<{
    overall: 'healthy' | 'degraded' | 'critical';
    results: ConnectivityResult[];
    recommendations: string[];
    avgResponseTime: number;
    timeoutCount: number;
    errorCount: number;
  }> {
    const results = await this.validateSystemConnectivity(req);
    
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const timeoutCount = results.filter(r => r.status === 'timeout').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const slowCount = results.filter(r => r.status === 'slow').length;
    
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const recommendations: string[] = [];
    
    if (timeoutCount > 0 || errorCount > 2) {
      overall = 'critical';
      recommendations.push('Immediate investigation required - multiple endpoint failures detected');
    } else if (errorCount > 0 || slowCount > 1 || avgResponseTime > this.TIMEOUT_THRESHOLDS.SLOW) {
      overall = 'degraded';
      recommendations.push('Performance optimization recommended - slow response times detected');
    }
    
    if (timeoutCount > 0) {
      recommendations.push(`Address network timeouts on ${timeoutCount} endpoint(s)`);
      recommendations.push('Implement request retry logic with exponential backoff');
      recommendations.push('Consider increasing timeout thresholds for critical endpoints');
    }
    
    if (slowCount > 0) {
      recommendations.push('Optimize database queries and add caching where appropriate');
      recommendations.push('Review server resource allocation and scaling options');
    }
    
    if (avgResponseTime > this.TIMEOUT_THRESHOLDS.GOOD) {
      recommendations.push('Implement response time monitoring and alerting');
      recommendations.push('Consider implementing API response caching');
    }
    
    return {
      overall,
      results,
      recommendations,
      avgResponseTime,
      timeoutCount,
      errorCount
    };
  }
}

// Route handlers
export const setupNetworkValidationRoutes = (app: any) => {
  // Network connectivity check endpoint
  app.get('/api/network/validate', async (req: AuthRequest, res: Response) => {
    try {
      const report = await NetworkValidator.generateNetworkReport(req);
      res.json(report);
    } catch (error) {
      console.error('Network validation failed:', error);
      res.status(500).json({ 
        message: 'Network validation failed',
        error: error.message 
      });
    }
  });

  // Individual endpoint health check
  app.post('/api/network/check-endpoint', async (req: AuthRequest, res: Response) => {
    try {
      const { endpoint, method = 'GET', timeout = 5000 } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ message: 'Endpoint is required' });
      }
      
      const check: NetworkCheck = { endpoint, method, timeout };
      const result = await NetworkValidator['checkEndpoint'](check, req);
      
      res.json(result);
    } catch (error) {
      console.error('Endpoint check failed:', error);
      res.status(500).json({ 
        message: 'Endpoint check failed',
        error: error.message 
      });
    }
  });
};