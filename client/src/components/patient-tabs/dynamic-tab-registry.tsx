import React from 'react';
import { LucideIcon } from 'lucide-react';
import {
  User,
  Calendar,
  TestTube,
  Pill,
  Activity,
  FileText,
  CreditCard,
  Shield,
  CalendarDays,
  History,
  FileCheck,
  MessageSquare,
  Brain,
  Clock,
  Syringe,
  AlertTriangle,
  Scan,
  Stethoscope,
  Scissors,
  Heart,
  Baby,
  Bone,
  Sparkles,
  ClipboardList,
  Users,
  BookOpen,
  Timer,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { PatientBillingTab } from '../patient-billing-tab';
import { ClinicalNotesTab } from './clinical-notes-tab';
import { CarePlansTab } from './care-plans-tab';
import { VisitsTab } from './visits-tab';
import { LabResultsTab } from './lab-results-tab';
import { MedicationsTab } from './medications-tab';
import { VitalsTab } from './vitals-tab';
import { AllergiesTab } from './allergies-tab';
import { AppointmentsTab } from './appointments-tab';
import { ImmunizationsTab } from './immunizations-tab';
import { OverviewTab } from './overview-tab';
import { TimelineTab } from './timeline-tab';
import { DocumentsTab } from './documents-tab';
import { ReferralsTab } from './referrals-tab';
import { LongevityTab } from './longevity-tab';
import PsychologicalTherapyAssessment from '@/components/psychological-therapy-assessment';
import { PatientInsuranceTab } from '@/components/patient-insurance-tab';
import { PatientHistoryTab } from '@/components/patient-history-tab';
import { EnhancedMedicationReview } from '@/components/enhanced-medication-review';
import PatientChat from '@/components/patient-chat';
import { PatientSafetyAlertsRealtime } from '@/components/patient-safety-alerts-realtime';
import { PatientImaging } from '@/components/patient-imaging';
import { PatientProcedures } from '@/components/patient-procedures';

export interface TabRenderProps {
  patient: any;
  onAddVisit?: () => void;
  onAddPrescription?: () => void;
  [key: string]: any;
}

export interface SystemTabDefinition {
  key: string;
  defaultLabel: string; // Translation key (e.g., 'tab.overview')
  icon: LucideIcon;
  render: (props: TabRenderProps) => JSX.Element;
}

/**
 * Get translated label for a tab
 */
export function getTabLabel(tab: SystemTabDefinition): string {
  return t(tab.defaultLabel);
}

/**
 * System Tab Registry
 * Maps tab keys to their default configurations and render functions
 * Each system tab is extracted from the monolithic patient overview
 */
export const SYSTEM_TAB_REGISTRY: Record<string, SystemTabDefinition> = {
  overview: {
    key: 'overview',
    defaultLabel: 'tab.overview',
    icon: User,
    render: ({ patient }) => <OverviewTab patient={patient} />,
  },
  
  visits: {
    key: 'visits',
    defaultLabel: 'tab.visits',
    icon: Calendar,
    render: ({ patient }) => <VisitsTab patient={patient} />,
  },
  
  lab: {
    key: 'lab',
    defaultLabel: 'tab.labResults',
    icon: TestTube,
    render: ({ patient }) => <LabResultsTab patient={patient} />,
  },
  
  medications: {
    key: 'medications',
    defaultLabel: 'tab.medications',
    icon: Pill,
    render: ({ patient }) => <MedicationsTab patient={patient} />,
  },
  
  vitals: {
    key: 'vitals',
    defaultLabel: 'tab.vitals',
    icon: Activity,
    render: ({ patient }) => <VitalsTab patient={patient} />,
  },
  
  documents: {
    key: 'documents',
    defaultLabel: 'tab.documents',
    icon: FileText,
    render: ({ patient }) => <DocumentsTab patient={patient} />,
  },
  
  billing: {
    key: 'billing',
    defaultLabel: 'tab.billing',
    icon: CreditCard,
    render: ({ patient, ...props }) => <PatientBillingTab patient={patient} {...props} />,
  },
  
  insurance: {
    key: 'insurance',
    defaultLabel: 'tab.insurance',
    icon: Shield,
    render: ({ patient }) => {
      if (!patient?.id) {
        return (
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400">Patient information not available</p>
          </div>
        );
      }
      return <PatientInsuranceTab patientId={patient.id} />;
    },
  },
  
  appointments: {
    key: 'appointments',
    defaultLabel: 'tab.appointments',
    icon: CalendarDays,
    render: ({ patient }) => <AppointmentsTab patient={patient} />,
  },
  
  history: {
    key: 'history',
    defaultLabel: 'tab.history',
    icon: History,
    render: ({ patient }) => {
      if (!patient?.id) {
        return (
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400">Patient information not available</p>
          </div>
        );
      }
      return <PatientHistoryTab patientId={patient.id} />;
    },
  },
  
  'med-reviews': {
    key: 'med-reviews',
    defaultLabel: 'tab.reviews',
    icon: FileCheck,
    render: ({ patient }) => {
      if (!patient?.id) {
        return (
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400">Patient information not available</p>
          </div>
        );
      }
      return <EnhancedMedicationReview selectedPatientId={patient.id} onReviewCompleted={() => {}} />;
    },
  },
  
  communication: {
    key: 'communication',
    defaultLabel: 'tab.chat',
    icon: MessageSquare,
    render: ({ patient }) => {
      if (!patient?.id) {
        return (
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400">Patient information not available</p>
          </div>
        );
      }
      const patientName = patient.firstName && patient.lastName 
        ? `${patient.firstName} ${patient.lastName}`
        : patient.username || 'Patient';
      return <PatientChat patientId={patient.id} patientName={patientName} />;
    },
  },
  
  'psychological-therapy': {
    key: 'psychological-therapy',
    defaultLabel: 'tab.mentalHealth',
    icon: Brain,
    render: ({ patient }) => (
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mental Health Services</h3>
          <p className="text-sm text-gray-600 mb-4">
            Record psychological therapy sessions and access mental health resources for this patient.
          </p>
        </div>
        <PsychologicalTherapyAssessment patientId={patient.id} />
      </div>
    ),
  },
  
  timeline: {
    key: 'timeline',
    defaultLabel: 'tab.timeline',
    icon: Clock,
    render: ({ patient }) => <TimelineTab patient={patient} />,
  },
  
  immunizations: {
    key: 'immunizations',
    defaultLabel: 'tab.immunizations',
    icon: Syringe,
    render: ({ patient }) => <ImmunizationsTab patient={patient} />,
  },
  
  safety: {
    key: 'safety',
    defaultLabel: 'tab.safety',
    icon: Shield,
    render: ({ patient }) => {
      if (!patient?.id) {
        return (
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400">Patient information not available</p>
          </div>
        );
      }
      return <PatientSafetyAlertsRealtime patientId={patient.id} compact={false} />;
    },
  },
  
  allergies: {
    key: 'allergies',
    defaultLabel: 'tab.allergies',
    icon: AlertTriangle,
    render: ({ patient }) => <AllergiesTab patient={patient} />,
  },
  
  imaging: {
    key: 'imaging',
    defaultLabel: 'tab.imaging',
    icon: Scan,
    render: ({ patient }) => {
      if (!patient?.id) {
        return (
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400">Patient information not available</p>
          </div>
        );
      }
      return <PatientImaging patientId={patient.id} />;
    },
  },
  
  procedures: {
    key: 'procedures',
    defaultLabel: 'tab.procedures',
    icon: Scissors,
    render: ({ patient }) => {
      if (!patient?.id) {
        return (
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400">Patient information not available</p>
          </div>
        );
      }
      return <PatientProcedures patientId={patient.id} />;
    },
  },
  
  referrals: {
    key: 'referrals',
    defaultLabel: 'tab.referrals',
    icon: Users,
    render: ({ patient }) => <ReferralsTab patient={patient} />,
  },
  
  'care-plans': {
    key: 'care-plans',
    defaultLabel: 'tab.carePlans',
    icon: ClipboardList,
    render: ({ patient }) => <CarePlansTab patient={patient} />,
  },
  
  notes: {
    key: 'notes',
    defaultLabel: 'tab.notes',
    icon: BookOpen,
    render: ({ patient }) => <ClinicalNotesTab patient={patient} />,
  },
  
  longevity: {
    key: 'longevity',
    defaultLabel: 'tab.longevity',
    icon: Timer,
    render: ({ patient }) => <LongevityTab patient={patient} />,
  },
};

/**
 * Fallback registry for when tabs aren't in the system registry
 * Used for custom user-created tabs
 */
export function getTabIcon(iconName: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    User,
    Calendar,
    TestTube,
    Pill,
    Activity,
    FileText,
    CreditCard,
    Shield,
    CalendarDays,
    History,
    FileCheck,
    MessageSquare,
    Brain,
    Clock,
    Syringe,
    AlertTriangle,
    Scan,
    Stethoscope,
    Scissors,
    Heart,
    Baby,
    Bone,
    Sparkles,
    ClipboardList,
    Users,
    BookOpen,
    Timer,
  };
  
  return iconMap[iconName] || FileText;
}
