import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

interface TestErrorData {
  type: string;
  severity: string;
  message: string;
  component?: string;
}

export async function testAIAnalysis(req: Request, res: Response) {
  try {
    // Sample error data from the captured errors
    const errorData = {
      totalErrors: 3,
      errorsByType: { NETWORK: 1, VALIDATION: 1, AUTHENTICATION: 1 },
      errorsBySeverity: { HIGH: 1, MEDIUM: 1, LOW: 1 },
      commonMessages: [
        "Test network connection timeout",
        "Test validation error for debugging", 
        "Test authentication warning"
      ],
      affectedComponents: ["error-monitoring-debug"],
      timeframe: "24h"
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: "ANTHROPIC_API_KEY not configured",
        fallbackAnalysis: {
          summary: `Detected ${errorData.totalErrors} errors in the last 24h. 0 critical, 1 high severity.`,
          systemHealth: { score: 80, trend: "stable", riskFactors: ["1 high severity error"] },
          recommendations: ["Review network connectivity", "Validate authentication systems", "Monitor error patterns"]
        }
      });
    }

    // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Analyze the following healthcare system error data and provide actionable insights:

Error Summary:
- Total errors: ${errorData.totalErrors}
- Time period: ${errorData.timeframe}
- Error types: ${JSON.stringify(errorData.errorsByType)}
- Severity distribution: ${JSON.stringify(errorData.errorsBySeverity)}
- Common error messages: ${errorData.commonMessages.join(', ')}
- Affected components: ${errorData.affectedComponents.join(', ')}

Recent error details:
- NETWORK (HIGH): Test network connection timeout in error-monitoring-debug
- VALIDATION (MEDIUM): Test validation error for debugging in error-monitoring-debug
- AUTHENTICATION (LOW): Test authentication warning in error-monitoring-debug

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
    
    res.json({
      success: true,
      aiAnalysis: aiResponse,
      metadata: {
        model: 'claude-sonnet-4-20250514',
        timestamp: new Date().toISOString(),
        errorsAnalyzed: errorData.totalErrors
      }
    });

  } catch (error) {
    console.error('AI analysis test failed:', error);
    res.status(500).json({ 
      error: 'AI analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}