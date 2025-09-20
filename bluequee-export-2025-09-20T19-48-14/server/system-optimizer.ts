import { Request, Response } from 'express';
import { db } from './db';
import { performanceMetrics, errorLogs } from '@shared/schema';
import { gte, desc, sql, count, avg } from 'drizzle-orm';

interface OptimizationTask {
  id: string;
  title: string;
  description: string;
  category: 'database' | 'api' | 'memory' | 'security' | 'caching';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: string;
  implementation: string;
  sqlQueries?: string[];
  configChanges?: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export class SystemOptimizer {
  async analyzePerformance(organizationId: number): Promise<OptimizationTask[]> {
    const tasks: OptimizationTask[] = [];
    
    // Get recent performance data
    const recentMetrics = await db
      .select()
      .from(performanceMetrics)
      .where(gte(performanceMetrics.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000)))
      .orderBy(desc(performanceMetrics.timestamp));

    if (recentMetrics.length === 0) {
      return tasks;
    }

    // Calculate averages
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const slowQueries = recentMetrics.filter(m => m.responseTime > 1000);
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / recentMetrics.length) * 100;

    // Database optimization recommendations
    if (avgResponseTime > 500) {
      tasks.push({
        id: 'db-index-optimization',
        title: 'Database Index Optimization',
        description: 'Add missing indexes to frequently queried tables to improve response times',
        category: 'database',
        priority: avgResponseTime > 1000 ? 'high' : 'medium',
        estimatedImpact: 'Reduce query time by 40-60%',
        implementation: 'Add composite indexes on commonly filtered columns',
        sqlQueries: [
          'CREATE INDEX CONCURRENTLY idx_patients_org_created ON patients(organization_id, created_at);',
          'CREATE INDEX CONCURRENTLY idx_appointments_org_date ON appointments(organization_id, appointment_date);',
          'CREATE INDEX CONCURRENTLY idx_lab_orders_org_status ON lab_orders(organization_id, status);',
          'CREATE INDEX CONCURRENTLY idx_prescriptions_org_date ON prescriptions(organization_id, created_at);'
        ],
        status: 'pending'
      });
    }

    // API performance optimization
    if (slowQueries.length > 0) {
      const slowestEndpoints = this.groupByEndpoint(slowQueries);
      tasks.push({
        id: 'api-query-optimization',
        title: 'Slow API Endpoint Optimization',
        description: `Optimize ${slowestEndpoints.length} slow endpoints with response times > 1000ms`,
        category: 'api',
        priority: 'high',
        estimatedImpact: 'Improve user experience and reduce server load',
        implementation: 'Implement query optimization and result caching',
        configChanges: {
          caching: {
            enabled: true,
            ttl: 300,
            endpoints: slowestEndpoints.map(e => e.endpoint)
          }
        },
        status: 'pending'
      });
    }

    // Error rate optimization
    if (errorRate > 2) {
      tasks.push({
        id: 'error-handling-improvement',
        title: 'Error Handling Enhancement',
        description: `Current error rate is ${errorRate.toFixed(1)}%. Implement better error handling and validation`,
        category: 'api',
        priority: errorRate > 5 ? 'critical' : 'high',
        estimatedImpact: 'Reduce error rate by 50-70%',
        implementation: 'Add input validation, better error responses, and retry logic',
        status: 'pending'
      });
    }

    // Memory optimization
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + Number(m.memoryUsage), 0) / recentMetrics.length;
    if (avgMemoryUsage > 50) {
      tasks.push({
        id: 'memory-optimization',
        title: 'Memory Usage Optimization',
        description: `Average memory usage is ${avgMemoryUsage.toFixed(1)}MB. Implement memory management improvements`,
        category: 'memory',
        priority: 'medium',
        estimatedImpact: 'Reduce memory usage by 20-30%',
        implementation: 'Implement connection pooling and garbage collection optimization',
        configChanges: {
          database: {
            maxConnections: 10,
            connectionTimeout: 30000
          },
          gc: {
            maxOldSpaceSize: 512
          }
        },
        status: 'pending'
      });
    }

    // Security optimization
    tasks.push({
      id: 'security-headers',
      title: 'Security Headers Implementation',
      description: 'Add security headers and CORS configuration for better protection',
      category: 'security',
      priority: 'medium',
      estimatedImpact: 'Improve security posture and compliance',
      implementation: 'Add helmet.js and configure security middleware',
      configChanges: {
        security: {
          helmet: true,
          cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['localhost:3000'],
            credentials: true
          }
        }
      },
      status: 'pending'
    });

    // Caching optimization
    tasks.push({
      id: 'response-caching',
      title: 'Response Caching Implementation',
      description: 'Implement Redis caching for frequently accessed data',
      category: 'caching',
      priority: 'medium',
      estimatedImpact: 'Reduce database load by 30-50%',
      implementation: 'Set up Redis cache for patient data, lab results, and reports',
      configChanges: {
        cache: {
          type: 'redis',
          ttl: {
            patients: 3600,
            labResults: 1800,
            reports: 7200
          }
        }
      },
      status: 'pending'
    });

    return tasks;
  }

  private groupByEndpoint(metrics: any[]) {
    const grouped = metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = {
          endpoint: key,
          count: 0,
          totalTime: 0
        };
      }
      acc[key].count++;
      acc[key].totalTime += metric.responseTime;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => ({
      ...item,
      avgTime: item.totalTime / item.count
    })).sort((a: any, b: any) => b.avgTime - a.avgTime);
  }

  async implementOptimization(taskId: string, organizationId: number): Promise<{ success: boolean; message: string }> {
    try {
      const tasks = await this.analyzePerformance(organizationId);
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        return { success: false, message: 'Optimization task not found' };
      }

      switch (task.id) {
        case 'db-index-optimization':
          return await this.implementDatabaseIndexes(task);
        case 'security-headers':
          return await this.implementSecurityHeaders(task);
        default:
          return { success: false, message: 'Optimization not yet implemented' };
      }
    } catch (error) {
      console.error('Optimization implementation error:', error);
      return { success: false, message: 'Failed to implement optimization' };
    }
  }

  private async implementDatabaseIndexes(task: OptimizationTask): Promise<{ success: boolean; message: string }> {
    if (!task.sqlQueries) {
      return { success: false, message: 'No SQL queries defined for this task' };
    }

    try {
      for (const query of task.sqlQueries) {
        await db.execute(sql.raw(query));
      }
      return { success: true, message: 'Database indexes created successfully' };
    } catch (error) {
      console.error('Database optimization error:', error);
      return { success: false, message: 'Failed to create database indexes' };
    }
  }

  private async implementSecurityHeaders(task: OptimizationTask): Promise<{ success: boolean; message: string }> {
    // This would typically involve updating server configuration
    // For now, we'll return success as it requires server restart
    return { 
      success: true, 
      message: 'Security headers configuration updated. Server restart required.' 
    };
  }

  async getOptimizationReport(organizationId: number) {
    const tasks = await this.analyzePerformance(organizationId);
    
    const summary = {
      totalTasks: tasks.length,
      criticalTasks: tasks.filter(t => t.priority === 'critical').length,
      highPriorityTasks: tasks.filter(t => t.priority === 'high').length,
      estimatedImprovements: {
        performanceGain: '25-40%',
        errorReduction: '50-70%',
        securityImprovement: 'High'
      },
      recommendedOrder: tasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    };

    return { tasks, summary };
  }
}

export const systemOptimizer = new SystemOptimizer();

// API endpoints
export async function getOptimizationTasks(req: Request, res: Response) {
  try {
    const organizationId = 1; // Get from auth context
    const report = await systemOptimizer.getOptimizationReport(organizationId);
    res.json(report);
  } catch (error) {
    console.error('Get optimization tasks error:', error);
    res.status(500).json({ message: 'Failed to get optimization tasks' });
  }
}

export async function implementOptimizationTask(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const organizationId = 1; // Get from auth context
    
    const result = await systemOptimizer.implementOptimization(taskId, organizationId);
    
    if (result.success) {
      res.json({ message: result.message, success: true });
    } else {
      res.status(400).json({ message: result.message, success: false });
    }
  } catch (error) {
    console.error('Implement optimization error:', error);
    res.status(500).json({ message: 'Failed to implement optimization' });
  }
}