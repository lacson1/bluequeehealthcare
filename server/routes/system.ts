import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import type { Response } from "express";

const router = Router();

/**
 * System management and monitoring routes
 * Handles: error tracking, AI analysis, optimization, performance monitoring
 */
export function setupSystemRoutes(): Router {
  
  // Error handling and AI insights
  router.get('/errors/ai-insights', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { generateAIInsights } = await import('../ai-insights-endpoint');
      await generateAIInsights(req, res);
    } catch (error) {
      console.error('Error in AI insights endpoint:', error);
      res.status(500).json({ error: 'Failed to generate AI insights' });
    }
  });

  router.get('/ai-analysis', async (req, res: Response) => {
    try {
      const { testAIAnalysisWorking } = await import('../ai-analysis-working');
      await testAIAnalysisWorking(req, res);
    } catch (error) {
      console.error('Error in AI analysis endpoint:', error);
      res.status(500).json({ error: 'Failed to perform AI analysis' });
    }
  });

  router.post('/error-chatbot', async (req, res: Response) => {
    try {
      const { handleErrorChatbot } = await import('../error-chatbot-endpoint');
      await handleErrorChatbot(req, res);
    } catch (error) {
      console.error('Error in error chatbot endpoint:', error);
      res.status(500).json({ error: 'Failed to handle error chatbot request' });
    }
  });

  router.get('/errors/predictions', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const predictions = [{
        riskLevel: "LOW",
        likelihood: 15,
        timeframe: "next 24 hours",
        description: "System performance within normal parameters",
        recommendations: ["Continue monitoring", "Regular system maintenance"],
        affectedSystems: ["monitoring"]
      }];
      
      res.json({ predictions });
    } catch (error) {
      console.error('Error generating predictions:', error);
      res.status(500).json({ message: 'Failed to generate predictions' });
    }
  });

  // Test error generation endpoint for debugging
  router.post('/errors/test-generate', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { logServerError } = await import('../error-handler');
      const organizationId = req.user?.organizationId;
      
      // Generate test errors of different types and severities
      const testErrors = [
        { type: 'VALIDATION', severity: 'MEDIUM', message: 'Test validation error for debugging' },
        { type: 'NETWORK', severity: 'HIGH', message: 'Test network connection timeout' },
        { type: 'AUTHENTICATION', severity: 'LOW', message: 'Test authentication warning' }
      ];

      for (const testError of testErrors) {
        await logServerError({
          error: new Error(testError.message),
          req: req,
          severity: testError.severity as any,
          type: testError.type as any,
          action: 'TEST_ERROR_GENERATION',
          component: 'error-monitoring-debug'
        });
      }

      res.json({ 
        success: true, 
        message: 'Test errors generated successfully',
        count: testErrors.length 
      });
    } catch (error) {
      console.error('Error generating test errors:', error);
      res.status(500).json({ message: 'Failed to generate test errors' });
    }
  });

  // Performance monitoring endpoints
  router.get('/performance/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { monitor } = await import('../performance-monitor');
      const timeframe = req.query.timeframe as string || '24h';
      const stats = await monitor.getPerformanceStats(timeframe);
      res.json(stats || { message: 'No performance data available' });
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      res.status(500).json({ error: 'Failed to fetch performance stats' });
    }
  });

  // System optimization endpoints
  router.get('/optimization/tasks', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { getOptimizationTasks } = await import('../system-optimizer');
      await getOptimizationTasks(req, res);
    } catch (error) {
      console.error('Error getting optimization tasks:', error);
      res.status(500).json({ error: 'Failed to get optimization tasks' });
    }
  });

  router.post('/optimization/implement/:taskId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { implementOptimizationTask } = await import('../system-optimizer');
      await implementOptimizationTask(req, res);
    } catch (error) {
      console.error('Error implementing optimization task:', error);
      res.status(500).json({ error: 'Failed to implement optimization task' });
    }
  });

  // Direct AI test endpoint
  router.get('/ai-test', async (req, res: Response) => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.json({ 
          error: "ANTHROPIC_API_KEY not configured",
          status: "API key missing"
        });
      }

      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const prompt = `Analyze these healthcare system errors and provide actionable insights:

Error Summary:
- Total errors: 3
- Error types: {"NETWORK":1,"VALIDATION":1,"AUTHENTICATION":1}
- Severity: {"HIGH":1,"MEDIUM":1,"LOW":1}
- Messages: Test network connection timeout, Test validation error for debugging, Test authentication warning

Provide JSON response with: summary, systemHealth (score, trend, riskFactors), recommendations (immediate, shortTerm, longTerm), predictions.`;

      const message = await anthropic.messages.create({
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-sonnet-4-20250514',
      });

      // Handle different content block types
      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent || !('text' in textContent)) {
        throw new Error('No text content found in AI response');
      }

      const aiResponse = JSON.parse(textContent.text);
      
      res.json({
        success: true,
        aiAnalysis: aiResponse,
        timestamp: new Date().toISOString(),
        model: 'claude-sonnet-4-20250514'
      });

    } catch (error: any) {
      res.json({ 
        error: 'AI analysis failed', 
        details: error.message,
        hasApiKey: !!process.env.ANTHROPIC_API_KEY
      });
    }
  });

  return router;
}
