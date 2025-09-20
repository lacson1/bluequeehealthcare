import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Users, 
  FileText, 
  TestTube, 
  Pill, 
  Calendar,
  BarChart3,
  Stethoscope,
  Heart,
  Shield,
  Star,
  CheckCircle
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  actionText?: string;
  tips?: string[];
}

interface OnboardingTourProps {
  userRole: string;
  userName: string;
  onComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingTour({ 
  userRole, 
  userName, 
  onComplete, 
  isOpen, 
  onClose 
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Role-specific tour steps
  const getTourSteps = (): TourStep[] => {
    const commonSteps: TourStep[] = [
      {
        id: 'welcome',
        title: `Welcome to the Clinic, ${userName}! 👋`,
        description: `We're excited to have you join our healthcare team as a ${userRole}. This quick tour will help you get started with our digital clinic system.`,
        icon: <Heart className="h-6 w-6 text-red-500" />,
        tips: [
          "Take your time to explore each feature",
          "Don't worry - you can always restart this tour later",
          "Your colleagues are here to help if you need assistance"
        ]
      },
      {
        id: 'navigation',
        title: 'Getting Around the System',
        description: 'The sidebar on the left is your main navigation hub. You can access all the features you need from here.',
        icon: <ChevronRight className="h-6 w-6 text-blue-500" />,
        tips: [
          "The dashboard gives you a quick overview",
          "Look for the colored icons to identify different sections",
          "Your permissions determine what you can access"
        ]
      }
    ];

    const roleSpecificSteps: Record<string, TourStep[]> = {
      doctor: [
        {
          id: 'patients',
          title: 'Patient Management',
          description: 'This is where you\'ll spend most of your time. View patient records, update medical histories, and track treatment progress.',
          icon: <Users className="h-6 w-6 text-green-500" />,
          actionText: "Try viewing a patient profile",
          tips: [
            "Use the search bar to quickly find patients",
            "Patient photos help with identification",
            "Recent visits are highlighted for easy access"
          ]
        },
        {
          id: 'consultations',
          title: 'Digital Consultation Forms',
          description: 'Create detailed consultation records with our smart forms. They auto-populate based on symptoms and medical history.',
          icon: <FileText className="h-6 w-6 text-purple-500" />,
          tips: [
            "Forms adapt based on the type of consultation",
            "Previous diagnoses help suggest follow-up care",
            "You can customize forms for your specialty"
          ]
        },
        {
          id: 'lab-orders',
          title: 'Laboratory Orders',
          description: 'Order lab tests efficiently with our categorized system. Tests are organized by type (blood, urine, radiology, etc.).',
          icon: <TestTube className="h-6 w-6 text-orange-500" />,
          tips: [
            "Common tests are grouped for quick selection",
            "Reference ranges are displayed automatically",
            "Track order status from pending to completed"
          ]
        },
        {
          id: 'prescriptions',
          title: 'Digital Prescriptions',
          description: 'Prescribe medications with dosage calculators and drug interaction warnings built right in.',
          icon: <Pill className="h-6 w-6 text-pink-500" />,
          tips: [
            "Dosage calculator helps with pediatric patients",
            "Drug interactions are flagged automatically",
            "Prescription history is tracked for each patient"
          ]
        }
      ],
      nurse: [
        {
          id: 'patients',
          title: 'Patient Care Management',
          description: 'Monitor patient vitals, update care plans, and coordinate with doctors for comprehensive patient care.',
          icon: <Users className="h-6 w-6 text-green-500" />,
          tips: [
            "Vital signs can be recorded quickly",
            "Care notes are shared with the medical team",
            "Patient alerts help prioritize urgent cases"
          ]
        },
        {
          id: 'vitals',
          title: 'Vital Signs Tracking',
          description: 'Record and monitor patient vital signs with trend analysis and automatic alerts for abnormal values.',
          icon: <Stethoscope className="h-6 w-6 text-red-500" />,
          tips: [
            "Trends help identify patient deterioration",
            "Abnormal values are highlighted in red",
            "Charts show progress over time"
          ]
        },
        {
          id: 'appointments',
          title: 'Appointment Coordination',
          description: 'Help manage patient appointments, check-ins, and coordinate care between different departments.',
          icon: <Calendar className="h-6 w-6 text-blue-500" />,
          tips: [
            "Color coding shows appointment types",
            "Reminders help reduce no-shows",
            "You can reschedule appointments as needed"
          ]
        }
      ],
      pharmacist: [
        {
          id: 'pharmacy',
          title: 'Pharmacy Management',
          description: 'Manage medication inventory, process prescriptions, and track drug interactions and allergies.',
          icon: <Pill className="h-6 w-6 text-green-500" />,
          tips: [
            "Low stock alerts help maintain inventory",
            "Prescription verification ensures patient safety",
            "Drug interaction warnings prevent complications"
          ]
        },
        {
          id: 'inventory',
          title: 'Medicine Inventory',
          description: 'Track medicine stocks, expiry dates, and set up automatic reorder alerts for essential medications.',
          icon: <BarChart3 className="h-6 w-6 text-orange-500" />,
          tips: [
            "Expiry date tracking prevents waste",
            "Automatic reorder points maintain stock",
            "Usage reports help with purchasing decisions"
          ]
        }
      ],
      admin: [
        {
          id: 'users',
          title: 'Staff Management',
          description: 'Manage clinic staff accounts, assign roles, and monitor system usage across your organization.',
          icon: <Shield className="h-6 w-6 text-purple-500" />,
          tips: [
            "Role-based access keeps data secure",
            "Audit logs track all system activities",
            "User permissions can be customized"
          ]
        },
        {
          id: 'analytics',
          title: 'Clinic Analytics',
          description: 'Monitor clinic performance with comprehensive dashboards showing patient flow, staff productivity, and financial metrics.',
          icon: <BarChart3 className="h-6 w-6 text-green-500" />,
          tips: [
            "Daily reports help track performance",
            "Trends identify areas for improvement",
            "Export data for detailed analysis"
          ]
        }
      ]
    };

    const closingSteps: TourStep[] = [
      {
        id: 'security',
        title: 'Security & Privacy',
        description: 'Patient data is encrypted and secure. Always log out when stepping away, and never share your login credentials.',
        icon: <Shield className="h-6 w-6 text-green-600" />,
        tips: [
          "Two-factor authentication adds extra security",
          "Patient consent is required for data sharing",
          "Regular backups protect against data loss"
        ]
      },
      {
        id: 'completion',
        title: 'You\'re Ready to Start! 🎉',
        description: 'Congratulations! You now know the basics of our clinic system. Remember, practice makes perfect, and your team is here to support you.',
        icon: <Star className="h-6 w-6 text-yellow-500" />,
        tips: [
          "Don't hesitate to ask questions",
          "Explore features at your own pace",
          "Patient care is our top priority"
        ]
      }
    ];

    return [
      ...commonSteps,
      ...(roleSpecificSteps[userRole] || []),
      ...closingSteps
    ];
  };

  const tourSteps = getTourSteps();
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCompletedSteps(prev => [...prev, tourSteps[currentStep].id]);
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps(prev => [...prev, tourSteps[currentStep].id]);
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = tourSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {currentStepData.icon}
              Staff Onboarding Tour
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Step {currentStep + 1} of {tourSteps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {currentStepData.icon}
                {currentStepData.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>

              {currentStepData.tips && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    💡 Helpful Tips:
                  </h4>
                  <ul className="space-y-1">
                    {currentStepData.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentStepData.actionText && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Try it:</strong> {currentStepData.actionText}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role-specific welcome message for first step */}
          {currentStep === 0 && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Your Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </h4>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {userRole === 'doctor' && "You'll have access to patient records, consultation forms, lab orders, and prescription management."}
                  {userRole === 'nurse' && "You'll focus on patient care, vital signs monitoring, and appointment coordination."}
                  {userRole === 'pharmacist' && "You'll manage medication inventory, process prescriptions, and ensure drug safety."}
                  {userRole === 'admin' && "You'll oversee staff management, system settings, and clinic analytics."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Don't show again
              </Button>
              <Button onClick={handleNext} className="flex items-center gap-2">
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Complete Tour
                    <Star className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}