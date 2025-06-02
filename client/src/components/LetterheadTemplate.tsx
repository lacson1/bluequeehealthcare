import React from 'react';
import { format } from 'date-fns';

interface Organization {
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  logoUrl?: string;
  themeColor?: string;
}

interface Doctor {
  firstName?: string;
  lastName?: string;
  username: string;
  role: string;
  credentials?: string;
}

interface Patient {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  title?: string;
}

interface LetterheadTemplateProps {
  organization: Organization;
  doctor: Doctor;
  patient?: Patient;
  documentType: 'prescription' | 'lab_order' | 'referral_letter' | 'medical_letter';
  documentTitle: string;
  documentDate?: Date;
  children: React.ReactNode;
  additionalInfo?: string;
}

export default function LetterheadTemplate({
  organization,
  doctor,
  patient,
  documentType,
  documentTitle,
  documentDate = new Date(),
  children,
  additionalInfo
}: LetterheadTemplateProps) {
  const themeColor = organization.themeColor || '#3B82F6';
  const orgInitials = organization.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatOrgType = (type: string) => {
    const typeMap: Record<string, string> = {
      'clinic': 'Medical Clinic',
      'hospital': 'General Hospital',
      'health_center': 'Health Center',
      'pharmacy': 'Pharmacy Services',
      'laboratory': 'Laboratory Services'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getDocumentIcon = () => {
    switch (documentType) {
      case 'prescription': return 'Rx';
      case 'lab_order': return '🧪';
      case 'referral_letter': return '📋';
      case 'medical_letter': return '📄';
      default: return '📋';
    }
  };

  return (
    <div className="letterhead-container bg-white min-h-screen">
      <style>{`
        @media print {
          .letterhead-container {
            margin: 0;
            padding: 0;
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
        
        .letterhead-header {
          border-bottom: 3px solid ${themeColor};
          margin-bottom: 30px;
          padding-bottom: 20px;
        }
        
        .org-logo {
          width: 60px;
          height: 60px;
          background: ${themeColor};
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
          margin-right: 20px;
          float: left;
        }
        
        .document-icon {
          background: ${themeColor}20;
          color: ${themeColor};
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: bold;
          margin-left: auto;
          display: inline-block;
        }
        
        .doctor-credentials {
          background: #f8fafc;
          border-left: 4px solid ${themeColor};
          padding: 15px;
          margin: 20px 0;
          border-radius: 0 6px 6px 0;
        }
        
        .patient-info {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        
        .footer-signature {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .confidentiality-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 15px;
          border-radius: 6px;
          margin-top: 30px;
          font-size: 12px;
          color: #7f1d1d;
        }
      `}</style>

      {/* Letterhead Header */}
      <div className="letterhead-header">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="org-logo">
              {organization.logoUrl ? (
                <img 
                  src={organization.logoUrl} 
                  alt={organization.name} 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                orgInitials
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {organization.name}
              </h1>
              <p className="text-sm text-gray-600 mb-2">
                {formatOrgType(organization.type)}
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <p>{organization.address}</p>
                <p>
                  Tel: {organization.phone} | Email: {organization.email}
                  {organization.website && (
                    <> | Web: {organization.website}</>
                  )}
                </p>
                {(organization.registrationNumber || organization.licenseNumber) && (
                  <p className="text-xs">
                    {organization.registrationNumber && (
                      <>Reg. No: {organization.registrationNumber}</>
                    )}
                    {organization.registrationNumber && organization.licenseNumber && ' | '}
                    {organization.licenseNumber && (
                      <>License: {organization.licenseNumber}</>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="document-icon">
              {getDocumentIcon()} {documentType.replace('_', ' ').toUpperCase()}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Date: {format(documentDate, 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="doctor-credentials">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Attending Physician: Dr. {doctor.firstName || doctor.username} {doctor.lastName || ''}
            </h3>
            <p className="text-sm text-gray-600">
              {doctor.role.charAt(0).toUpperCase() + doctor.role.slice(1)}
              {doctor.credentials && ` - ${doctor.credentials}`}
            </p>
          </div>
          {additionalInfo && (
            <div className="text-sm text-gray-600">
              {additionalInfo}
            </div>
          )}
        </div>
      </div>

      {/* Patient Information */}
      {patient && (
        <div className="patient-info">
          <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {patient.title} {patient.firstName} {patient.lastName}
            </div>
            <div>
              <span className="font-medium">Date of Birth:</span> {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
            </div>
            {patient.gender && (
              <div>
                <span className="font-medium">Gender:</span> {patient.gender}
              </div>
            )}
            {patient.phone && (
              <div>
                <span className="font-medium">Phone:</span> {patient.phone}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 text-center py-4 border-b border-gray-200">
          {documentTitle}
        </h2>
      </div>

      {/* Document Content */}
      <div className="document-content">
        {children}
      </div>

      {/* Footer and Signature */}
      <div className="footer-signature">
        <div className="grid grid-cols-2 gap-40">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-12">
              <p className="text-sm font-medium">Patient Signature</p>
              <p className="text-xs text-gray-600">Date: _____________</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-12">
              <p className="text-sm font-medium">
                Dr. {doctor.firstName || doctor.username} {doctor.lastName || ''}
              </p>
              <p className="text-xs text-gray-600">
                {doctor.role.charAt(0).toUpperCase() + doctor.role.slice(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confidentiality Notice */}
      <div className="confidentiality-notice">
        <p className="text-center font-medium mb-2">CONFIDENTIAL MEDICAL DOCUMENT</p>
        <p className="text-xs leading-relaxed">
          This document contains confidential medical information. It is intended solely for the use of the patient 
          and authorized healthcare providers. Any unauthorized disclosure, copying, or distribution is strictly 
          prohibited and may be unlawful. If you have received this document in error, please notify us immediately 
          and destroy all copies.
        </p>
      </div>
    </div>
  );
}