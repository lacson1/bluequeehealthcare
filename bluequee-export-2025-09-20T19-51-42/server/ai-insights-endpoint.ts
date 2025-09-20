import { Request, Response } from 'express';
import { db } from './db';
import { errorLogs } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

interface AuthRequest extends Request {
  user?: {
    id: number;
    organizationId: number;
    username: string;
    role: string;
  };
}

export async function generateAIInsights(req: AuthRequest, res: Response) {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const timeframe = req.query.timeframe as string || '7d';
    
    // Get recent errors from the database
    const timeFilter = new Date();
    const timeAmount = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    timeFilter.setDate(timeFilter.getDate() - timeAmount);

    const errors = await db
      .select()
      .from(errorLogs)
      .where(and(
        eq(errorLogs.organizationId, organizationId),
        gte(errorLogs.createdAt, timeFilter)
      ))
      .orderBy(desc(errorLogs.createdAt))
      .limit(50);

    if (errors.length === 0) {
      return res.json({
        summary: "No errors detected in the specified timeframe.",
        systemHealth: { score: 100, trend: "stable", riskFactors: [] },
        patterns: [],
        recommendations: {
          immediate: ["System is operating normally"],
          shortTerm: ["Continue monitoring"],
          longTerm: ["Maintain current practices"]
        },
        predictions: []
      });
    }

    // Prepare error data for AI analysis
    const errorSummary = {
      totalErrors: errors.length,
      errorsByType: errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      errorsBySeverity: errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      commonMessages: errors.slice(0, 10).map(e => e.message),
      affectedComponents: [...new Set(errors.map(e => e.component).filter(Boolean))],
      timePattern: timeframe
    };

    // Use AI to analyze errors if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const prompt = `Analyze the following healthcare system error data and provide actionable insights:

Error Summary:
- Total errors: ${errorSummary.totalErrors}
- Time period: ${timeframe}
- Error types: ${JSON.stringify(errorSummary.errorsByType)}
- Severity distribution: ${JSON.stringify(errorSummary.errorsBySeverity)}
- Common error messages: ${errorSummary.commonMessages.join(', ')}
- Affected components: ${errorSummary.affectedComponents.join(', ')}

Recent error details:
${errors.slice(0, 5).map(e => `- ${e.type} (${e.severity}): ${e.message} in ${e.component}`).join('\n')}

Please provide:
1. A brief system health assessment (score 0-100)
2. Error patterns and trends
3. Immediate, short-term, and long-term recommendations
4. Risk predictions for the next 24 hours

Format your response as a JSON object with these exact keys: summary, systemHealth (with score, trend, riskFactors), patterns (array), recommendations (with immediate, shortTerm, longTerm arrays), predictions (array).`;

        const message = await anthropic.messages.create({
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
          model: 'claude-sonnet-4-20250514',
        });

        const aiResponse = JSON.parse(message.content[0].text);
        return res.json(aiResponse);
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
        // Fall through to manual analysis
      }
    }

    // Manual analysis when AI is not available
    const criticalErrors = errors.filter(e => e.severity === 'CRITICAL').length;
    const highErrors = errors.filter(e => e.severity === 'HIGH').length;
    const systemScore = Math.max(20, 100 - (criticalErrors * 30) - (highErrors * 10));

    const insights = {
      summary: `Detected ${errors.length} errors in the last ${timeframe}. ${criticalErrors} critical, ${highErrors} high severity.`,
      systemHealth: {
        score: systemScore,
        trend: errors.length > 10 ? "declining" : errors.length > 5 ? "stable" : "improving",
        riskFactors: [
          ...(criticalErrors > 0 ? [`${criticalErrors} critical errors`] : []),
          ...(highErrors > 2 ? [`${highErrors} high severity errors`] : []),
          ...(errorSummary.errorsByType.AUTHENTICATION ? ['Authentication issues detected'] : [])
        ]
      },
      patterns: Object.entries(errorSummary.errorsByType).map(([type, count]) => ({
        type,
        frequency: count,
        severity: errors.filter(e => e.type === type)[0]?.severity || 'MEDIUM',
        commonMessages: errors.filter(e => e.type === type).slice(0, 3).map(e => e.message),
        timePattern: 'recent',
        affectedComponents: [...new Set(errors.filter(e => e.type === type).map(e => e.component).filter(Boolean))]
      })),
      recommendations: {
        immediate: [
          ...(criticalErrors > 0 ? ['Address critical errors immediately'] : []),
          ...(errorSummary.errorsByType.AUTHENTICATION ? ['Review authentication systems'] : []),
          'Monitor error patterns closely'
        ],
        shortTerm: [
          'Implement automated error alerting',
          'Review system logs for patterns',
          'Update error handling procedures'
        ],
        longTerm: [
          'Implement predictive error monitoring',
          'Enhance system resilience',
          'Regular system health assessments'
        ]
      },
      predictions: [{
        riskLevel: systemScore < 70 ? 'HIGH' : systemScore < 85 ? 'MEDIUM' : 'LOW',
        likelihood: Math.min(90, errors.length * 10),
        timeframe: 'next 24 hours',
        description: `Based on current error rate, expect ${Math.ceil(errors.length / (timeAmount === 1 ? 24 : timeAmount * 24) * 24)} errors in next 24h`,
        recommendations: ['Continue monitoring', 'Address high-severity errors first'],
        affectedSystems: errorSummary.affectedComponents
      }]
    };

    res.json(insights);
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ message: 'Failed to generate AI insights' });
  }
}