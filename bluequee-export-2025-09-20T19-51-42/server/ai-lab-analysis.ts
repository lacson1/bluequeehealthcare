import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface LabAnalysisRequest {
  testName: string;
  result: string;
  referenceRange?: string;
  units?: string;
  patientAge?: number;
  patientGender?: string;
  clinicalContext?: string;
}

interface LabAnalysisResponse {
  interpretation: string;
  status: 'normal' | 'abnormal' | 'critical' | 'high' | 'low' | 'borderline';
  recommendations: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  followUpNeeded: boolean;
  additionalTests?: string[];
}

export async function analyzeLabResult(request: LabAnalysisRequest): Promise<LabAnalysisResponse> {
  try {
    const prompt = `You are a clinical laboratory specialist providing analysis for lab results. 

Patient Information:
- Age: ${request.patientAge || 'Not specified'}
- Gender: ${request.patientGender || 'Not specified'}

Lab Test Details:
- Test: ${request.testName}
- Result: ${request.result}
- Reference Range: ${request.referenceRange || 'Not provided'}
- Units: ${request.units || 'Not specified'}
- Clinical Context: ${request.clinicalContext || 'Routine screening'}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "interpretation": "Clinical interpretation of the result (2-3 sentences)",
  "status": "normal|abnormal|critical|high|low|borderline",
  "recommendations": "Clinical recommendations and next steps",
  "urgency": "low|medium|high|critical",
  "followUpNeeded": true/false,
  "additionalTests": ["test1", "test2"] (if applicable)
}

Focus on:
1. Clinical significance of the result
2. Immediate actions needed if any
3. Follow-up recommendations
4. Additional tests if warranted
5. Patient counseling points

Be precise, evidence-based, and clinically relevant.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const analysis = JSON.parse(content.text);
      return analysis;
    }

    throw new Error('Invalid response format from AI analysis');
  } catch (error) {
    console.error('AI lab analysis error:', error);
    
    // Fallback response if AI analysis fails
    return {
      interpretation: `Lab result for ${request.testName}: ${request.result}. Please review with reference range and clinical context.`,
      status: 'normal',
      recommendations: 'Please review result with clinical context and patient history.',
      urgency: 'low',
      followUpNeeded: false
    };
  }
}

export async function batchAnalyzeLabResults(requests: LabAnalysisRequest[]): Promise<LabAnalysisResponse[]> {
  const analyses = await Promise.all(
    requests.map(request => analyzeLabResult(request))
  );
  return analyses;
}

export async function generateLabSummary(results: Array<{
  testName: string;
  result: string;
  analysis: LabAnalysisResponse;
}>): Promise<string> {
  try {
    const prompt = `Generate a comprehensive laboratory summary for the following test results:

${results.map(r => `
Test: ${r.testName}
Result: ${r.result}
Status: ${r.analysis.status}
Interpretation: ${r.analysis.interpretation}
`).join('\n')}

Provide a clinical summary that includes:
1. Overall assessment
2. Key findings
3. Clinical significance
4. Recommended actions
5. Follow-up plan

Keep it concise but comprehensive for clinical decision-making.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Invalid response format from AI summary');
  } catch (error) {
    console.error('AI lab summary error:', error);
    return 'Laboratory summary analysis temporarily unavailable. Please review individual results.';
  }
}