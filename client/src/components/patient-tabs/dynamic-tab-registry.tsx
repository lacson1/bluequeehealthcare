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
} from 'lucide-react';
import { PatientBillingTab } from '../patient-billing-tab';
import PsychologicalTherapyAssessment from '@/components/psychological-therapy-assessment';

export interface TabRenderProps {
  patient: any;
  onAddVisit?: () => void;
  onAddPrescription?: () => void;
  [key: string]: any;
}

export interface SystemTabDefinition {
  key: string;
  defaultLabel: string;
  icon: LucideIcon;
  render: (props: TabRenderProps) => JSX.Element;
}

/**
 * System Tab Registry
 * Maps tab keys to their default configurations and render functions
 * Each system tab is extracted from the monolithic patient overview
 */
export const SYSTEM_TAB_REGISTRY: Record<string, SystemTabDefinition> = {
  overview: {
    key: 'overview',
    defaultLabel: 'Overview',
    icon: User,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Patient Overview</h2>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            This is the overview tab content. Future implementation will show patient summary.
          </p>
        </div>
      </div>
    ),
  },
  
  visits: {
    key: 'visits',
    defaultLabel: 'Visits',
    icon: Calendar,
    render: ({ patient, onAddVisit }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Patient Visits</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Visit history will be displayed here. 
        </p>
      </div>
    ),
  },
  
  lab: {
    key: 'lab',
    defaultLabel: 'Lab Results',
    icon: TestTube,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Laboratory Results</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Lab orders and results will be displayed here.
        </p>
      </div>
    ),
  },
  
  medications: {
    key: 'medications',
    defaultLabel: 'Medications',
    icon: Pill,
    render: ({ patient, onAddPrescription }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Medications</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Active and past medications will be displayed here.
        </p>
      </div>
    ),
  },
  
  vitals: {
    key: 'vitals',
    defaultLabel: 'Vitals',
    icon: Activity,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Vital Signs</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Vital signs history and tracking will be displayed here.
        </p>
      </div>
    ),
  },
  
  documents: {
    key: 'documents',
    defaultLabel: 'Documents',
    icon: FileText,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Documents</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Medical records and documents will be displayed here.
        </p>
      </div>
    ),
  },
  
  billing: {
    key: 'billing',
    defaultLabel: 'Billing',
    icon: CreditCard,
    render: ({ patient, ...props }) => <PatientBillingTab patient={patient} {...props} />,
  },
  
  insurance: {
    key: 'insurance',
    defaultLabel: 'Insurance',
    icon: Shield,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Insurance</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Insurance information and claims will be displayed here.
        </p>
      </div>
    ),
  },
  
  appointments: {
    key: 'appointments',
    defaultLabel: 'Appointments',
    icon: CalendarDays,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Appointments</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upcoming and past appointments will be displayed here.
        </p>
      </div>
    ),
  },
  
  history: {
    key: 'history',
    defaultLabel: 'History',
    icon: History,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Medical History</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Patient medical history will be displayed here.
        </p>
      </div>
    ),
  },
  
  'med-reviews': {
    key: 'med-reviews',
    defaultLabel: 'Reviews',
    icon: FileCheck,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Medication Reviews</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Medication review history will be displayed here.
        </p>
      </div>
    ),
  },
  
  communication: {
    key: 'communication',
    defaultLabel: 'Chat',
    icon: MessageSquare,
    render: ({ patient }) => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Communication</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Patient messages and communication history will be displayed here.
        </p>
      </div>
    ),
  },
  
  'psychological-therapy': {
    key: 'psychological-therapy',
    defaultLabel: 'Mental Health',
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
  };
  
  return iconMap[iconName] || FileText;
}
