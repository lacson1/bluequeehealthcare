// AI-Powered Medical Consultation Service
// Reference: blueprint:javascript_openai_ai_integrations
import OpenAI from "openai";
import { apiLogger as logger } from './lib/logger';

// Check if OpenAI is configured
const OPENAI_API_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

const isOpenAIConfigured = !!OPENAI_API_KEY;

if (!isOpenAIConfigured) {
  logger.warn('OpenAI API key not configured. AI consultation features will be disabled.');
  logger.warn('Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY environment variable to enable.');
}

const openai = isOpenAIConfigured
  ? new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL,
  })
  : null;

/**
 * Check if AI features are available
 */
export function isAIAvailable(): boolean {
  return isOpenAIConfigured && openai !== null;
}

/**
 * Error thrown when AI features are not configured
 */
export class AINotConfiguredError extends Error {
  constructor() {
    super('AI features are not configured. Please set OPENAI_API_KEY environment variable.');
    this.name = 'AINotConfiguredError';
  }
}

interface ConsultationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface PatientContext {
  name: string;
  age: number;
  gender: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  // Enhanced context
  vitals?: {
    temperature?: string;
    bloodPressure?: string;
    heartRate?: string;
    weight?: string;
  };
  recentVisits?: Array<{
    date: string;
    diagnosis: string;
    treatment?: string;
  }>;
  labResults?: Array<{
    test: string;
    result: string;
    date: string;
    isAbnormal?: boolean;
  }>;
}

interface ClinicalNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    reasoning?: string;
  }>;
  diagnosis: string;
  // Enhanced AI features
  differentialDiagnoses: Array<{
    diagnosis: string;
    icdCode?: string;
    probability: number;
    reasoning: string;
  }>;
  icdCodes: Array<{
    code: string;
    description: string;
    category: string;
  }>;
  suggestedLabTests: Array<{
    test: string;
    reasoning: string;
    urgency: 'routine' | 'urgent' | 'stat';
  }>;
  clinicalWarnings: Array<{
    type: 'contraindication' | 'drug_interaction' | 'allergy' | 'red_flag';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  confidenceScore: number;
  recommendations: string;
  followUpInstructions: string;
  followUpDate?: string;
}

export async function simulatePatientResponse(
  messages: ConsultationMessage[],
  patientContext: PatientContext,
  chiefComplaint: string
): Promise<string> {
  // Check if OpenAI is configured
  if (!openai) {
    logger.debug('AI not configured, returning fallback response');
    return `[AI features not available] As a ${patientContext.age}-year-old patient, I'm here to discuss my ${chiefComplaint}. How can you help me today?`;
  }

  // Build enhanced context with all available patient data
  let contextBuilder = `You are simulating a patient named ${patientContext.name}, a ${patientContext.age}-year-old ${patientContext.gender}.

Chief Complaint: ${chiefComplaint}

Medical Background:
- Medical History: ${patientContext.medicalHistory || 'None reported'}
- Known Allergies: ${patientContext.allergies || 'None'}
- Current Medications: ${patientContext.currentMedications || 'None'}`;

  // Add vitals if available
  if (patientContext.vitals) {
    const vitals = patientContext.vitals;
    const vitalStrings = [];
    if (vitals.temperature) vitalStrings.push(`Temperature: ${vitals.temperature}`);
    if (vitals.bloodPressure) vitalStrings.push(`BP: ${vitals.bloodPressure}`);
    if (vitals.heartRate) vitalStrings.push(`HR: ${vitals.heartRate}`);
    if (vitals.weight) vitalStrings.push(`Weight: ${vitals.weight}`);
    if (vitalStrings.length > 0) {
      contextBuilder += `\n- Current Vitals: ${vitalStrings.join(', ')}`;
    }
  }

  // Add recent visits context
  if (patientContext.recentVisits && patientContext.recentVisits.length > 0) {
    contextBuilder += `\n- Recent Visits:`;
    patientContext.recentVisits.slice(0, 3).forEach(visit => {
      contextBuilder += `\n  • ${visit.date}: ${visit.diagnosis}${visit.treatment ? ` (Treated with: ${visit.treatment})` : ''}`;
    });
  }

  // Add lab results if available
  if (patientContext.labResults && patientContext.labResults.length > 0) {
    contextBuilder += `\n- Recent Lab Results:`;
    patientContext.labResults.slice(0, 5).forEach(lab => {
      const abnormal = lab.isAbnormal ? ' (ABNORMAL)' : '';
      contextBuilder += `\n  • ${lab.test}: ${lab.result}${abnormal} (${lab.date})`;
    });
  }

  contextBuilder += `\n\nInstructions:
- Respond naturally as the patient would during a medical consultation
- Provide realistic, medically plausible symptoms and responses based on your medical history
- Be specific but not overly technical
- Express concerns, fears, or questions a real patient might have
- Reference your medical history and current conditions when relevant
- If asked about specific symptoms, provide detailed but realistic descriptions
- Stay in character - you are the patient, not a doctor
- Keep responses conversational and brief (2-4 sentences)`;

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: contextBuilder },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }))
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: chatMessages,
    temperature: 0.8,
    max_tokens: 250
  });

  return response.choices[0]?.message?.content || 'I would like to discuss my symptoms with you.';
}

export async function generateClinicalNotes(
  transcript: ConsultationMessage[],
  patientContext: PatientContext
): Promise<ClinicalNote> {
  // Check if OpenAI is configured
  if (!openai) {
    logger.debug('AI not configured, returning placeholder clinical notes');
    return {
      subjective: 'AI features not available - Please configure OPENAI_API_KEY',
      objective: 'Unable to generate clinical notes without AI configuration',
      assessment: 'N/A',
      plan: 'Please configure AI features to enable automatic clinical note generation',
      chiefComplaint: 'N/A',
      historyOfPresentIllness: 'N/A',
      medications: [],
      diagnosis: 'N/A',
      differentialDiagnoses: [],
      icdCodes: [],
      suggestedLabTests: [],
      clinicalWarnings: [{
        type: 'red_flag',
        message: 'AI features are not configured. Clinical notes cannot be auto-generated.',
        severity: 'medium'
      }],
      confidenceScore: 0,
      recommendations: 'Please configure AI features by setting OPENAI_API_KEY environment variable.',
      followUpInstructions: 'N/A'
    };
  }

  // Build enhanced patient context
  let contextInfo = `Patient Information:
- Name: ${patientContext.name}
- Age: ${patientContext.age}
- Gender: ${patientContext.gender}
- Medical History: ${patientContext.medicalHistory || 'None reported'}
- Allergies: ${patientContext.allergies || 'None'}
- Current Medications: ${patientContext.currentMedications || 'None'}`;

  if (patientContext.vitals) {
    const v = patientContext.vitals;
    const vitals = [];
    if (v.temperature) vitals.push(`Temp: ${v.temperature}`);
    if (v.bloodPressure) vitals.push(`BP: ${v.bloodPressure}`);
    if (v.heartRate) vitals.push(`HR: ${v.heartRate}`);
    if (v.weight) vitals.push(`Weight: ${v.weight}`);
    if (vitals.length > 0) contextInfo += `\n- Vitals: ${vitals.join(', ')}`;
  }

  if (patientContext.recentVisits && patientContext.recentVisits.length > 0) {
    contextInfo += `\n- Recent Visits: ${patientContext.recentVisits.slice(0, 2).map(v => `${v.date}: ${v.diagnosis}`).join('; ')}`;
  }

  if (patientContext.labResults && patientContext.labResults.length > 0) {
    contextInfo += `\n- Recent Labs: ${patientContext.labResults.slice(0, 3).map(l => `${l.test}: ${l.result}${l.isAbnormal ? ' (ABNORMAL)' : ''}`).join('; ')}`;
  }

  const systemPrompt = `You are an expert AI clinical assistant creating comprehensive SOAP notes with diagnostic support.

${contextInfo}

Generate detailed clinical notes with ALL the following components in valid JSON format:

{
  "chiefComplaint": "Brief chief complaint",
  "subjective": "Patient's symptoms, concerns, and history in their own words",
  "objective": "Physical exam findings, vital signs, and observable data",
  "assessment": "Clinical assessment integrating subjective and objective data",
  "plan": "Detailed treatment plan with medications, tests, and follow-up",
  "historyOfPresentIllness": "Chronological detailed HPI with context",
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Dosage amount with units",
      "frequency": "e.g., twice daily, every 8 hours",
      "duration": "e.g., 7 days, 2 weeks",
      "reasoning": "Why this medication is prescribed for this condition"
    }
  ],
  "diagnosis": "Primary diagnosis with clinical reasoning",
  "differentialDiagnoses": [
    {
      "diagnosis": "Differential diagnosis name",
      "icdCode": "ICD-10 code if applicable (e.g., J20.9)",
      "probability": 75,
      "reasoning": "Why this diagnosis is being considered"
    }
  ],
  "icdCodes": [
    {
      "code": "ICD-10 code (e.g., J06.9)",
      "description": "Description of the condition",
      "category": "Category (e.g., Respiratory, Cardiovascular)"
    }
  ],
  "suggestedLabTests": [
    {
      "test": "Test name (e.g., Complete Blood Count)",
      "reasoning": "Why this test is recommended",
      "urgency": "routine|urgent|stat"
    }
  ],
  "clinicalWarnings": [
    {
      "type": "contraindication|drug_interaction|allergy|red_flag",
      "message": "Specific warning message",
      "severity": "low|medium|high|critical"
    }
  ],
  "confidenceScore": 85,
  "recommendations": "Additional clinical recommendations and patient education",
  "followUpInstructions": "When to return, warning signs to watch for",
  "followUpDate": "YYYY-MM-DD if follow-up needed"
}

CRITICAL INSTRUCTIONS:
- Check patient allergies against all medications
- Flag potential drug interactions
- Consider age, gender, and medical history in recommendations
- Assign realistic ICD-10 codes relevant to Southwest Nigeria healthcare
- Confidence score should reflect diagnostic certainty (0-100)
- Include red flags for serious conditions that need immediate attention
- Suggest lab tests that would help confirm diagnosis`;

  const conversationText = transcript
    .filter(msg => msg.role !== 'system')
    .map(msg => `${msg.role === 'user' ? 'Doctor' : 'Patient'}: ${msg.content}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Consultation Transcript:\n\n${conversationText}` }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2500 // Increased for comprehensive output
  });

  const noteContent = response.choices[0]?.message?.content;
  if (!noteContent) {
    throw new Error('Failed to generate clinical notes');
  }

  const parsedNote = JSON.parse(noteContent);

  return {
    chiefComplaint: parsedNote.chiefComplaint || '',
    subjective: parsedNote.subjective || '',
    objective: parsedNote.objective || '',
    assessment: parsedNote.assessment || '',
    plan: parsedNote.plan || '',
    historyOfPresentIllness: parsedNote.historyOfPresentIllness || '',
    medications: parsedNote.medications || [],
    diagnosis: parsedNote.diagnosis || '',
    // Enhanced AI features
    differentialDiagnoses: parsedNote.differentialDiagnoses || [],
    icdCodes: parsedNote.icdCodes || [],
    suggestedLabTests: parsedNote.suggestedLabTests || [],
    clinicalWarnings: parsedNote.clinicalWarnings || [],
    confidenceScore: parsedNote.confidenceScore || 70,
    recommendations: parsedNote.recommendations || '',
    followUpInstructions: parsedNote.followUpInstructions || '',
    followUpDate: parsedNote.followUpDate
  };
}

export async function suggestDoctorQuestions(
  transcript: ConsultationMessage[],
  patientContext: PatientContext,
  chiefComplaint: string
): Promise<string[]> {
  const systemPrompt = `You are an expert physician assistant helping to guide a medical consultation.

Based on the conversation so far, suggest 3-5 relevant follow-up questions the doctor should ask to:
- Gather complete medical history
- Assess severity and duration of symptoms
- Identify red flags or concerning symptoms
- Rule out differential diagnoses
- Understand impact on daily life

Return ONLY a JSON array of question strings.`;

  const conversationText = transcript
    .filter(msg => msg.role !== 'system')
    .map(msg => `${msg.role === 'user' ? 'Doctor' : 'Patient'}: ${msg.content}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Chief Complaint: ${chiefComplaint}\n\nConversation:\n${conversationText}` }
    ],
    response_format: { type: "json_object" },
    temperature: 0.4
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return [];
  }

  const parsed = JSON.parse(content);
  return parsed.questions || parsed.suggestions || [];
}

interface LabTestSuggestion {
  testId?: number;
  testName: string;
  testCode?: string;
  loincCode?: string;
  category: string;
  reasoning: string;
  urgency: 'routine' | 'urgent' | 'stat';
  priority: number;
  clinicalSignificance: string;
  estimatedCost?: number;
}

interface LabTestSuggestionContext {
  symptoms?: string;
  diagnosis?: string;
  patientAge?: number;
  patientGender?: string;
  medicalHistory?: string;
  currentMedications?: string;
  recentLabResults?: string;
  availableTests: Array<{
    id: number;
    name: string;
    code?: string;
    loincCode?: string;
    category: string;
    description?: string;
    cost?: string;
  }>;
}

export async function suggestLabTests(
  context: LabTestSuggestionContext
): Promise<LabTestSuggestion[]> {
  const { symptoms, diagnosis, patientAge, patientGender, medicalHistory, currentMedications, recentLabResults, availableTests } = context;

  const testCatalog = availableTests.map(t =>
    `${t.name} (${t.code || 'N/A'}) - ${t.category}${t.description ? ': ' + t.description : ''}`
  ).join('\n');

  const systemPrompt = `You are an expert clinical laboratory consultant helping physicians order appropriate lab tests.

Available Lab Tests in Catalog:
${testCatalog}

CRITICAL INSTRUCTIONS:
- Only suggest tests that exist in the available catalog above
- Match suggested tests to actual test names from the catalog
- Provide clear clinical reasoning for each test
- Consider cost-effectiveness and diagnostic yield
- Prioritize tests by clinical importance (1=highest priority, 10=lowest)
- Assign appropriate urgency levels (routine, urgent, stat)
- Consider patient demographics, symptoms, and medical history
- Avoid redundant or unnecessary testing
- Focus on tests relevant to Southwest Nigerian healthcare context

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "testName": "Exact name from catalog",
      "testCode": "Code if available",
      "loincCode": "LOINC code if known",
      "category": "Test category",
      "reasoning": "Clear clinical reasoning for why this test is needed",
      "urgency": "routine|urgent|stat",
      "priority": 1-10,
      "clinicalSignificance": "What will this test help diagnose or rule out"
    }
  ],
  "clinicalRationale": "Overall rationale for the testing strategy",
  "diagnosticApproach": "Brief explanation of the diagnostic approach"
}`;

  let userPrompt = 'Clinical Scenario:\n';
  if (symptoms) userPrompt += `Symptoms: ${symptoms}\n`;
  if (diagnosis) userPrompt += `Diagnosis/Condition: ${diagnosis}\n`;
  if (patientAge) userPrompt += `Patient Age: ${patientAge} years\n`;
  if (patientGender) userPrompt += `Patient Gender: ${patientGender}\n`;
  if (medicalHistory) userPrompt += `Medical History: ${medicalHistory}\n`;
  if (currentMedications) userPrompt += `Current Medications: ${currentMedications}\n`;
  if (recentLabResults) userPrompt += `Recent Lab Results: ${recentLabResults}\n`;

  userPrompt += '\nPlease suggest appropriate lab tests from the available catalog.';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 1500
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return [];
  }

  const parsed = JSON.parse(content);
  const suggestions = parsed.suggestions || [];

  const mappedSuggestions = suggestions
    .map((suggestion: any) => {
      const matchedTest = availableTests.find(t =>
        t.name.toLowerCase() === suggestion.testName?.toLowerCase() ||
        t.code?.toLowerCase() === suggestion.testCode?.toLowerCase()
      );

      if (!matchedTest) {
        return null;
      }

      return {
        testId: matchedTest.id,
        testName: matchedTest.name,
        testCode: matchedTest.code || '',
        loincCode: matchedTest.loincCode || '',
        category: matchedTest.category || '',
        reasoning: suggestion.reasoning || '',
        urgency: suggestion.urgency || 'routine',
        priority: suggestion.priority || 5,
        clinicalSignificance: suggestion.clinicalSignificance || '',
        estimatedCost: matchedTest.cost ? parseFloat(matchedTest.cost) : undefined
      };
    })
    .filter((suggestion: LabTestSuggestion | null): suggestion is LabTestSuggestion => suggestion !== null);

  return mappedSuggestions;
}

/**
 * AI-Powered Diagnostic Suggestions
 * Analyzes symptoms, vital signs, and patient history to suggest possible diagnoses
 */
export interface DiagnosticSuggestion {
  diagnosis: string;
  icdCode?: string;
  probability: number; // 0-100
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
  redFlags?: string[];
  recommendedTests?: string[];
}

export interface DiagnosticSuggestionContext {
  chiefComplaint?: string;
  symptoms?: string;
  historyOfPresentIllness?: string;
  patientAge?: number;
  patientGender?: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
  };
  physicalExamination?: {
    generalAppearance?: string;
    cardiovascularSystem?: string;
    respiratorySystem?: string;
    gastrointestinalSystem?: string;
    neurologicalSystem?: string;
    musculoskeletalSystem?: string;
  };
  recentLabResults?: Array<{
    test: string;
    result: string;
    isAbnormal?: boolean;
  }>;
}

export async function suggestDiagnoses(
  context: DiagnosticSuggestionContext
): Promise<DiagnosticSuggestion[]> {
  if (!isAIAvailable()) {
    throw new AINotConfiguredError();
  }

  const {
    chiefComplaint,
    symptoms,
    historyOfPresentIllness,
    patientAge,
    patientGender,
    medicalHistory,
    allergies,
    currentMedications,
    vitalSigns,
    physicalExamination,
    recentLabResults
  } = context;

  // Build comprehensive clinical context
  let clinicalContext = 'Clinical Presentation:\n';
  
  if (chiefComplaint) {
    clinicalContext += `Chief Complaint: ${chiefComplaint}\n`;
  }
  
  if (symptoms) {
    clinicalContext += `Symptoms: ${symptoms}\n`;
  }
  
  if (historyOfPresentIllness) {
    clinicalContext += `History of Present Illness: ${historyOfPresentIllness}\n`;
  }
  
  if (patientAge) {
    clinicalContext += `Patient Age: ${patientAge} years\n`;
  }
  
  if (patientGender) {
    clinicalContext += `Patient Gender: ${patientGender}\n`;
  }
  
  if (medicalHistory) {
    clinicalContext += `Medical History: ${medicalHistory}\n`;
  }
  
  if (allergies) {
    clinicalContext += `Allergies: ${allergies}\n`;
  }
  
  if (currentMedications) {
    clinicalContext += `Current Medications: ${currentMedications}\n`;
  }
  
  if (vitalSigns) {
    clinicalContext += '\nVital Signs:\n';
    if (vitalSigns.bloodPressure) clinicalContext += `  Blood Pressure: ${vitalSigns.bloodPressure} mmHg\n`;
    if (vitalSigns.heartRate) clinicalContext += `  Heart Rate: ${vitalSigns.heartRate} bpm\n`;
    if (vitalSigns.temperature) clinicalContext += `  Temperature: ${vitalSigns.temperature}°C\n`;
    if (vitalSigns.respiratoryRate) clinicalContext += `  Respiratory Rate: ${vitalSigns.respiratoryRate}/min\n`;
    if (vitalSigns.oxygenSaturation) clinicalContext += `  Oxygen Saturation: ${vitalSigns.oxygenSaturation}%\n`;
    if (vitalSigns.weight) clinicalContext += `  Weight: ${vitalSigns.weight} kg\n`;
  }
  
  if (physicalExamination) {
    clinicalContext += '\nPhysical Examination:\n';
    if (physicalExamination.generalAppearance) {
      clinicalContext += `  General Appearance: ${physicalExamination.generalAppearance}\n`;
    }
    if (physicalExamination.cardiovascularSystem) {
      clinicalContext += `  Cardiovascular: ${physicalExamination.cardiovascularSystem}\n`;
    }
    if (physicalExamination.respiratorySystem) {
      clinicalContext += `  Respiratory: ${physicalExamination.respiratorySystem}\n`;
    }
    if (physicalExamination.gastrointestinalSystem) {
      clinicalContext += `  Gastrointestinal: ${physicalExamination.gastrointestinalSystem}\n`;
    }
    if (physicalExamination.neurologicalSystem) {
      clinicalContext += `  Neurological: ${physicalExamination.neurologicalSystem}\n`;
    }
    if (physicalExamination.musculoskeletalSystem) {
      clinicalContext += `  Musculoskeletal: ${physicalExamination.musculoskeletalSystem}\n`;
    }
  }
  
  if (recentLabResults && recentLabResults.length > 0) {
    clinicalContext += '\nRecent Lab Results:\n';
    recentLabResults.forEach(lab => {
      clinicalContext += `  ${lab.test}: ${lab.result}${lab.isAbnormal ? ' (ABNORMAL)' : ''}\n`;
    });
  }

  const systemPrompt = `You are an expert clinical diagnostician providing AI-powered diagnostic suggestions for healthcare providers.

Your role is to analyze clinical presentations and suggest possible diagnoses with:
- ICD-10 codes where applicable
- Probability scores (0-100) based on clinical presentation
- Clear reasoning for each diagnosis
- Red flags that require immediate attention
- Recommended diagnostic tests to confirm or rule out diagnoses

CRITICAL INSTRUCTIONS:
- Focus on diagnoses relevant to Southwest Nigerian healthcare context
- Consider common conditions in the region (malaria, typhoid, respiratory infections, etc.)
- Assign realistic probability scores based on clinical presentation
- Flag serious conditions that need immediate attention
- Suggest appropriate diagnostic tests
- Consider patient demographics (age, gender) in your analysis
- Account for medical history, allergies, and current medications
- Provide ICD-10 codes for accurate medical coding
- Confidence levels: low (<50% probability), medium (50-75%), high (>75%)

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "diagnosis": "Primary diagnosis name",
      "icdCode": "ICD-10 code (e.g., J20.9)",
      "probability": 85,
      "reasoning": "Clear clinical reasoning based on symptoms, signs, and patient history",
      "confidence": "high|medium|low",
      "redFlags": ["Any red flag symptoms or signs that need immediate attention"],
      "recommendedTests": ["Lab test or imaging that would help confirm this diagnosis"]
    }
  ],
  "clinicalSummary": "Brief summary of the clinical presentation",
  "differentialDiagnosis": "Brief explanation of the differential diagnostic approach"
}`;

  const userPrompt = `${clinicalContext}\n\nPlease provide diagnostic suggestions based on this clinical presentation.`;

  try {
    const response = await openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent medical reasoning
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Failed to generate diagnostic suggestions');
    }

    const parsed = JSON.parse(content);
    const suggestions = parsed.suggestions || [];

    // Sort by probability (highest first)
    return suggestions
      .map((suggestion: any): DiagnosticSuggestion => ({
        diagnosis: suggestion.diagnosis || '',
        icdCode: suggestion.icdCode,
        probability: Math.min(100, Math.max(0, suggestion.probability || 0)),
        reasoning: suggestion.reasoning || '',
        confidence: suggestion.confidence || 'medium',
        redFlags: suggestion.redFlags || [],
        recommendedTests: suggestion.recommendedTests || []
      }))
      .sort((a: DiagnosticSuggestion, b: DiagnosticSuggestion) => b.probability - a.probability);
  } catch (error) {
    logger.error('Error generating diagnostic suggestions:', error);
    throw new Error('Failed to generate diagnostic suggestions. Please try again.');
  }
}
