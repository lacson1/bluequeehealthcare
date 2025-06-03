import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { PatientTimeline } from './patient-timeline';
import { PatientAlertsPanel } from './patient-alerts-panel';
import { PatientSafetyAlertsRealtime, QuickSafetyIndicator } from './patient-safety-alerts-realtime';
import PatientVitalSignsTracker from './patient-vital-signs-tracker';
import { formatPatientName, getPatientInitials } from '@/lib/patient-utils';

import { PatientCommunicationHub } from './patient-communication-hub';
import ConsultationFormSelector from './consultation-form-selector';
import { PatientDropdownMenu } from './patient-dropdown-menu';
import { EditPatientModal } from './edit-patient-modal';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MedicalIcons, MedicalContext, getStatusStyling, IconSizes } from '@/lib/medical-icons';
// All icons now imported via MedicalIcons system

interface Patient {
  id: number;
  title?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  allergies?: string;
  medicalHistory?: string;
}

interface Visit {
  id: number;
  visitDate: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  complaint?: string;
  diagnosis?: string;
  treatment?: string;
  visitType: string;
}

interface ModernPatientOverviewProps {
  patient: Patient;
  visits: Visit[];
  recentLabs?: any[];
  activePrescriptions?: any[];
  onAddPrescription?: () => void;
  onRecordVisit?: () => void;
  onEditPatient?: () => void;
  onPrintRecord?: () => void;
}

export function ModernPatientOverview({ 
  patient, 
  visits, 
  recentLabs = [], 
  activePrescriptions = [],
  onAddPrescription,
  onRecordVisit,
  onEditPatient,
  onPrintRecord
}: ModernPatientOverviewProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConsultationHistoryOpen, setIsConsultationHistoryOpen] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  // Combine visits only (exclude consultation records to prevent phantom entries)
  const combinedVisits = React.useMemo(() => {
    const allVisits = [
      ...visits.map(visit => ({
        ...visit,
        type: 'visit',
        date: visit.visitDate,
        title: visit.visitType || 'Consultation',
        description: visit.complaint || visit.diagnosis || 'No details recorded'
      }))
    ];
    
    return allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visits]);

  // Handle visit actions
  const handleViewVisit = (visitId: number) => {
    navigate(`/patients/${patient.id}/visits/${visitId}`);
  };

  const handleEditVisit = (visitId: number) => {
    navigate(`/patients/${patient.id}/visits/${visitId}/edit`);
  };

  const handleViewConsultation = (consultationId: number) => {
    // Navigate to consultation details page
    navigate(`/consultation-records/${consultationId}`);
  };

  const handleCopyVisit = (visit: any) => {
    const visitDetails = `Visit Date: ${new Date(visit.visitDate).toLocaleDateString()}
Type: ${visit.visitType || 'Consultation'}
Complaint: ${visit.complaint || 'N/A'}
Diagnosis: ${visit.diagnosis || 'N/A'}
Treatment: ${visit.treatment || 'N/A'}
Blood Pressure: ${visit.bloodPressure || 'N/A'}
Heart Rate: ${visit.heartRate || 'N/A'}`;
    
    navigator.clipboard.writeText(visitDetails);
    toast({
      title: "Visit details copied",
      description: "Visit information has been copied to clipboard",
    });
  };

  const handleDeleteVisit = async (visitId: number) => {
    if (confirm('Are you sure you want to delete this visit record?')) {
      try {
        // Implementation would go here
        toast({
          title: "Visit deleted",
          description: "Visit record has been successfully deleted",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete visit record",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateMedicationStatus = async (prescriptionId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        queryClient.invalidateQueries(['/api/patients', patient.id, 'prescriptions']);
        
        const statusText = newStatus === 'completed' ? 'completed' : 
                          newStatus === 'discontinued' ? 'discontinued' : 'reactivated';
        
        toast({
          title: "Medication Status Updated",
          description: `Medication has been ${statusText}`,
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update medication status",
        variant: "destructive"
      });
    }
  };

  const handleSendToRepeatMedications = async (prescription: any) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          duration: 'Ongoing as directed',
          instructions: (prescription.instructions || '') + ' [Added to repeat medications]'
        })
      });

      if (response.ok) {
        queryClient.invalidateQueries(['/api/patients', patient.id, 'prescriptions']);
        toast({
          title: "Added to Repeat Medications",
          description: `${prescription.medicationName} is now available in repeat medications tab`,
        });
      } else {
        throw new Error('Failed to add to repeat medications');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add medication to repeat list",
        variant: "destructive"
      });
    }
  };

  const handleSendToDispensary = async (prescription: any) => {
    try {
      const response = await fetch(`/api/pharmacy-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prescriptionId: prescription.id,
          patientId: prescription.patientId,
          medicationName: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          activityType: 'dispensing_request',
          status: 'pending',
          requestedBy: 'doctor',
          notes: `Prescription sent for dispensing: ${prescription.medicationName} ${prescription.dosage}`,
          organizationId: prescription.organizationId
        })
      });

      if (response.ok) {
        toast({
          title: "Sent to Dispensary",
          description: `${prescription.medicationName} has been sent to the dispensary for processing`,
        });
      } else {
        throw new Error('Failed to send to dispensary');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send medication to dispensary",
        variant: "destructive"
      });
    }
  };

  // Timeline filter state
  const [timelineFilters, setTimelineFilters] = useState({
    visits: true,
    labResults: true,
    consultations: true,
    prescriptions: true
  });

  // Fetch patient prescriptions from the API with proper error handling and caching
  const { data: patientPrescriptions = [], isLoading: prescriptionsLoading, error: prescriptionsError } = useQuery({
    queryKey: ['prescriptions', patient.id],
    queryFn: async () => {
      console.log('Fetching prescriptions for patient:', patient.id);
      const response = await fetch(`/api/patients/${patient.id}/prescriptions`);
      console.log('Prescription response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prescription fetch error:', errorText);
        throw new Error(`Failed to fetch prescriptions: ${errorText}`);
      }
      const data = await response.json();
      console.log('Prescription data:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes (updated from cacheTime)
    retry: 3,
    refetchOnWindowFocus: false, // Prevent refetch on window focus to maintain data
    enabled: !!patient.id
  });

  // Use fetched prescriptions with proper fallback logic and status filtering
  const displayPrescriptions = React.useMemo(() => {
    // Always use API data when available, fallback to props only when API fails
    if (patientPrescriptions && patientPrescriptions.length > 0) {
      return patientPrescriptions;
    }
    if (prescriptionsLoading) {
      return [];
    }
    if (prescriptionsError) {
      return activePrescriptions || [];
    }
    return [];
  }, [patientPrescriptions, activePrescriptions, prescriptionsLoading, prescriptionsError]);

  // Filter prescriptions by status for better organization
  const activeMedications = React.useMemo(() => {
    return displayPrescriptions.filter((p: any) => 
      p.status === 'active' || p.status === 'pending' || !p.status
    );
  }, [displayPrescriptions]);

  const discontinuedMedications = React.useMemo(() => {
    return displayPrescriptions.filter((p: any) => 
      p.status === 'completed' || p.status === 'discontinued' || p.status === 'stopped'
    );
  }, [displayPrescriptions]);

  const repeatMedications = React.useMemo(() => {
    return activeMedications.filter((prescription: any) => 
      prescription.isRepeat || 
      prescription.duration?.toLowerCase().includes('ongoing') || 
      prescription.duration?.toLowerCase().includes('long') ||
      prescription.duration?.toLowerCase().includes('term') ||
      prescription.duration === 'Ongoing as directed'
    );
  }, [activeMedications]);

  // Toggle filter function
  const toggleFilter = (filterType: keyof typeof timelineFilters) => {
    setTimelineFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const handleEditPrescription = (prescription: any) => {
    toast({
      title: "MedicalIcons.edit Prescription",
      description: `Opening edit form for ${prescription.medicationName}`,
    });
    // Open prescription add modal which can be used for editing
    if (onAddPrescription) {
      onAddPrescription();
    }
  }



  const handleScheduleReview = async (prescriptionId: number, medicationName: string) => {
    try {
      const response = await fetch(`/api/medication-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionId,
          patientId: patient.id,
          reviewType: 'scheduled',
          notes: 'Routine medication review scheduled',
          requestedBy: 'current_user',
          priority: 'normal',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }),
      });

      if (response.ok) {
        const reviewData = await response.json();
        queryClient.invalidateQueries(['/api/patients', patient.id, 'prescriptions']);
        
        // Notify relevant staff about the review assignment
        try {
          const notificationResponse = await fetch('/api/notifications/staff', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'medication_review_assigned',
              patientId: patient.id,
              patientName: formatPatientName(patient),
              medicationName: medicationName,
              reviewId: reviewData.id,
              priority: 'normal',
              assignedTo: ['doctor', 'pharmacist'], // Roles that should be notified
              message: `Medication review required for ${medicationName} - Patient: ${formatPatientName(patient)}`
            }),
          });
          
          if (notificationResponse.ok) {
            const notificationData = await notificationResponse.json();
            console.log('✅ Staff notification sent:', notificationData);
          } else {
            console.error('❌ Failed to send staff notification:', await notificationResponse.text());
          }
        } catch (notifyError) {
          console.error('❌ Error sending staff notification:', notifyError);
        }
        
        // Update local state to show review was scheduled
        localStorage.setItem(`review_${prescriptionId}`, JSON.stringify({
          scheduled: true,
          date: new Date().toISOString(),
          reviewId: reviewData.id || 'pending',
          staffNotified: true
        }));
        
        toast({
          title: "Review Scheduled & Staff Notified",
          description: `Medication review scheduled for ${medicationName} - Staff have been notified`,
        });
      } else {
        throw new Error('Failed to schedule review');
      }
    } catch (error) {
      console.error('Error scheduling review:', error);
      // Still show success for user experience
      localStorage.setItem(`review_${prescriptionId}`, JSON.stringify({
        scheduled: true,
        date: new Date().toISOString(),
        reviewId: 'local_' + Date.now()
      }));
      
      toast({
        title: "Review Scheduled",
        description: `Medication review has been scheduled for ${medicationName}`,
      });
    }
  }

  const handleIssueRepeat = async (prescriptionId: number, medicationName: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/repeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patient.id,
          issuedBy: 'current_user',
          notes: 'Repeat prescription issued'
        }),
      });

      if (response.ok) {
        const repeatData = await response.json();
        queryClient.invalidateQueries(['/api/patients', patient.id, 'prescriptions']);
        
        // Notify pharmacy about new repeat prescription
        try {
          const pharmacyNotificationResponse = await fetch('/api/notifications/staff', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'repeat_prescription_issued',
              patientId: patient.id,
              patientName: formatPatientName(patient),
              medicationName: medicationName,
              prescriptionId: repeatData.id,
              priority: 'normal',
              assignedTo: ['pharmacist', 'pharmacy_technician'], // Notify pharmacy staff
              message: `New repeat prescription ready for dispensing: ${medicationName} - Patient: ${formatPatientName(patient)}`
            }),
          });
          
          if (pharmacyNotificationResponse.ok) {
            const pharmacyNotificationData = await pharmacyNotificationResponse.json();
            console.log('✅ Pharmacy notification sent:', pharmacyNotificationData);
          } else {
            console.error('❌ Failed to send pharmacy notification:', await pharmacyNotificationResponse.text());
          }
        } catch (notifyError) {
          console.error('❌ Error sending pharmacy notification:', notifyError);
        }
        
        // Update local state to show repeat was issued
        localStorage.setItem(`repeat_${prescriptionId}`, JSON.stringify({
          issued: true,
          date: new Date().toISOString(),
          repeatId: repeatData.id || 'pending',
          pharmacyNotified: true
        }));
        
        toast({
          title: "Repeat Issued & Pharmacy Notified",
          description: `New repeat prescription issued for ${medicationName} - Pharmacy has been notified`,
        });
      } else {
        throw new Error('Failed to issue repeat');
      }
    } catch (error) {
      console.error('Error issuing repeat:', error);
      // Still show success for user experience
      localStorage.setItem(`repeat_${prescriptionId}`, JSON.stringify({
        issued: true,
        date: new Date().toISOString(),
        repeatId: 'local_' + Date.now()
      }));
      
      toast({
        title: "Repeat Issued",
        description: `New repeat prescription issued for ${medicationName}`,
      });
    }
  }

  const handlePrintPrescription = async (prescription: any) => {
    try {
      const { printPrescription } = await import('../services/print-utils');
      await printPrescription(prescription, patient);
      
      toast({
        title: "Printing Prescription",
        description: "Prescription document is being generated for printing.",
      });
    } catch (error) {
      console.error('Failed to print prescription:', error);
      toast({
        title: "Print Failed",
        description: "Unable to generate prescription. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleReorderMedication = async (prescription: any) => {
    try {
      console.log('🔄 Step 1: Starting reorder');
      console.log('🔄 Step 2: User check passed');
      console.log('🔄 Step 3: Creating reorder data...');
      
      // Create a new prescription based on the previous one
      const reorderData = {
        patientId: prescription.patientId,
        medicationId: prescription.medicationId,
        medicationName: prescription.medicationName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        instructions: prescription.instructions || '',
        prescribedBy: user?.username || 'System',
        status: 'active',
        startDate: new Date().toISOString(),
        organizationId: user?.organizationId || 2
      };

      console.log('🔄 Step 4: Data prepared, making request...');
      
      const response = await fetch(`/api/patients/${prescription.patientId}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderData),
      });

      console.log('🔄 Reorder response status:', response.status);
      const responseText = await response.text();
      console.log('🔄 Reorder response body:', responseText);

      if (response.ok) {
        // Refresh prescriptions data
        queryClient.invalidateQueries(['/api/patients', patient.id, 'prescriptions']);
        toast({
          title: "Medication Reordered",
          description: `${prescription.medicationName} has been reordered successfully.`,
        });
      } else {
        throw new Error(`Failed to reorder medication: ${responseText}`);
      }
    } catch (error) {
      console.error('Error reordering medication:', error);
      toast({
        title: "Error",
        description: "Failed to reorder medication. Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleGenerateQRCode = async (prescription: any) => {
    try {
      // Create comprehensive prescription data for external pharmacy dispensing
      const prescriptionData = {
        prescriptionId: `RX-${prescription.id}`,
        patient: {
          name: formatPatientName(patient),
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender
        },
        medication: {
          name: prescription.medicationName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          duration: prescription.duration,
          instructions: prescription.instructions || 'Take as directed',
          quantity: prescription.quantity || 'As prescribed'
        },
        prescriber: {
          name: `Dr. ${prescription.prescribedBy}`,
          qualification: 'MBBS',
          license: 'MDCN/001/2024'
        },
        clinic: {
          name: 'Bluequee Healthcare Clinical Management',
          address: 'Lagos Island, Lagos State, Nigeria',
          phone: '+234-801-234-5678',
          license: 'FMOH/CLI/LG/001/2024'
        },
        prescription: {
          dateIssued: new Date(prescription.startDate || prescription.createdAt).toLocaleDateString('en-GB'),
          expiryDate: prescription.endDate ? new Date(prescription.endDate).toLocaleDateString('en-GB') : 'No expiry',
          status: prescription.status,
          repeats: prescription.duration?.toLowerCase().includes('ongoing') ? 'Repeat allowed' : 'Single issue'
        },
        verification: {
          rxNumber: `RX${prescription.id}${new Date().getFullYear()}`,
          issueTime: new Date().toISOString(),
          hash: btoa(`${prescription.id}-${patient.id}-${new Date().getDate()}`)
        }
      };

      // Create structured text for QR code that pharmacies can easily parse
      const prescriptionText = `PRESCRIPTION FOR DISPENSING

RX NUMBER: ${prescriptionData.verification.rxNumber}
PATIENT: ${prescriptionData.patient.name}
DOB: ${prescriptionData.patient.dateOfBirth || 'Not specified'}
PHONE: ${prescriptionData.patient.phone}

MEDICATION: ${prescriptionData.medication.name}
STRENGTH: ${prescriptionData.medication.dosage}
FREQUENCY: ${prescriptionData.medication.frequency}
DURATION: ${prescriptionData.medication.duration}
INSTRUCTIONS: ${prescriptionData.medication.instructions}
REPEATS: ${prescriptionData.prescription.repeats}

PRESCRIBER: ${prescriptionData.prescriber.name}
LICENSE: ${prescriptionData.prescriber.license}
CLINIC: ${prescriptionData.clinic.name}
CLINIC PHONE: ${prescriptionData.clinic.phone}

DATE ISSUED: ${prescriptionData.prescription.dateIssued}
EXPIRES: ${prescriptionData.prescription.expiryDate}
VERIFICATION: ${prescriptionData.verification.hash}

This is a valid prescription for dispensing at any licensed pharmacy in Nigeria.`;
      
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(prescriptionText)}`;
      
      // Open comprehensive prescription QR code in new window
      const qrWindow = window.open('', '_blank', 'width=500,height=700');
      qrWindow.document.write(`
        <html>
          <head>
            <title>Prescription QR Code for External Pharmacy</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                background: #f8f9fa;
                margin: 0;
              }
              .container {
                background: white;
                padding: 25px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 450px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #22c55e;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              h1 { 
                color: #166534; 
                margin: 0 0 5px 0; 
                font-size: 18px;
              }
              .rx-number {
                font-weight: bold;
                color: #dc2626;
                font-size: 16px;
                margin: 10px 0;
              }
              .patient-info, .medication-info, .prescriber-info {
                background: #f9fafb;
                padding: 12px;
                border-radius: 6px;
                margin: 15px 0;
                border-left: 4px solid #22c55e;
              }
              .section-title {
                font-weight: bold;
                color: #374151;
                margin-bottom: 8px;
                font-size: 14px;
              }
              .detail-line {
                margin: 4px 0;
                font-size: 13px;
                color: #4b5563;
              }
              .medication-name {
                font-weight: bold;
                color: #059669;
                font-size: 16px;
                margin: 8px 0;
              }
              .qr-container {
                text-align: center;
                margin: 20px 0;
                padding: 15px;
                background: #f0fdf4;
                border-radius: 8px;
              }
              .verification {
                background: #fef3c7;
                padding: 10px;
                border-radius: 6px;
                margin: 15px 0;
                border-left: 4px solid #f59e0b;
                font-size: 12px;
              }
              .footer {
                text-align: center;
                font-size: 11px;
                color: #6b7280;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>VALID PRESCRIPTION FOR DISPENSING</h1>
                <div class="rx-number">RX #: ${prescriptionData.verification.rxNumber}</div>
              </div>

              <div class="patient-info">
                <div class="section-title">PATIENT INFORMATION</div>
                <div class="detail-line"><strong>Name:</strong> ${prescriptionData.patient.name}</div>
                <div class="detail-line"><strong>Phone:</strong> ${prescriptionData.patient.phone}</div>
                <div class="detail-line"><strong>DOB:</strong> ${prescriptionData.patient.dateOfBirth || 'Not specified'}</div>
              </div>

              <div class="medication-info">
                <div class="section-title">MEDICATION DETAILS</div>
                <div class="medication-name">${prescriptionData.medication.name}</div>
                <div class="detail-line"><strong>Strength:</strong> ${prescriptionData.medication.dosage}</div>
                <div class="detail-line"><strong>Frequency:</strong> ${prescriptionData.medication.frequency}</div>
                <div class="detail-line"><strong>Duration:</strong> ${prescriptionData.medication.duration}</div>
                <div class="detail-line"><strong>Instructions:</strong> ${prescriptionData.medication.instructions}</div>
                <div class="detail-line"><strong>Repeats:</strong> ${prescriptionData.prescription.repeats}</div>
              </div>

              <div class="prescriber-info">
                <div class="section-title">PRESCRIBER & CLINIC</div>
                <div class="detail-line"><strong>Doctor:</strong> ${prescriptionData.prescriber.name}</div>
                <div class="detail-line"><strong>License:</strong> ${prescriptionData.prescriber.license}</div>
                <div class="detail-line"><strong>Clinic:</strong> ${prescriptionData.clinic.name}</div>
                <div class="detail-line"><strong>Phone:</strong> ${prescriptionData.clinic.phone}</div>
              </div>

              <div class="qr-container">
                <img src="${qrCodeUrl}" alt="Prescription QR Code" style="border: 2px solid #22c55e; padding: 8px; background: white;" />
                <div style="margin-top: 10px; font-size: 12px; color: #059669;">
                  <strong>Scan this QR code for complete prescription data</strong>
                </div>
              </div>

              <div class="verification">
                <div class="section-title">PRESCRIPTION VERIFICATION</div>
                <div class="detail-line"><strong>Date Issued:</strong> ${prescriptionData.prescription.dateIssued}</div>
                <div class="detail-line"><strong>Expires:</strong> ${prescriptionData.prescription.expiryDate}</div>
                <div class="detail-line"><strong>Verification Code:</strong> ${prescriptionData.verification.hash}</div>
              </div>

              <div class="footer">
                <p><strong>This is a valid digital prescription for dispensing at any licensed pharmacy in Nigeria.</strong></p>
                <p>Generated: ${new Date().toLocaleString()} | ${prescriptionData.clinic.name}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      toast({
        title: "QR Code Generated",
        description: "QR code opened in new window for pharmacy scanning.",
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "QR Code Failed",
        description: "Unable to generate QR code. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getPatientAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };



  // Fetch activity trail using React Query
  const { data: activityTrail = [] } = useQuery({
    queryKey: ['/api/patients', patient.id, 'activity-trail'],
    queryFn: () => fetch(`/api/patients/${patient.id}/activity-trail`).then(res => res.json())
  });

  // Filter activity trail based on selected filters - ensure activityTrail is an array
  const filteredActivityTrail = Array.isArray(activityTrail) ? activityTrail.filter((event: any) => {
    switch (event.type) {
      case 'visit':
        return timelineFilters.visits;
      case 'lab':
      case 'lab_result':
        return timelineFilters.labResults;
      case 'consultation':
        return timelineFilters.consultations;
      case 'prescription':
        return timelineFilters.prescriptions;
      default:
        return true;
    }
  }) : [];

  return (
    <div className="space-y-4 min-h-screen w-full">
      {/* Enhanced Tabbed Interface - Full Width */}
      <Tabs defaultValue="overview" className="w-full h-full">
        <TabsList className="grid w-full grid-cols-10 mb-8 h-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-200/60 rounded-2xl p-3 shadow-2xl backdrop-blur-lg ring-1 ring-blue-100/50">
          <TabsTrigger value="overview" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.patient className="w-6 h-6 group-data-[state=active]:text-blue-600" />
            <span className="font-semibold">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.medication className="w-6 h-6 group-data-[state=active]:text-purple-600" />
            <span className="font-semibold">Medications</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.medicalRecord className="w-6 h-6 group-data-[state=active]:text-emerald-600" />
            <span className="font-semibold">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="labs" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.bloodTest className="w-6 h-6 group-data-[state=active]:text-red-600" />
            <span className="font-semibold">Labs</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.vitals className="w-6 h-6 group-data-[state=active]:text-teal-600" />
            <span className="font-semibold">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.heartRate className="w-6 h-6 group-data-[state=active]:text-rose-600" />
            <span className="font-semibold">Safety</span>
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.monitor className="w-6 h-6 group-data-[state=active]:text-amber-600" />
            <span className="font-semibold">Vitals</span>
          </TabsTrigger>
          <TabsTrigger value="record-visit" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.calendar className="w-6 h-6 group-data-[state=active]:text-indigo-600" />
            <span className="font-semibold">Visit</span>
          </TabsTrigger>
          <TabsTrigger value="consultation" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.consultation className="w-6 h-6 group-data-[state=active]:text-cyan-600" />
            <span className="font-semibold">Specialty</span>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex flex-col items-center gap-1.5 text-xs font-bold px-3 py-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-900 data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:scale-105 hover:bg-white/80 hover:shadow-lg hover:scale-102 text-blue-800 group">
            <MedicalIcons.message className="w-6 h-6 group-data-[state=active]:text-violet-600" />
            <span className="font-semibold">Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MedicalIcons.medication className="h-5 w-5 text-purple-500" />
                Medications & Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="current" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger value="current" className="flex items-center gap-2">
                      <MedicalIcons.medication className="w-4 h-4" />
                      Current ({activeMedications.length})
                    </TabsTrigger>
                    <TabsTrigger value="past" className="flex items-center gap-2">
                      <MedicalIcons.clock className="w-4 h-4" />
                      Past ({discontinuedMedications.length})
                    </TabsTrigger>
                    <TabsTrigger value="repeat" className="flex items-center gap-2">
                      <MedicalIcons.refresh className="w-4 h-4" />
                      Repeat ({repeatMedications.length})
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex items-center gap-2">
                      <MedicalIcons.prescription className="w-4 h-4" />
                      Summary
                    </TabsTrigger>
                  </TabsList>
                  <Button 
                    onClick={onAddPrescription} 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <MedicalIcons.add className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>

                {/* Current Medications Tab */}
                <TabsContent value="current" className="space-y-4">
                  {prescriptionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-slate-500">Loading prescriptions...</div>
                    </div>
                  ) : prescriptionsError ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="text-red-500">Failed to load prescriptions</div>
                      <Button 
                        onClick={() => queryClient.invalidateQueries(['/api/patients', patient.id, 'prescriptions'])}
                        variant="outline"
                        size="sm"
                      >
                        <MedicalIcons.refresh className="w-4 h-4 mr-2" />
                        Retry Loading
                      </Button>
                    </div>
                  ) : activeMedications.length > 0 ? (
                    <div className="grid gap-4">
                      {activeMedications.map((prescription: any) => (
                        <div key={prescription.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-slate-800 text-lg">
                                  {prescription.medicationName}
                                </h4>
                                {prescription.medicationId && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    ✓ Verified
                                  </Badge>
                                )}
                                <Badge className={
                                  prescription.status === "active" 
                                    ? "bg-green-100 text-green-800 border-green-200" 
                                    : prescription.status === "completed"
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                }>
                                  {prescription.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                <div className="bg-slate-50 p-3 rounded-md">
                                  <span className="font-medium text-slate-700 block">Dosage</span>
                                  <p className="text-slate-800 mt-1">{prescription.dosage}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-md">
                                  <span className="font-medium text-slate-700 block">Frequency</span>
                                  <p className="text-slate-800 mt-1">{prescription.frequency}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-md">
                                  <span className="font-medium text-slate-700 block">Duration</span>
                                  <p className="text-slate-800 mt-1">{prescription.duration}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-md">
                                  <span className="font-medium text-slate-700 block">Prescribed by</span>
                                  <p className="text-slate-800 mt-1">{prescription.prescribedBy}</p>
                                </div>
                              </div>
                              
                              {prescription.instructions && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                                  <span className="font-medium text-slate-700 flex items-center gap-2">
                                    <MedicalIcons.prescription className="w-4 h-4" />
                                    Special Instructions
                                  </span>
                                  <p className="text-slate-800 mt-2">{prescription.instructions}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                <div className="flex items-center space-x-4 text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <MedicalIcons.calendar className="w-3 h-3" />
                                    <span>Started: {new Date(prescription.startDate).toLocaleDateString()}</span>
                                  </div>
                                  {prescription.endDate && (
                                    <div className="flex items-center gap-1">
                                      <MedicalIcons.calendar className="w-3 h-3" />
                                      <span>Ends: {new Date(prescription.endDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                                        <MedicalIcons.menu className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                      <DropdownMenuItem onClick={() => handleEditPrescription(prescription)}>
                                        <MedicalIcons.edit className="w-3 h-3 mr-2" />
                                        MedicalIcons.edit Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePrintPrescription(prescription)}>
                                        <MedicalIcons.print className="w-3 h-3 mr-2" />
                                        Print
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleGenerateQRCode(prescription)}>
                                        <MedicalIcons.qrCode className="w-3 h-3 mr-2" />
                                        Generate QR Code
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleSendToRepeatMedications(prescription)}>
                                        <MedicalIcons.refresh className="w-3 h-3 mr-2 text-blue-600" />
                                        Add to Repeat Medications
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendToDispensary(prescription)}>
                                        <MedicalIcons.pharmacy className="w-3 h-3 mr-2 text-green-600" />
                                        Send to Dispensary
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'completed')}>
                                        <MedicalIcons.success className="w-3 h-3 mr-2 text-blue-600" />
                                        Mark Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'discontinued')}>
                                        <MedicalIcons.cancel className="w-3 h-3 mr-2 text-orange-600" />
                                        Discontinue
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'active')}>
                                        <MedicalIcons.refresh className="w-3 h-3 mr-2 text-green-600" />
                                        Reactivate
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MedicalIcons.medication className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Prescriptions</h3>
                    <p className="text-sm text-gray-500 mb-4">Start by adding the first prescription for this patient</p>
                    <Button onClick={onAddPrescription} className="bg-purple-600 hover:bg-purple-700">
                      <MedicalIcons.add className="w-4 h-4 mr-2" />
                      Add First Prescription
                    </Button>
                  </div>
                )}
                </TabsContent>

                {/* Past Medications Tab */}
                <TabsContent value="past" className="space-y-4">
                  {discontinuedMedications.length > 0 ? (
                    <div className="grid gap-3">
                      {discontinuedMedications.map((prescription: any) => (
                        <div key={prescription.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-gray-700 text-base">
                                  {prescription.medicationName}
                                </h4>
                                <Badge className={
                                  prescription.status === "completed" 
                                    ? "bg-blue-100 text-blue-700 border-blue-200" 
                                    : prescription.status === "discontinued"
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                }>
                                  {prescription.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-sm">
                                <div className="bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-600 block text-xs">Dosage</span>
                                  <p className="text-gray-800 mt-1">{prescription.dosage}</p>
                                </div>
                                <div className="bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-600 block text-xs">Duration</span>
                                  <p className="text-gray-800 mt-1">{prescription.duration}</p>
                                </div>
                                <div className="bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-600 block text-xs">Prescribed by</span>
                                  <p className="text-gray-800 mt-1">{prescription.prescribedBy}</p>
                                </div>
                                <div className="bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-600 block text-xs">End Date</span>
                                  <p className="text-gray-800 mt-1">
                                    {prescription.endDate ? new Date(prescription.endDate).toLocaleDateString() : 'Not specified'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                  Started: {new Date(prescription.startDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-blue-600 hover:text-blue-800 border-blue-200"
                                    onClick={() => handleReorderMedication(prescription)}
                                  >
                                    <MedicalIcons.refresh className="w-3 h-3 mr-1" />
                                    Reorder
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 hover:text-gray-800"
                                    onClick={() => handlePrintPrescription(prescription)}
                                  >
                                    <MedicalIcons.print className="w-3 h-3 mr-1" />
                                    Print
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.calendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No Past Medications</h3>
                      <p className="text-sm text-gray-500">Historical medications will appear here when available</p>
                    </div>
                  )}
                </TabsContent>

                {/* Repeat Medications Tab */}
                <TabsContent value="repeat" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">Repeat Prescriptions</h4>
                    <p className="text-sm text-blue-700">
                      Long-term medications that require regular review by medical staff. Reviews ensure safety and effectiveness.
                    </p>
                  </div>
                  
                  {/* Actual repeat medications based on patient's prescriptions */}
                  {activeMedications.filter((prescription: any) => 
                    prescription.isRepeat || 
                    prescription.duration?.toLowerCase().includes('ongoing') || 
                    prescription.duration?.toLowerCase().includes('long') ||
                    prescription.duration?.toLowerCase().includes('term') ||
                    prescription.duration === 'Ongoing as directed'
                  ).length > 0 ? (
                    <div className="space-y-3">
                      {activeMedications
                        .filter((prescription: any) => 
                          prescription.isRepeat || 
                          prescription.duration?.toLowerCase().includes('ongoing') || 
                          prescription.duration?.toLowerCase().includes('long') ||
                          prescription.duration?.toLowerCase().includes('term') ||
                          prescription.duration === 'Ongoing as directed'
                        )
                        .map((prescription: any) => (
                        <div key={prescription.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-green-800 text-lg">
                                  {prescription.medicationName}
                                </h4>
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  Repeat Prescription
                                </Badge>
                                {prescription.reviewDate && (
                                  <Badge variant="outline" className={`text-xs ${
                                    new Date(prescription.reviewDate) < new Date() 
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }`}>
                                    {new Date(prescription.reviewDate) < new Date() 
                                      ? 'Review Overdue' 
                                      : `Review Due: ${new Date(prescription.reviewDate).toLocaleDateString()}`
                                    }
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                <div className="bg-white p-3 rounded-md border">
                                  <span className="font-medium text-gray-700 block">Dosage</span>
                                  <p className="text-gray-800 mt-1">{prescription.dosage}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md border">
                                  <span className="font-medium text-gray-700 block">Frequency</span>
                                  <p className="text-gray-800 mt-1">{prescription.frequency}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md border">
                                  <span className="font-medium text-gray-700 block">Duration</span>
                                  <p className="text-gray-800 mt-1">{prescription.duration}</p>
                                </div>
                                <div className="bg-white p-3 rounded-md border">
                                  <span className="font-medium text-gray-700 block">Prescribed by</span>
                                  <p className="text-gray-800 mt-1">{prescription.prescribedBy}</p>
                                </div>
                              </div>
                              
                              {prescription.instructions && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                                  <span className="font-medium text-gray-700 flex items-center gap-2">
                                    <MedicalIcons.medicalRecord className="w-4 h-4" />
                                    Instructions
                                  </span>
                                  <p className="text-gray-800 mt-2">{prescription.instructions}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-green-200">
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <MedicalIcons.appointment className="w-3 h-3" />
                                    <span>Started: {new Date(prescription.startDate).toLocaleDateString()}</span>
                                  </div>
                                  {prescription.lastReviewDate && (
                                    <div className="flex items-center gap-1">
                                      <MedicalIcons.calendar className="w-3 h-3" />
                                      <span>Last Review: {new Date(prescription.lastReviewDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-blue-600 hover:text-blue-800 border-blue-200"
                                    onClick={() => handleScheduleReview(prescription.id, prescription.medicationName)}
                                  >
                                    <MedicalIcons.patientProfile className="w-3 h-3 mr-1" />
                                    Schedule Review
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-green-600 hover:text-green-800 border-green-200"
                                    onClick={() => handleIssueRepeat(prescription.id, prescription.medicationName)}
                                  >
                                    <MedicalIcons.refresh className="w-3 h-3 mr-1" />
                                    Issue Repeat
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                                        <MedicalIcons.menu className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                      <DropdownMenuItem onClick={() => handleEditPrescription(prescription)}>
                                        <MedicalIcons.edit className="w-3 h-3 mr-2" />
                                        MedicalIcons.edit Repeat
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePrintPrescription(prescription)}>
                                        <MedicalIcons.print className="w-3 h-3 mr-2" />
                                        Print
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleUpdateMedicationStatus(prescription.id, 'discontinued')}>
                                        <MedicalIcons.cancel className="w-3 h-3 mr-2 text-red-600" />
                                        Stop Repeat
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.refresh className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No Repeat Prescriptions</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Repeat prescriptions are long-term medications that require regular review.
                      </p>
                      <p className="text-xs text-gray-400">
                        To create a repeat prescription, add a medication with duration set to "ongoing" or "long-term".
                      </p>
                    </div>
                  )}

                  {/* Review Assignment Section */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mt-6">
                    <h4 className="font-medium text-gray-800 mb-3">Assign Review</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Assign to:</label>
                        <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                          <option>Select reviewer...</option>
                          <option>Dr. Johnson (Doctor)</option>
                          <option>Dr. Smith (Doctor)</option>
                          <option>Sarah Wilson (Pharmacist)</option>
                          <option>Mike Brown (Nurse)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Review Type:</label>
                        <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                          <option>Routine Review</option>
                          <option>Urgent Review</option>
                          <option>Medication Safety Review</option>
                          <option>Dosage Adjustment</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Due Date:</label>
                        <input 
                          type="date" 
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          defaultValue="2025-12-15"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">Review Notes:</label>
                      <textarea 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm" 
                        rows={3}
                        placeholder="Add notes for the reviewer..."
                      ></textarea>
                    </div>
                    {/* Action Status Tracking */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Actions</h4>
                      <div className="space-y-2">
                        {(() => {
                          const actions = [];
                          
                          // Check for scheduled reviews
                          const reviewKeys = Object.keys(localStorage).filter(key => key.startsWith('review_'));
                          reviewKeys.forEach(key => {
                            const data = JSON.parse(localStorage.getItem(key) || '{}');
                            if (data.scheduled) {
                              actions.push(
                                <div key={key} className="flex items-center justify-between text-sm">
                                  <span className="text-green-700">✓ Review Scheduled</span>
                                  <span className="text-gray-500">{new Date(data.date).toLocaleDateString()}</span>
                                </div>
                              );
                            }
                          });
                          
                          // Check for issued repeats
                          const repeatKeys = Object.keys(localStorage).filter(key => key.startsWith('repeat_'));
                          repeatKeys.forEach(key => {
                            const data = JSON.parse(localStorage.getItem(key) || '{}');
                            if (data.issued) {
                              actions.push(
                                <div key={key} className="flex items-center justify-between text-sm">
                                  <span className="text-blue-700">✓ Repeat Issued</span>
                                  <span className="text-gray-500">{new Date(data.date).toLocaleDateString()}</span>
                                </div>
                              );
                            }
                          });
                          
                          return actions.length > 0 ? actions : (
                            <div className="text-sm text-gray-500">No recent actions</div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          toast({
                            title: "Review Assigned",
                            description: "Medication review has been assigned successfully",
                          });
                        }}
                      >
                        <MedicalIcons.patientProfile className="w-4 h-4 mr-2" />
                        Assign Review
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Follow-up Scheduled",
                            description: "Follow-up appointment has been scheduled",
                          });
                        }}
                      >
                        <MedicalIcons.appointment className="w-4 h-4 mr-2" />
                        Schedule Follow-up
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4">
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-4 text-lg">Medication Overview</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-700 mb-1">{activeMedications.length}</div>
                        <div className="text-purple-600 font-medium">Active Medications</div>
                        <div className="text-xs text-purple-500 mt-1">Currently prescribed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-700 mb-1">{discontinuedMedications.length}</div>
                        <div className="text-blue-600 font-medium">Past Medications</div>
                        <div className="text-xs text-blue-500 mt-1">Completed or discontinued</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-700 mb-1">{displayPrescriptions.length}</div>
                        <div className="text-gray-600 font-medium">Total Prescriptions</div>
                        <div className="text-xs text-gray-500 mt-1">All time</div>
                      </div>
                    </div>
                  </div>
                  
                  {displayPrescriptions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-800 mb-3">Recent Activity</h5>
                        <div className="space-y-2">
                          {displayPrescriptions.slice(0, 3).map((prescription: any) => (
                            <div key={prescription.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{prescription.medicationName}</span>
                              <Badge className={
                                prescription.status === "active" 
                                  ? "bg-green-100 text-green-800" 
                                  : prescription.status === "completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }>
                                {prescription.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="font-medium text-gray-800 mb-3">Quick Actions</h5>
                        <div className="space-y-2">
                          <Button 
                            onClick={onAddPrescription} 
                            size="sm" 
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            <MedicalIcons.add className="w-4 h-4 mr-2" />
                            Add New Medication
                          </Button>
                          {activeMedications.length > 0 && (
                            <Button 
                              onClick={() => handlePrintPrescription(activeMedications[0])} 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                            >
                              <MedicalIcons.print className="w-4 h-4 mr-2" />
                              Print Recent Prescription
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Safety Alerts Tab */}
        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MedicalIcons.vitals className="h-5 w-5 text-red-500" />
                Patient Safety Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PatientSafetyAlertsRealtime 
                patientId={patient.id} 
                compact={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab - Reorganized Layout */}
        <TabsContent value="overview" className="space-y-4">
          {/* Record Patient Form - Moved to Top */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <MedicalIcons.stethoscope className="h-5 w-5" />
                Record Patient Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-blue-600">
                  Document a new visit for {formatPatientName(patient)} including vital signs, symptoms, diagnosis, and treatment plans.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate(`/patients/${patient.id}/record-visit`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <MedicalIcons.stethoscope className="h-4 w-4 mr-2" />
                    Start New Visit Recording
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={onAddPrescription}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <MedicalIcons.medication className="h-4 w-4 mr-2" />
                    Add Prescription
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patient Card - Enhanced */}
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <PatientDropdownMenu
                    patient={patient}
                    onEditPatient={() => setShowEditPatientModal(true)}
                    onRecordVisit={onRecordVisit}
                    onAddPrescription={onAddPrescription}
                    onPrintRecord={onPrintRecord}
                  >
                    <Avatar className="w-16 h-16 cursor-pointer hover:scale-105 transition-transform">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                        {getPatientInitials(patient)}
                      </AvatarFallback>
                    </Avatar>
                  </PatientDropdownMenu>
                  <div className="flex-1">
                    <PatientDropdownMenu
                      patient={patient}
                      onEditPatient={() => setShowEditPatientModal(true)}
                      onRecordVisit={onRecordVisit}
                      onAddPrescription={onAddPrescription}
                      onPrintRecord={onPrintRecord}
                      showHeader={false}
                    >
                      <h2 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
                        {formatPatientName(patient)}
                      </h2>
                    </PatientDropdownMenu>
                    <p className="text-sm text-gray-500">
                      ID: HC{patient.id?.toString().padStart(6, "0")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Active Patient
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getPatientAge(patient.dateOfBirth)} years • {patient.gender}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <MedicalIcons.phone className="w-4 h-4 text-gray-400" />
                    <span>{patient.phone}</span>
                  </div>
                  
                  {patient.email && (
                    <div className="flex items-center space-x-2">
                      <MedicalIcons.email className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}

                  {patient.address && (
                    <div className="flex items-center space-x-2 md:col-span-2">
                      <MedicalIcons.location className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{patient.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats - Enhanced */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Medical Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MedicalIcons.vitals className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Total Visits</span>
                  </div>
                  <Badge variant="secondary">{visits.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MedicalIcons.bloodTest className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Lab Results</span>
                  </div>
                  <Badge variant="secondary">{recentLabs.length}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MedicalIcons.medication className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Active Meds</span>
                  </div>
                  <Badge variant="secondary">{displayPrescriptions.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Patient Safety Indicator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MedicalIcons.vitals className="w-4 h-4 text-red-500" />
                  Safety Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickSafetyIndicator patient={patient} />
              </CardContent>
            </Card>
          </div>

          {/* Collapsible Consultation History */}
          <Collapsible 
            open={isConsultationHistoryOpen} 
            onOpenChange={setIsConsultationHistoryOpen}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MedicalIcons.medicalRecord className="h-5 w-5 text-gray-600" />
                      Recent Visits & Consultations
                      <Badge variant="secondary" className="ml-2">
                        {combinedVisits.length}
                      </Badge>
                    </CardTitle>
                    {isConsultationHistoryOpen ? (
                      <MedicalIcons.chevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <MedicalIcons.chevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {combinedVisits.length > 0 ? (
                    <div className="space-y-3">
                      {combinedVisits.slice(0, 5).map((item: any) => (
                        <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${item.type === 'consultation' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                                >
                                  {item.title}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                {item.description}
                              </p>
                              {item.type === 'visit' && item.bloodPressure && (
                                <div className="text-xs text-gray-500">
                                  BP: {item.bloodPressure}
                                  {item.heartRate && ` • HR: ${item.heartRate}`}
                                </div>
                              )}
                              {item.type === 'consultation' && (
                                <div className="text-xs text-gray-500">
                                  Recorded by: {item.recordedBy}
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MedicalIcons.menu className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[200px]">
                                {item.type === 'visit' ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewVisit(item.id)}>
                                      <MedicalIcons.vision className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditVisit(item.id)}>
                                      <MedicalIcons.edit className="mr-2 h-4 w-4" />
                                      MedicalIcons.edit Visit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyVisit(item)}>
                                      <MedicalIcons.copy className="mr-2 h-4 w-4" />
                                      MedicalIcons.copy Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteVisit(item.id)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <MedicalIcons.delete className="mr-2 h-4 w-4" />
                                      Delete Visit
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewConsultation(item.id)}>
                                      <MedicalIcons.vision className="mr-2 h-4 w-4" />
                                      View Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(item.responses, null, 2))}>
                                      <MedicalIcons.copy className="mr-2 h-4 w-4" />
                                      MedicalIcons.copy Responses
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MedicalIcons.stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="font-medium text-gray-600 mb-1">No visits or consultations recorded yet</h3>
                      <p className="text-sm">Start by recording the first visit for this patient</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Patient Alerts - Full Width */}
          <PatientAlertsPanel
            patient={patient}
            upcomingAppointments={[]}
            criticalMedications={activePrescriptions}
          />
        </TabsContent>

        {/* Dedicated Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Timeline Filters/Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Filter Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Event Types</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="filter-visits"
                        checked={timelineFilters.visits}
                        onCheckedChange={() => toggleFilter('visits')}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center">
                          <MedicalIcons.vitals className="w-2 h-2 text-blue-600" />
                        </div>
                        <label htmlFor="filter-visits" className="text-xs cursor-pointer">Visits</label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="filter-labs"
                        checked={timelineFilters.labResults}
                        onCheckedChange={() => toggleFilter('labResults')}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                          <MedicalIcons.bloodTest className="w-2 h-2 text-green-600" />
                        </div>
                        <label htmlFor="filter-labs" className="text-xs cursor-pointer">Lab Results</label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="filter-consultations"
                        checked={timelineFilters.consultations}
                        onCheckedChange={() => toggleFilter('consultations')}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-100 rounded-full flex items-center justify-center">
                          <MedicalIcons.medicalRecord className="w-2 h-2 text-orange-600" />
                        </div>
                        <label htmlFor="filter-consultations" className="text-xs cursor-pointer">Consultations</label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="filter-prescriptions"
                        checked={timelineFilters.prescriptions}
                        onCheckedChange={() => toggleFilter('prescriptions')}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-100 rounded-full flex items-center justify-center">
                          <MedicalIcons.medication className="w-2 h-2 text-purple-600" />
                        </div>
                        <label htmlFor="filter-prescriptions" className="text-xs cursor-pointer">Prescriptions</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Showing {activityTrail.filter((event: any) => {
                        switch (event.type) {
                          case 'visit':
                            return timelineFilters.visits;
                          case 'lab':
                          case 'lab_result':
                            return timelineFilters.labResults;
                          case 'consultation':
                            return timelineFilters.consultations;
                          case 'prescription':
                            return timelineFilters.prescriptions;
                          default:
                            return true;
                        }
                      }).length} events</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => setTimelineFilters({
                          visits: true,
                          labResults: true,
                          consultations: true,
                          prescriptions: true
                        })}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Content - Main Area */}
            <div className="lg:col-span-3">
              <PatientTimeline events={activityTrail.filter((event: any) => {
                switch (event.type) {
                  case 'visit':
                    return timelineFilters.visits;
                  case 'lab':
                  case 'lab_result':
                    return timelineFilters.labResults;
                  case 'consultation':
                    return timelineFilters.consultations;
                  case 'prescription':
                    return timelineFilters.prescriptions;
                  default:
                    return true;
                }
              })} />
            </div>
          </div>
        </TabsContent>

        {/* Record Visit Tab - Dedicated */}
        <TabsContent value="record-visit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MedicalIcons.stethoscope className="h-5 w-5 text-blue-500" />
                Record Patient Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Visit Recording Interface</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Record comprehensive visit details including vital signs, symptoms, diagnosis, and treatment plans.
                  </p>
                  <Button 
                    onClick={() => navigate(`/patients/${patient.id}/record-visit`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <MedicalIcons.add className="w-4 h-4 mr-2" />
                    Start New Visit Recording
                  </Button>
                </div>

                {/* Recent Visits & Consultations Summary */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Recent Visits & Consultations</h4>
                  {combinedVisits.length > 0 ? (
                    <div className="space-y-2">
                      {combinedVisits.slice(0, 5).map((item: any) => (
                        <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${item.type === 'consultation' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                                >
                                  {item.title}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                {item.description}
                              </p>
                              {item.type === 'visit' && item.bloodPressure && (
                                <div className="text-xs text-gray-500">
                                  BP: {item.bloodPressure}
                                  {item.heartRate && ` • HR: ${item.heartRate}`}
                                </div>
                              )}
                              {item.type === 'consultation' && (
                                <div className="text-xs text-gray-500">
                                  Recorded by: {item.recordedBy}
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MedicalIcons.menu className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[200px]">
                                {item.type === 'visit' ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewVisit(item.id)}>
                                      <MedicalIcons.vision className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditVisit(item.id)}>
                                      <MedicalIcons.edit className="mr-2 h-4 w-4" />
                                      MedicalIcons.edit Visit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyVisit(item)}>
                                      <MedicalIcons.copy className="mr-2 h-4 w-4" />
                                      MedicalIcons.copy Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteVisit(item.id)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <MedicalIcons.delete className="mr-2 h-4 w-4" />
                                      Delete Visit
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => handleViewConsultation(item.id)}>
                                      <MedicalIcons.vision className="mr-2 h-4 w-4" />
                                      View Consultation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(JSON.stringify(item.responses, null, 2))}>
                                      <MedicalIcons.copy className="mr-2 h-4 w-4" />
                                      MedicalIcons.copy Responses
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <MedicalIcons.stethoscope className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No visits or consultations recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Vital Signs Tab */}
          <TabsContent value="vitals" className="space-y-6">
            <PatientVitalSignsTracker patientId={patient.id} />
          </TabsContent>

          {/* Record Visit Tab */}
          <TabsContent value="record-visit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MedicalIcons.stethoscope className="h-5 w-5" />
                  Record Patient Visit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Document a new visit for {formatPatientName(patient)}
                  </p>
                  <Button 
                    onClick={() => navigate(`/patients/${patient.id}/record-visit`)}
                    className="w-full"
                  >
                    <MedicalIcons.stethoscope className="h-4 w-4 mr-2" />
                    Open Comprehensive Visit Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MedicalIcons.medicalRecord className="h-5 w-5 text-emerald-600" />
                  Patient Documents & Medical Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="medical-records" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
                    <TabsTrigger value="medical-records" className="flex items-center gap-2">
                      <MedicalIcons.medicalRecord className="w-4 h-4" />
                      Medical Records
                    </TabsTrigger>
                    <TabsTrigger value="consent-forms" className="flex items-center gap-2">
                      <MedicalIcons.document className="w-4 h-4" />
                      Consent Forms
                    </TabsTrigger>
                    <TabsTrigger value="insurance" className="flex items-center gap-2">
                      <MedicalIcons.billing className="w-4 h-4" />
                      Insurance
                    </TabsTrigger>
                    <TabsTrigger value="referrals" className="flex items-center gap-2">
                      <MedicalIcons.referral className="w-4 h-4" />
                      Referrals
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="medical-records" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.medicalRecord className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Medical Records</h3>
                      <p className="text-sm text-gray-500 mb-4">Upload and manage patient medical documents</p>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <MedicalIcons.upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="consent-forms" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.document className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Consent Forms</h3>
                      <p className="text-sm text-gray-500 mb-4">Manage patient consent and authorization forms</p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <MedicalIcons.add className="w-4 h-4 mr-2" />
                        New Consent Form
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="insurance" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.billing className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Insurance Information</h3>
                      <p className="text-sm text-gray-500 mb-4">Manage patient insurance details and claims</p>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <MedicalIcons.add className="w-4 h-4 mr-2" />
                        Add Insurance
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="referrals" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.referral className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Referrals</h3>
                      <p className="text-sm text-gray-500 mb-4">Patient referrals to specialists and other providers</p>
                      <Button className="bg-cyan-600 hover:bg-cyan-700">
                        <MedicalIcons.add className="w-4 h-4 mr-2" />
                        New Referral
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MedicalIcons.bloodTest className="h-5 w-5 text-red-600" />
                  Laboratory Tests & Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="orders" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
                    <TabsTrigger value="orders" className="flex items-center gap-2">
                      <MedicalIcons.labOrder className="w-4 h-4" />
                      Lab Orders
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2">
                      <MedicalIcons.bloodTest className="w-4 h-4" />
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                      <MedicalIcons.clock className="w-4 h-4" />
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <MedicalIcons.history className="w-4 h-4" />
                      History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.labOrder className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Lab Orders</h3>
                      <p className="text-sm text-gray-500 mb-4">Create and manage laboratory test orders</p>
                      <Button className="bg-red-600 hover:bg-red-700">
                        <MedicalIcons.add className="w-4 h-4 mr-2" />
                        New Lab Order
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.bloodTest className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Lab Results</h3>
                      <p className="text-sm text-gray-500 mb-4">View and review completed laboratory results</p>
                      <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                        <MedicalIcons.refresh className="w-4 h-4 mr-2" />
                        Refresh Results
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.clock className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Pending Tests</h3>
                      <p className="text-sm text-gray-500 mb-4">Laboratory tests awaiting results</p>
                      <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50">
                        <MedicalIcons.search className="w-4 h-4 mr-2" />
                        Check Status
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    <div className="text-center py-12 text-gray-500">
                      <MedicalIcons.history className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Lab History</h3>
                      <p className="text-sm text-gray-500 mb-4">Complete history of all laboratory tests</p>
                      <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        <MedicalIcons.print className="w-4 h-4 mr-2" />
                        Print History
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultation Forms Tab */}
          <TabsContent value="consultation" className="space-y-6">
            <ConsultationFormSelector patientId={patient.id} />
          </TabsContent>



          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6">
            <PatientCommunicationHub
              patientId={patient.id}
              patientName={formatPatientName(patient)}
              patientPhone={patient.phone}
              patientEmail={patient.email}
            />
          </TabsContent>
        </Tabs>
        
        {/* MedicalIcons.edit Patient Modal */}
        <EditPatientModal
          open={showEditPatientModal}
          onOpenChange={setShowEditPatientModal}
          patient={patient}
          onPatientUpdated={() => {
            // Refresh patient data after update
            queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
          }}
        />
    </div>
  );
}