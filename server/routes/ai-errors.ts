import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * AI and Error Monitoring Routes
 * Handles AI insights, error predictions, and error testing
 */
export function setupAIErrorRoutes(): Router {
  // AI Error Insights endpoints
  router.get('/errors/ai-insights', authenticateToken, async (req, res) => {
    try {
      const { generateAIInsights } = await import('../ai-insights-endpoint');
      return generateAIInsights(req, res);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      return res.status(500).json({ error: 'Failed to load AI insights handler' });
    }
  });

  router.get('/ai-analysis', async (req, res) => {
    try {
      const { testAIAnalysisWorking } = await import('../ai-analysis-working');
      return testAIAnalysisWorking(req, res);
    } catch (error) {
      console.error('Error loading AI analysis:', error);
      return res.status(500).json({ error: 'Failed to load AI analysis handler' });
    }
  });

  router.post('/error-chatbot', async (req, res) => {
    try {
      const { handleErrorChatbot } = await import('../error-chatbot-endpoint');
      return handleErrorChatbot(req, res);
    } catch (error) {
      console.error('Error loading error chatbot:', error);
      return res.status(500).json({ error: 'Failed to load error chatbot handler' });
    }
  });

  // Direct AI test endpoint
  router.get('/ai-test', async (req, res) => {
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

      return res.json({
        success: true,
        aiAnalysis: aiResponse,
        timestamp: new Date().toISOString(),
        model: 'claude-sonnet-4-20250514'
      });

    } catch (error: any) {
      return res.json({
        error: 'AI analysis failed',
        details: error.message,
        hasApiKey: !!process.env.ANTHROPIC_API_KEY
      });
    }
  });

  router.get('/errors/predictions', authenticateToken, async (req: AuthRequest, res) => {
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

      return res.json({ predictions });
    } catch (error) {
      console.error('Error generating predictions:', error);
      return res.status(500).json({ message: 'Failed to generate predictions' });
    }
  });

  // Test error generation endpoint for debugging
  router.post('/errors/test-generate', authenticateToken, async (req: AuthRequest, res) => {
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

      return res.json({
        success: true,
        message: 'Test errors generated successfully',
        count: testErrors.length
      });
    } catch (error) {
      console.error('Error generating test errors:', error);
      return res.status(500).json({ message: 'Failed to generate test errors' });
    }
  });

  return router;
}

