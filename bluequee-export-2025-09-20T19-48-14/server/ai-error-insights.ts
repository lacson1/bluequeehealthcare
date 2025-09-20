import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { errorLogs, systemHealth } from '@shared/schema';
import { desc, eq, gte, count, sql } from 'drizzle-orm';
import { subDays, subHours } from 'date-fns';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ErrorPattern {
  type: string;
  frequency: number;
  severity: string;
  commonMessages: string[];
  timePattern: string;
  affectedComponents: string[];
}

interface PredictiveInsight {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  likelihood: number; // 0-100
  timeframe: string;
  description: string;
  recommendations: string[];
  affectedSystems: string[];
}

interface AIInsight {
  summary: string;
  patterns: ErrorPattern[];
  predictions: PredictiveInsight[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  systemHealth: {
    score: number; // 0-100
    trend: 'improving' | 'stable' | 'declining';
    riskFactors: string[];
  };
}

export class AIErrorInsights {
  private async getErrorData(organizationId: number, timeframe: string = '7d') {
    const timeFilter = this.getTimeFilter(timeframe);
    
    // Get error statistics
    const errors = await db
      .select()
      .from(errorLogs)
      .where(
        sql`${errorLogs.organizationId} = ${organizationId} AND ${errorLogs.createdAt} >= ${timeFilter}`
      )
      .orderBy(desc(errorLogs.createdAt));

    // Get error counts by type and severity
    const errorStats = await db
      .select({
        type: errorLogs.type,
        severity: errorLogs.severity,
        count: count()
      })
      .from(errorLogs)
      .where(
        sql`${errorLogs.organizationId} = ${organizationId} AND ${errorLogs.createdAt} >= ${timeFilter}`
      )
      .groupBy(errorLogs.type, errorLogs.severity);

    // Get performance metrics
    const performanceMetrics = await db
      .select()
      .from(systemHealth)
      .where(
        sql`${systemHealth.organizationId} = ${organizationId} AND ${systemHealth.timestamp} >= ${timeFilter}`
      )
      .orderBy(desc(systemHealth.timestamp))
      .limit(100);

    return {
      errors,
      errorStats,
      performanceMetrics
    };
  }

  private getTimeFilter(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '1h': return subHours(now, 1);
      case '24h': return subHours(now, 24);
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      default: return subDays(now, 7);
    }
  }

  private analyzeErrorPatterns(errors: any[], errorStats: any[]): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    
    // Group errors by type
    const errorGroups = errors.reduce((groups, error) => {
      const key = error.type;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(error);
      return groups;
    }, {});

    // Analyze each error type
    Object.entries(errorGroups).forEach(([type, typeErrors]: [string, any[]]) => {
      const messages = typeErrors.map(e => e.message);
      const uniqueMessages = [...new Set(messages)];
      const components = typeErrors.map(e => e.component).filter(Boolean);
      const uniqueComponents = [...new Set(components)];
      
      // Analyze time patterns
      const hours = typeErrors.map(e => new Date(e.createdAt).getHours());
      const hourCounts = hours.reduce((counts, hour) => {
        counts[hour] = (counts[hour] || 0) + 1;
        return counts;
      }, {});
      
      const peakHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];
      
      const timePattern = peakHour 
        ? `Peak activity at ${peakHour[0]}:00 (${peakHour[1]} errors)`
        : 'No clear time pattern';

      patterns.push({
        type,
        frequency: typeErrors.length,
        severity: this.getMostCommonSeverity(typeErrors),
        commonMessages: uniqueMessages.slice(0, 5),
        timePattern,
        affectedComponents: uniqueComponents
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private getMostCommonSeverity(errors: any[]): string {
    const severities = errors.map(e => e.severity);
    const severityCounts = severities.reduce((counts, severity) => {
      counts[severity] = (counts[severity] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(severityCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'UNKNOWN';
  }

  async generateInsights(organizationId: number, timeframe: string = '7d'): Promise<AIInsight> {
    try {
      const { errors, errorStats, performanceMetrics } = await this.getErrorData(organizationId, timeframe);
      
      // Analyze patterns locally
      const patterns = this.analyzeErrorPatterns(errors, errorStats);
      
      // Prepare data for AI analysis
      const errorSummary = {
        totalErrors: errors.length,
        errorsByType: errorStats.map(stat => ({
          type: stat.type,
          severity: stat.severity,
          count: stat.count
        })),
        recentErrors: errors.slice(0, 10).map(error => ({
          type: error.type,
          severity: error.severity,
          message: error.message,
          component: error.component,
          timestamp: error.createdAt
        })),
        performanceMetrics: performanceMetrics.slice(0, 20).map(metric => ({
          metric: metric.metric,
          value: metric.value,
          timestamp: metric.timestamp
        }))
      };

      // Generate AI insights
      const aiResponse = await this.generateAIAnalysis(errorSummary, patterns);
      
      return aiResponse;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Return fallback insights
      return this.getFallbackInsights(organizationId);
    }
  }

  private async generateAIAnalysis(errorSummary: any, patterns: ErrorPattern[]): Promise<AIInsight> {
    const prompt = `You are a healthcare system reliability expert analyzing error patterns and system health for a clinic management system. 

    Error Data:
    ${JSON.stringify(errorSummary, null, 2)}
    
    Error Patterns:
    ${JSON.stringify(patterns, null, 2)}
    
    Please provide a comprehensive analysis in JSON format with the following structure:
    {
      "summary": "Brief overview of system health and key findings",
      "patterns": [
        {
          "type": "error_type",
          "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
          "trend": "description of trend",
          "impact": "impact on clinic operations"
        }
      ],
      "predictions": [
        {
          "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
          "likelihood": 85,
          "timeframe": "next 24 hours",
          "description": "What might happen",
          "recommendations": ["specific actions to take"],
          "affectedSystems": ["patient management", "appointments", etc.]
        }
      ],
      "recommendations": {
        "immediate": ["urgent actions needed now"],
        "shortTerm": ["actions for next week"],
        "longTerm": ["strategic improvements"]
      },
      "systemHealth": {
        "score": 85,
        "trend": "stable",
        "riskFactors": ["identified risk factors"]
      }
    }
    
    Focus on:
    1. Patient safety implications
    2. Clinic workflow disruptions
    3. Data integrity risks
    4. System reliability concerns
    5. Actionable recommendations for healthcare IT staff`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    try {
      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      throw new Error('Unexpected response format');
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return this.getFallbackInsights(0);
    }
  }

  private getFallbackInsights(organizationId: number): AIInsight {
    return {
      summary: "System analysis completed. Limited insights available due to processing constraints.",
      patterns: [],
      predictions: [],
      recommendations: {
        immediate: ["Monitor system logs regularly", "Ensure backup systems are operational"],
        shortTerm: ["Review error handling procedures", "Update monitoring alerts"],
        longTerm: ["Implement comprehensive monitoring", "Establish error prevention protocols"]
      },
      systemHealth: {
        score: 75,
        trend: 'stable',
        riskFactors: ["Limited monitoring data", "Analysis constraints"]
      }
    };
  }

  async generateErrorPredictions(organizationId: number): Promise<PredictiveInsight[]> {
    try {
      const { errors } = await this.getErrorData(organizationId, '30d');
      
      if (errors.length < 10) {
        return [{
          riskLevel: 'LOW',
          likelihood: 20,
          timeframe: 'next 7 days',
          description: 'Insufficient data for accurate predictions. Continue monitoring.',
          recommendations: ['Increase error logging coverage', 'Monitor system metrics'],
          affectedSystems: ['monitoring']
        }];
      }

      // Analyze error trends
      const hourlyErrors = this.groupErrorsByHour(errors);
      const dailyErrors = this.groupErrorsByDay(errors);
      
      const predictions: PredictiveInsight[] = [];
      
      // Predict peak load issues
      const peakHours = this.identifyPeakHours(hourlyErrors);
      if (peakHours.length > 0) {
        predictions.push({
          riskLevel: 'MEDIUM',
          likelihood: 70,
          timeframe: 'next 24 hours',
          description: `High error rate expected during peak hours (${peakHours.join(', ')}:00)`,
          recommendations: [
            'Scale system resources during peak hours',
            'Implement rate limiting',
            'Monitor database performance closely'
          ],
          affectedSystems: ['patient management', 'appointments', 'database']
        });
      }

      // Predict component failures
      const failingComponents = this.identifyFailingComponents(errors);
      if (failingComponents.length > 0) {
        predictions.push({
          riskLevel: 'HIGH',
          likelihood: 60,
          timeframe: 'next 3 days',
          description: `Components showing increased error rates: ${failingComponents.join(', ')}`,
          recommendations: [
            'Review component logs',
            'Check system dependencies',
            'Prepare rollback procedures'
          ],
          affectedSystems: failingComponents
        });
      }

      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [];
    }
  }

  private groupErrorsByHour(errors: any[]): Record<number, number> {
    return errors.reduce((groups, error) => {
      const hour = new Date(error.createdAt).getHours();
      groups[hour] = (groups[hour] || 0) + 1;
      return groups;
    }, {});
  }

  private groupErrorsByDay(errors: any[]): Record<string, number> {
    return errors.reduce((groups, error) => {
      const day = new Date(error.createdAt).toDateString();
      groups[day] = (groups[day] || 0) + 1;
      return groups;
    }, {});
  }

  private identifyPeakHours(hourlyErrors: Record<number, number>): number[] {
    const avgErrors = Object.values(hourlyErrors).reduce((sum, count) => sum + count, 0) / 24;
    const threshold = avgErrors * 1.5; // 50% above average
    
    return Object.entries(hourlyErrors)
      .filter(([, count]) => count > threshold)
      .map(([hour]) => parseInt(hour))
      .sort();
  }

  private identifyFailingComponents(errors: any[]): string[] {
    const componentErrors = errors.reduce((groups, error) => {
      if (error.component) {
        groups[error.component] = (groups[error.component] || 0) + 1;
      }
      return groups;
    }, {});

    const threshold = Math.max(5, errors.length * 0.1); // At least 5 errors or 10% of total
    
    return Object.entries(componentErrors)
      .filter(([, count]) => (count as number) > threshold)
      .map(([component]) => component);
  }
}

export const aiErrorInsights = new AIErrorInsights();