// AI-Powered Medical Consultation Service
// Reference: blueprint:javascript_openai_ai_integrations
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
  }>;
  diagnosis: string;
  recommendations: string;
  followUpInstructions: string;
}

export async function simulatePatientResponse(
  messages: ConsultationMessage[],
  patientContext: PatientContext,
  chiefComplaint: string
): Promise<string> {
  const systemPrompt = `You are simulating a patient named ${patientContext.name}, a ${patientContext.age}-year-old ${patientContext.gender}.

Chief Complaint: ${chiefComplaint}

Medical Background:
- Medical History: ${patientContext.medicalHistory || 'None reported'}
- Known Allergies: ${patientContext.allergies || 'None'}
- Current Medications: ${patientContext.currentMedications || 'None'}

Instructions:
- Respond naturally as the patient would during a medical consultation
- Provide realistic, medically plausible symptoms and responses
- Be specific but not overly technical
- Express concerns, fears, or questions a real patient might have
- If asked about specific symptoms, provide detailed but realistic descriptions
- Stay in character - you are the patient, not a doctor
- Keep responses conversational and brief (2-4 sentences)`;

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }))
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: chatMessages,
    temperature: 0.8,
    max_tokens: 200
  });

  return response.choices[0]?.message?.content || 'I would like to discuss my symptoms with you.';
}

export async function generateClinicalNotes(
  transcript: ConsultationMessage[],
  patientContext: PatientContext
): Promise<ClinicalNote> {
  const systemPrompt = `You are an expert medical scribe creating structured clinical notes from a doctor-patient consultation.

Patient Information:
- Name: ${patientContext.name}
- Age: ${patientContext.age}
- Gender: ${patientContext.gender}
- Medical History: ${patientContext.medicalHistory || 'None reported'}
- Allergies: ${patientContext.allergies || 'None'}
- Current Medications: ${patientContext.currentMedications || 'None'}

Generate comprehensive clinical notes in SOAP format (Subjective, Objective, Assessment, Plan) based on the consultation transcript.

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "chiefComplaint": "Brief chief complaint",
  "subjective": "Patient's description of symptoms and concerns",
  "objective": "Physical examination findings and vital signs mentioned",
  "assessment": "Clinical assessment and differential diagnoses",
  "plan": "Treatment plan and recommendations",
  "historyOfPresentIllness": "Detailed HPI",
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Dosage amount",
      "frequency": "Frequency (e.g., twice daily)",
      "duration": "Duration (e.g., 7 days)"
    }
  ],
  "diagnosis": "Primary diagnosis",
  "recommendations": "Additional recommendations",
  "followUpInstructions": "Follow-up instructions"
}`;

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
    temperature: 0.3
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
    recommendations: parsedNote.recommendations || '',
    followUpInstructions: parsedNote.followUpInstructions || ''
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
