import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ErrorContext {
  errorId?: string;
  type?: string;
  message?: string;
  severity?: string;
  component?: string;
}

interface ChatbotRequest {
  message: string;
  conversationHistory: ChatMessage[];
  errorContext?: ErrorContext;
}

export async function handleErrorChatbot(req: Request, res: Response) {
  try {
    const { message, conversationHistory, errorContext }: ChatbotRequest = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured'
      });
    }

    // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build context-aware system prompt
    let systemPrompt = `You are an expert healthcare system error analysis assistant. Your role is to help healthcare professionals understand and resolve technical errors in their clinic management system.

Guidelines:
- Provide clear, actionable explanations
- Use healthcare context when relevant
- Suggest specific solutions and preventive measures
- Explain technical concepts in accessible terms
- Focus on patient safety and system reliability
- Categorize your responses as: explanation, solution, code, or warning

Response format: Provide helpful, accurate information without JSON formatting.`;

    if (errorContext) {
      systemPrompt += `\n\nCurrent Error Context:`;
      if (errorContext.type) systemPrompt += `\n- Error Type: ${errorContext.type}`;
      if (errorContext.severity) systemPrompt += `\n- Severity: ${errorContext.severity}`;
      if (errorContext.message) systemPrompt += `\n- Error Message: ${errorContext.message}`;
      if (errorContext.component) systemPrompt += `\n- Component: ${errorContext.component}`;
      if (errorContext.errorId) systemPrompt += `\n- Error ID: ${errorContext.errorId}`;
    }

    // Build conversation messages
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 10 messages to stay within limits)
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory);

    // Add current user message
    messages.push({ role: 'user', content: message });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: messages.slice(1), // Remove system message for Claude API
      system: systemPrompt
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || !('text' in textContent)) {
      throw new Error('No text content found in AI response');
    }

    const aiResponse = textContent.text;

    // Determine message type based on content
    let messageType = 'explanation';
    const lowercaseResponse = aiResponse.toLowerCase();
    
    if (lowercaseResponse.includes('solution') || lowercaseResponse.includes('fix') || lowercaseResponse.includes('resolve')) {
      messageType = 'solution';
    } else if (lowercaseResponse.includes('warning') || lowercaseResponse.includes('caution') || lowercaseResponse.includes('careful')) {
      messageType = 'warning';
    } else if (lowercaseResponse.includes('code') || lowercaseResponse.includes('script') || lowercaseResponse.includes('function')) {
      messageType = 'code';
    }

    res.json({
      success: true,
      response: aiResponse,
      messageType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error chatbot request failed:', error);
    
    // Provide helpful fallback response
    const fallbackResponse = `I apologize, but I encountered an issue processing your request. Here's some general guidance:

For ${req.body.errorContext?.type || 'system'} errors:
1. Check system logs for detailed error information
2. Verify network connectivity and database connections
3. Ensure all required services are running
4. Contact technical support if the issue persists

Would you like to try rephrasing your question or provide more specific details about the error?`;

    res.json({
      success: true,
      response: fallbackResponse,
      messageType: 'explanation',
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
}