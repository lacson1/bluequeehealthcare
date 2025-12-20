import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MessageSquare, Bell, Calendar, Settings, Send, Clock, Copy, FileText, Pill,
  Heart, CreditCard, Stethoscope, Check, User, Phone, Mail, AlertCircle,
  Activity, FlaskConical, ChevronRight, Sparkles, Eye, X, Search,
  CalendarDays, ClipboardList, History, Zap, ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow, addDays, isAfter, isBefore, parseISO } from 'date-fns';

// Enhanced message templates with smart placeholders
const MESSAGE_TEMPLATES = [
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    category: 'appointment',
    icon: Calendar,
    suggestWhen: ['hasUpcomingAppointment'],
    priority: 'normal',
    content: `Dear {patientName},

This is a friendly reminder about your upcoming appointment scheduled for {appointmentDate} at {appointmentTime} with {doctorName}.

Please arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule, please contact us at least 24 hours in advance.

We look forward to seeing you!

Best regards,
{clinicName}`
  },
  {
    id: 'lab-results',
    name: 'Lab Results Ready',
    category: 'lab_result',
    icon: FileText,
    suggestWhen: ['hasRecentLabResults'],
    priority: 'high',
    content: `Dear {patientName},

Your recent lab results from {labTestDate} are now available. 

Test(s) completed: {labTestNames}

Please log into your patient portal to view them, or contact our office to schedule a follow-up appointment with your healthcare provider.

If you have any questions about your results, please don't hesitate to reach out.

Best regards,
{clinicName}`
  },
  {
    id: 'prescription-refill',
    name: 'Prescription Refill Reminder',
    category: 'treatment_plan',
    icon: Pill,
    suggestWhen: ['hasActivePrescriptions'],
    priority: 'normal',
    content: `Dear {patientName},

This is a reminder that your prescription for {medicationName} ({medicationDosage}) is due for a refill.

Current medication details:
- Medication: {medicationName}
- Dosage: {medicationDosage}
- Instructions: {medicationInstructions}

Please contact our office or visit your pharmacy to ensure you don't run out of your medication.

If you have any questions or need to discuss your treatment plan, please schedule an appointment with your healthcare provider.

Best regards,
{clinicName}`
  },
  {
    id: 'follow-up',
    name: 'Follow-up Visit Request',
    category: 'appointment',
    icon: Stethoscope,
    suggestWhen: ['hasRecentVisit', 'hasFollowUpDue'],
    priority: 'normal',
    content: `Dear {patientName},

We hope you're recovering well since your last visit on {lastVisitDate}.

It's time for your follow-up visit to review your progress and discuss your ongoing care regarding: {lastVisitReason}

Please contact our office to schedule your next appointment at your earliest convenience.

We look forward to seeing you soon!

Best regards,
{clinicName}`
  },
  {
    id: 'health-tips',
    name: 'General Health Tips',
    category: 'general',
    icon: Heart,
    suggestWhen: [],
    priority: 'low',
    content: `Dear {patientName},

Here are some helpful health tips for this season:

• Stay hydrated by drinking plenty of water
• Maintain a balanced diet rich in fruits and vegetables
• Get regular exercise - aim for at least 30 minutes daily
• Ensure adequate sleep (7-9 hours for adults)
• Schedule your annual check-up

If you have any health concerns, please don't hesitate to contact us.

Best regards,
{clinicName}`
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    category: 'general',
    icon: CreditCard,
    suggestWhen: ['hasOutstandingBalance'],
    priority: 'normal',
    content: `Dear {patientName},

This is a friendly reminder regarding your outstanding balance of {amountDue}. 

Please log into your patient portal to make a payment, or contact our billing department if you have any questions or would like to discuss payment options.

Thank you for your prompt attention to this matter.

Best regards,
{clinicName}`
  },
  {
    id: 'abnormal-results',
    name: 'Abnormal Lab Results - Urgent',
    category: 'lab_result',
    icon: AlertCircle,
    suggestWhen: ['hasAbnormalLabResults'],
    priority: 'high',
    content: `Dear {patientName},

Your recent lab results require attention. We would like to discuss them with you at your earliest convenience.

Test: {labTestNames}
Date: {labTestDate}

Please contact our office as soon as possible to schedule a follow-up appointment with your healthcare provider.

If you experience any concerning symptoms, please seek immediate medical attention.

Best regards,
{clinicName}`
  },
  {
    id: 'medication-change',
    name: 'Medication Change Notice',
    category: 'treatment_plan',
    icon: Pill,
    suggestWhen: ['hasMedicationChange'],
    priority: 'high',
    content: `Dear {patientName},

Your healthcare provider has made changes to your medication plan. Please review the following updates:

Previous: {previousMedication}
New: {newMedication}

Important instructions: {medicationInstructions}

Please ensure you understand these changes before starting your new medication. If you have any questions or concerns, contact our office immediately.

Best regards,
{clinicName}`
  }
];

interface Message {
  id: number;
  patientId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  messageType: 'general' | 'appointment' | 'lab_result' | 'treatment_plan';
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
}

interface AppointmentReminder {
  id: number;
  patientId: number;
  appointmentDate: string;
  appointmentTime?: string;
  doctorName: string;
  type: string;
  status: 'pending' | 'sent' | 'confirmed' | 'cancelled' | 'scheduled' | 'completed';
  reminderSent: boolean;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  allergies?: string;
  medicalHistory?: string;
}

interface Prescription {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  status: string;
  createdAt: string;
}

interface LabResult {
  id: number;
  testName: string;
  result: string;
  status: string;
  testDate: string;
  referenceRange?: string;
}

interface Visit {
  id: number;
  visitDate: string;
  complaint: string;
  diagnosis: string;
  treatment: string;
  followUpDate?: string;
  status: string;
}

// Patient Context Panel Component
function PatientContextPanel({ patient, appointments, prescriptions, labResults, visits }: {
  patient: Patient;
  appointments: AppointmentReminder[];
  prescriptions: Prescription[];
  labResults: LabResult[];
  visits: Visit[];
}) {
  const upcomingAppointments = appointments.filter(a =>
    ['scheduled', 'pending'].includes(a.status) &&
    isAfter(new Date(a.appointmentDate), new Date())
  ).slice(0, 3);

  const activeMeds = prescriptions.filter(p =>
    p.status === 'active' || p.status === 'pending' || !p.status
  ).slice(0, 3);

  const recentLabs = labResults.slice(0, 3);
  const lastVisit = visits[0];

  const getAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600">
            <AvatarFallback className="text-white font-semibold">
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{patient.firstName} {patient.lastName}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              {patient.dateOfBirth && (
                <span>{getAge(patient.dateOfBirth)} years old</span>
              )}
              {patient.gender && (
                <>
                  <span>•</span>
                  <span className="capitalize">{patient.gender}</span>
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="flex flex-wrap gap-3 text-sm">
          {patient.phone && (
            <a 
              href={`tel:${patient.phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-600 hover:underline transition-colors cursor-pointer"
              title={`Call ${patient.phone}`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{patient.phone}</span>
            </a>
          )}
          {patient.email && (
            <a 
              href={`mailto:${patient.email}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-600 hover:underline transition-colors cursor-pointer"
              title={`Send email to ${patient.email}`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate max-w-[180px]">{patient.email}</span>
            </a>
          )}
        </div>

        <Separator />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Upcoming Appointments */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              Appointments
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-1">
                {upcomingAppointments.map(apt => (
                  <div key={apt.id} className="text-xs bg-white/60 dark:bg-white/5 rounded px-2 py-1">
                    <div className="font-medium">{format(new Date(apt.appointmentDate), 'MMM d')}</div>
                    <div className="text-muted-foreground truncate">{apt.type}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No upcoming</p>
            )}
          </div>

          {/* Active Medications */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Pill className="h-3.5 w-3.5 text-green-500" />
              Medications
            </div>
            {activeMeds.length > 0 ? (
              <div className="space-y-1">
                {activeMeds.map(med => (
                  <div key={med.id} className="text-xs bg-white/60 dark:bg-white/5 rounded px-2 py-1">
                    <div className="font-medium truncate">{med.medicationName}</div>
                    <div className="text-muted-foreground">{med.dosage}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No active meds</p>
            )}
          </div>

          {/* Recent Labs */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5 text-purple-500" />
              Recent Labs
            </div>
            {recentLabs.length > 0 ? (
              <div className="space-y-1">
                {recentLabs.map(lab => (
                  <div key={lab.id} className="text-xs bg-white/60 dark:bg-white/5 rounded px-2 py-1">
                    <div className="font-medium truncate">{lab.testName}</div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1 py-0 ${lab.status === 'abnormal' ? 'border-red-200 text-red-700' :
                          lab.status === 'normal' ? 'border-green-200 text-green-700' :
                            'border-gray-200'
                        }`}
                    >
                      {lab.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No recent labs</p>
            )}
          </div>

          {/* Last Visit */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-orange-500" />
              Last Visit
            </div>
            {lastVisit ? (
              <div className="text-xs bg-white/60 dark:bg-white/5 rounded px-2 py-1">
                <div className="font-medium">{format(new Date(lastVisit.visitDate), 'MMM d, yyyy')}</div>
                <div className="text-muted-foreground truncate">{lastVisit.complaint || 'General visit'}</div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No visits recorded</p>
            )}
          </div>
        </div>

        {/* Allergies Warning */}
        {patient.allergies && (
          <>
            <Separator />
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Allergies
              </div>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">{patient.allergies}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Template Preview Dialog Component
function TemplatePreviewDialog({
  template,
  filledContent,
  onUse,
  onClose
}: {
  template: typeof MESSAGE_TEMPLATES[0];
  filledContent: string;
  onUse: () => void;
  onClose: () => void;
}) {
  const IconComponent = template.icon;

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${template.priority === 'high' ? 'bg-red-100 text-red-600' :
              template.priority === 'normal' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-600'
            }`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>{template.name}</DialogTitle>
            <DialogDescription>Preview with patient data filled in</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 mt-4">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
          {filledContent}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onUse}>
          <Send className="h-4 w-4 mr-2" />
          Use This Template
        </Button>
      </div>
    </DialogContent>
  );
}

// Smart Template Suggestions Component
function SmartTemplateSuggestions({
  patient,
  appointments,
  prescriptions,
  labResults,
  visits,
  onSelectTemplate,
  organization
}: {
  patient: Patient;
  appointments: AppointmentReminder[];
  prescriptions: Prescription[];
  labResults: LabResult[];
  visits: Visit[];
  onSelectTemplate: (template: typeof MESSAGE_TEMPLATES[0], filledContent: string) => void;
  organization: any;
}) {
  const getSuggestedTemplates = useMemo(() => {
    const suggestions: { template: typeof MESSAGE_TEMPLATES[0]; reason: string; filledContent: string }[] = [];

    // Check for upcoming appointments
    const upcomingApt = appointments.find(a =>
      ['scheduled', 'pending'].includes(a.status) &&
      isAfter(new Date(a.appointmentDate), new Date()) &&
      isBefore(new Date(a.appointmentDate), addDays(new Date(), 7))
    );

    if (upcomingApt) {
      const template = MESSAGE_TEMPLATES.find(t => t.id === 'appointment-reminder')!;
      suggestions.push({
        template,
        reason: `Appointment on ${format(new Date(upcomingApt.appointmentDate), 'MMM d')}`,
        filledContent: fillTemplate(template.content, patient, { appointment: upcomingApt }, organization)
      });
    }

    // Check for recent lab results
    const recentLab = labResults.find(l => {
      const labDate = new Date(l.testDate);
      const daysSince = (new Date().getTime() - labDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });

    if (recentLab) {
      const template = recentLab.status === 'abnormal'
        ? MESSAGE_TEMPLATES.find(t => t.id === 'abnormal-results')!
        : MESSAGE_TEMPLATES.find(t => t.id === 'lab-results')!;

      suggestions.push({
        template,
        reason: `Lab results from ${format(new Date(recentLab.testDate), 'MMM d')}`,
        filledContent: fillTemplate(template.content, patient, { labResult: recentLab, allLabResults: labResults }, organization)
      });
    }

    // Check for active prescriptions that might need refill
    const activeMed = prescriptions.find(p =>
      (p.status === 'active' || !p.status) && p.medicationName
    );

    if (activeMed) {
      const template = MESSAGE_TEMPLATES.find(t => t.id === 'prescription-refill')!;
      suggestions.push({
        template,
        reason: `Active prescription: ${activeMed.medicationName}`,
        filledContent: fillTemplate(template.content, patient, { prescription: activeMed }, organization)
      });
    }

    // Check for follow-up due
    const lastVisit = visits[0];
    if (lastVisit?.followUpDate) {
      const followUpDate = new Date(lastVisit.followUpDate);
      const daysTillFollowUp = (followUpDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);

      if (daysTillFollowUp <= 7 && daysTillFollowUp >= -7) {
        const template = MESSAGE_TEMPLATES.find(t => t.id === 'follow-up')!;
        suggestions.push({
          template,
          reason: `Follow-up ${daysTillFollowUp < 0 ? 'was due' : 'due'} ${format(followUpDate, 'MMM d')}`,
          filledContent: fillTemplate(template.content, patient, { visit: lastVisit }, organization)
        });
      }
    }

    return suggestions.slice(0, 3);
  }, [patient, appointments, prescriptions, labResults, visits, organization]);

  if (getSuggestedTemplates.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Smart Suggestions
        </CardTitle>
        <CardDescription className="text-xs">
          Based on patient's current status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {getSuggestedTemplates.map(({ template, reason, filledContent }) => {
          const IconComponent = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template, filledContent)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors text-left group"
            >
              <div className={`p-1.5 rounded-lg ${template.priority === 'high' ? 'bg-red-100 text-red-600' :
                  template.priority === 'normal' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                }`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{template.name}</div>
                <div className="text-xs text-muted-foreground truncate">{reason}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Helper function to fill template with patient data
function fillTemplate(
  template: string,
  patient: Patient,
  data: {
    appointment?: AppointmentReminder;
    prescription?: Prescription;
    labResult?: LabResult;
    allLabResults?: LabResult[];
    visit?: Visit;
  },
  organization?: any
): string {
  let filled = template;

  // Patient info
  filled = filled.replace(/{patientName}/g, `${patient.firstName} ${patient.lastName}`);
  filled = filled.replace(/{patientFirstName}/g, patient.firstName);
  filled = filled.replace(/{patientLastName}/g, patient.lastName);

  // Organization info
  const clinicName = organization?.name || 'Our Healthcare Team';
  filled = filled.replace(/{clinicName}/g, clinicName);

  // Appointment data
  if (data.appointment) {
    filled = filled.replace(/{appointmentDate}/g, format(new Date(data.appointment.appointmentDate), 'EEEE, MMMM d, yyyy'));
    filled = filled.replace(/{appointmentTime}/g, data.appointment.appointmentTime || 'your scheduled time');
    filled = filled.replace(/{doctorName}/g, data.appointment.doctorName || 'your healthcare provider');
    filled = filled.replace(/{appointmentType}/g, data.appointment.type || 'appointment');
  }

  // Prescription data
  if (data.prescription) {
    filled = filled.replace(/{medicationName}/g, data.prescription.medicationName);
    filled = filled.replace(/{medicationDosage}/g, data.prescription.dosage || 'as prescribed');
    filled = filled.replace(/{medicationInstructions}/g, data.prescription.instructions || data.prescription.frequency || 'Follow your prescription instructions');
    filled = filled.replace(/{previousMedication}/g, data.prescription.medicationName);
    filled = filled.replace(/{newMedication}/g, data.prescription.medicationName);
  }

  // Lab result data
  if (data.labResult) {
    filled = filled.replace(/{labTestDate}/g, format(new Date(data.labResult.testDate), 'MMMM d, yyyy'));

    // Get all recent lab test names if available
    const labNames = data.allLabResults
      ? data.allLabResults.slice(0, 3).map(l => l.testName).join(', ')
      : data.labResult.testName;
    filled = filled.replace(/{labTestNames}/g, labNames);
    filled = filled.replace(/{labResult}/g, data.labResult.result || 'See portal for details');
  }

  // Visit data
  if (data.visit) {
    filled = filled.replace(/{lastVisitDate}/g, format(new Date(data.visit.visitDate), 'MMMM d, yyyy'));
    filled = filled.replace(/{lastVisitReason}/g, data.visit.complaint || data.visit.diagnosis || 'your health concern');
    filled = filled.replace(/{followUpDate}/g, data.visit.followUpDate ? format(new Date(data.visit.followUpDate), 'MMMM d, yyyy') : 'as needed');
  }

  // Default placeholder cleanup
  filled = filled.replace(/{amountDue}/g, 'your outstanding balance');

  return filled;
}

export function PatientCommunicationHub({ patientId }: { patientId?: number }) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(patientId || null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'general' | 'appointment' | 'lab_result' | 'treatment_plan'>('general');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [communicationPrefs, setCommunicationPrefs] = useState({
    email: 'enabled',
    sms: 'enabled',
    phone: 'disabled'
  });
  const [activeTab, setActiveTab] = useState('messages');
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<{ template: typeof MESSAGE_TEMPLATES[0]; content: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch patients for selection
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    enabled: !patientId
  });

  // Fetch selected patient details
  const { data: patientDetails } = useQuery<Patient>({
    queryKey: [`/api/patients/${selectedPatient}`],
    enabled: !!selectedPatient
  });

  // Fetch messages for selected patient
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedPatient],
    enabled: !!selectedPatient
  });

  // Fetch appointment reminders / appointments
  const { data: appointments = [] } = useQuery<AppointmentReminder[]>({
    queryKey: [`/api/patients/${selectedPatient}/appointments`],
    enabled: !!selectedPatient
  });

  // Fetch prescriptions
  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${selectedPatient}/prescriptions`],
    enabled: !!selectedPatient
  });

  // Fetch lab results
  const { data: labResults = [] } = useQuery<LabResult[]>({
    queryKey: [`/api/patients/${selectedPatient}/labs`],
    enabled: !!selectedPatient
  });

  // Fetch visits
  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: [`/api/patients/${selectedPatient}/visits`],
    enabled: !!selectedPatient
  });

  // Get organization from user context
  const organization = (user as any)?.organization;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => apiRequest('/api/messages', 'POST', messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedPatient] });
      setNewMessage('');
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send appointment reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: (reminderData: any) => apiRequest('/api/appointment-reminders', 'POST', reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${selectedPatient}/appointments`] });
      toast({
        title: "Reminder Sent",
        description: "Appointment reminder has been sent to the patient.",
      });
    }
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: number) => apiRequest(`/api/messages/${messageId}/read`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedPatient] });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedPatient) return;

    const messageData = {
      patientId: selectedPatient,
      content: newMessage,
      messageType,
      priority,
      senderRole: 'staff'
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleSendReminder = (appointmentId: number) => {
    sendReminderMutation.mutate({ appointmentId, patientId: selectedPatient });
  };

  const handlePreferenceUpdate = (method: string, preference: string) => {
    const newPrefs = { ...communicationPrefs, [method]: preference };
    setCommunicationPrefs(newPrefs);

    toast({
      title: "Preferences Updated",
      description: `${method.toUpperCase()} notifications ${preference}`,
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'lab_result': return <FlaskConical className="w-4 h-4" />;
      case 'treatment_plan': return <Pill className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleUseTemplate = (template: typeof MESSAGE_TEMPLATES[0], filledContent?: string) => {
    const content = filledContent || (patientDetails
      ? fillTemplate(template.content, patientDetails, {
        appointment: appointments[0],
        prescription: prescriptions[0],
        labResult: labResults[0],
        allLabResults: labResults,
        visit: visits[0]
      }, organization)
      : template.content);

    setNewMessage(content);
    setMessageType(template.category as any);
    setPriority(template.priority as any);
    setActiveTab('messages');
    setPreviewTemplate(null);
    toast({
      title: "Template Applied",
      description: `${template.name} template has been loaded with patient data.`,
    });
  };

  const handlePreviewTemplate = (template: typeof MESSAGE_TEMPLATES[0]) => {
    if (patientDetails) {
      const content = fillTemplate(template.content, patientDetails, {
        appointment: appointments[0],
        prescription: prescriptions[0],
        labResult: labResults[0],
        allLabResults: labResults,
        visit: visits[0]
      }, organization);
      setPreviewTemplate({ template, content });
    } else {
      setPreviewTemplate({ template, content: template.content });
    }
  };

  const handleCopyTemplate = async (template: typeof MESSAGE_TEMPLATES[0]) => {
    try {
      const content = patientDetails
        ? fillTemplate(template.content, patientDetails, {
          appointment: appointments[0],
          prescription: prescriptions[0],
          labResult: labResults[0],
          allLabResults: labResults,
          visit: visits[0]
        }, organization)
        : template.content;

      await navigator.clipboard.writeText(content);
      setCopiedTemplate(template.id);
      toast({
        title: "Template Copied",
        description: `${template.name} template copied with patient data.`,
      });
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy template to clipboard.",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'appointment': return 'bg-blue-100 text-blue-800';
      case 'lab_result': return 'bg-purple-100 text-purple-800';
      case 'treatment_plan': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'appointment': return 'Appointment';
      case 'lab_result': return 'Lab Result';
      case 'treatment_plan': return 'Treatment';
      default: return 'General';
    }
  };

  // Filter patients by search
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.includes(term)
    );
  }, [patients, searchTerm]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
        <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Patient Communication Hub</CardTitle>
                <CardDescription className="text-blue-100">
                  Send personalized messages with auto-filled patient data
                </CardDescription>
              </div>
            </div>
            {patientDetails && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {patientDetails.firstName} {patientDetails.lastName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Reminders</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              {!patientId && (
                <div className="space-y-2">
                  <Label htmlFor="patient-select">Select Patient</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 mb-2"
                    />
                  </div>
                  <Select value={selectedPatient?.toString() || ''} onValueChange={(value) => setSelectedPatient(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {filteredPatients.map((patient: Patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {patient.firstName} {patient.lastName}
                              {patient.phone && <span className="text-xs text-muted-foreground">({patient.phone})</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedPatient && patientDetails && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left Column - Patient Context & Smart Suggestions */}
                  <div className="xl:col-span-1 space-y-4">
                    <PatientContextPanel
                      patient={patientDetails}
                      appointments={appointments}
                      prescriptions={prescriptions}
                      labResults={labResults}
                      visits={visits}
                    />

                    <SmartTemplateSuggestions
                      patient={patientDetails}
                      appointments={appointments}
                      prescriptions={prescriptions}
                      labResults={labResults}
                      visits={visits}
                      onSelectTemplate={(template, filledContent) => handleUseTemplate(template, filledContent)}
                      organization={organization}
                    />
                  </div>

                  {/* Right Column - Message History & Composer */}
                  <div className="xl:col-span-2 space-y-4">
                    {/* Message History */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Message History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64 pr-4">
                          {messagesLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
                          ) : Array.isArray(messages) && messages.length > 0 ? (
                            <div className="space-y-3">
                              {messages.map((message: Message) => (
                                <div
                                  key={message.id}
                                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${message.isRead
                                      ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                      : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                                    }`}
                                  onClick={() => !message.isRead && markAsReadMutation.mutate(message.id)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {getMessageIcon(message.messageType)}
                                      <span className="font-medium text-sm">{message.senderName}</span>
                                      <Badge variant="outline" className="text-xs">{message.senderRole}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                                        {message.priority}
                                      </Badge>
                                      {!message.isRead && <Bell className="w-3 h-3 text-blue-500" />}
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No messages found</p>
                              <p className="text-xs mt-1">Start the conversation using a template or write a custom message</p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Send New Message */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Compose Message
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="message-type">Message Type</Label>
                            <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">
                                  <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    General
                                  </div>
                                </SelectItem>
                                <SelectItem value="appointment">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Appointment
                                  </div>
                                </SelectItem>
                                <SelectItem value="lab_result">
                                  <div className="flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4" />
                                    Lab Result
                                  </div>
                                </SelectItem>
                                <SelectItem value="treatment_plan">
                                  <div className="flex items-center gap-2">
                                    <Pill className="h-4 w-4" />
                                    Treatment Plan
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                    Low
                                  </div>
                                </SelectItem>
                                <SelectItem value="normal">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Normal
                                  </div>
                                </SelectItem>
                                <SelectItem value="high">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    High
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message-content">Message</Label>
                          <Textarea
                            id="message-content"
                            placeholder="Type your message here or select a template..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            rows={6}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            <Zap className="h-3 w-3 inline mr-1" />
                            Tip: Use smart suggestions or templates for auto-filled patient data
                          </p>
                        </div>

                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {!selectedPatient && (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a patient to get started</p>
                  <p className="text-sm mt-1">Choose a patient to view their context and send personalized messages</p>
                </div>
              )}
            </TabsContent>

            {/* Reminders Tab */}
            <TabsContent value="reminders" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Appointment Reminders</h3>
                  <p className="text-sm text-muted-foreground">Send reminders for upcoming appointments</p>
                </div>
              </div>

              {selectedPatient ? (
                <div className="grid gap-3">
                  {Array.isArray(appointments) && appointments.filter(a =>
                    ['scheduled', 'pending'].includes(a.status)
                  ).length > 0 ? (
                    appointments.filter(a => ['scheduled', 'pending'].includes(a.status)).map((reminder: AppointmentReminder) => (
                      <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {format(new Date(reminder.appointmentDate), 'EEEE, MMMM d, yyyy')}
                                  </span>
                                  {reminder.appointmentTime && (
                                    <Badge variant="outline">{reminder.appointmentTime}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {reminder.type} with {reminder.doctorName || 'Healthcare Provider'}
                                </p>
                                <Badge
                                  variant={reminder.status === 'scheduled' ? 'default' : 'outline'}
                                  className="text-xs"
                                >
                                  {reminder.status}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleSendReminder(reminder.id)}
                              disabled={reminder.reminderSent || sendReminderMutation.isPending}
                              size="sm"
                              variant={reminder.reminderSent ? "outline" : "default"}
                            >
                              {reminder.reminderSent ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Sent
                                </>
                              ) : (
                                <>
                                  <Bell className="w-4 h-4 mr-1" />
                                  Send Reminder
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No upcoming appointments</p>
                      <p className="text-sm mt-1">Schedule an appointment to send reminders</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a patient to view reminders</p>
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Message Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient
                      ? "Templates will be auto-filled with patient data when used"
                      : "Select a patient first to auto-fill templates with their data"
                    }
                  </p>
                </div>
                {selectedPatient && patientDetails && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Auto-fill enabled
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MESSAGE_TEMPLATES.map((template) => {
                  const IconComponent = template.icon;
                  const isCopied = copiedTemplate === template.id;

                  return (
                    <Card key={template.id} className="hover:shadow-lg transition-all hover:-translate-y-0.5 group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg transition-colors ${template.priority === 'high'
                                ? 'bg-red-100 group-hover:bg-red-200'
                                : template.priority === 'normal'
                                  ? 'bg-blue-100 group-hover:bg-blue-200'
                                  : 'bg-gray-100 group-hover:bg-gray-200'
                              }`}>
                              <IconComponent className={`h-4 w-4 ${template.priority === 'high' ? 'text-red-600' :
                                  template.priority === 'normal' ? 'text-blue-600' :
                                    'text-gray-600'
                                }`} />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-xs ${getCategoryColor(template.category)}`}>
                                  {getCategoryLabel(template.category)}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${getPriorityColor(template.priority)}`}>
                                  {template.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-3 mb-4">
                          {template.content.substring(0, 120)}...
                        </p>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handlePreviewTemplate(template)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview with patient data</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyTemplate(template)}
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleUseTemplate(template)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Settings</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Communication Preferences</CardTitle>
                    <CardDescription>Configure how to reach patients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(communicationPrefs).map(([method, preference]) => (
                      <div key={method} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {method === 'email' && <Mail className="h-4 w-4 text-muted-foreground" />}
                          {method === 'sms' && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                          {method === 'phone' && <Phone className="h-4 w-4 text-muted-foreground" />}
                          <Label className="text-sm font-medium capitalize">{method}</Label>
                        </div>
                        <Select
                          value={preference}
                          onValueChange={(value) => handlePreferenceUpdate(method, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                            <SelectItem value="urgent-only">Urgent Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Auto-Reminder Settings</CardTitle>
                    <CardDescription>Automatic notification rules</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Appointment reminders (24h before)</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Lab result notifications</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Prescription refill reminders</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Follow-up visit reminders</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        {previewTemplate && (
          <TemplatePreviewDialog
            template={previewTemplate.template}
            filledContent={previewTemplate.content}
            onUse={() => handleUseTemplate(previewTemplate.template, previewTemplate.content)}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
