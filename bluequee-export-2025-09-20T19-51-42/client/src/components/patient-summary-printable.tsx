import { generateClinicHeader, formatDocumentDate, type Organization } from './print-export-utils';

interface Patient {
  id: number;
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

interface PatientSummaryPrintableProps {
  patient: Patient;
  visits: Visit[];
  organization?: Organization;
}

export function PatientSummaryPrintable({ patient, visits, organization }: PatientSummaryPrintableProps) {
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div id="patient-summary-print" className="max-w-4xl mx-auto p-6 bg-white text-black">
      {generateClinicHeader(organization)}
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4" style={{ color: organization?.themeColor || '#3B82F6' }}>
          Patient Summary Report
        </h2>
        <p className="text-sm text-gray-600">
          Generated on: {formatDocumentDate(new Date())}
        </p>
      </div>

      {/* Patient Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {patient.firstName} {patient.lastName}</p>
            <p><strong>Date of Birth:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            <p><strong>Age:</strong> {calculateAge(patient.dateOfBirth)} years</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
          </div>
          <div>
            <p><strong>Phone:</strong> {patient.phone}</p>
            {patient.email && <p><strong>Email:</strong> {patient.email}</p>}
            {patient.address && <p><strong>Address:</strong> {patient.address}</p>}
          </div>
        </div>
      </div>

      {/* Medical History & Allergies */}
      {(patient.allergies || patient.medicalHistory) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">Medical Background</h3>
          {patient.allergies && (
            <div className="mb-3">
              <strong>Allergies:</strong>
              <p className="text-sm mt-1">{patient.allergies}</p>
            </div>
          )}
          {patient.medicalHistory && (
            <div>
              <strong>Medical History:</strong>
              <p className="text-sm mt-1">{patient.medicalHistory}</p>
            </div>
          )}
        </div>
      )}

      {/* Visit History */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">
          Recent Visits ({visits.length})
        </h3>
        {visits.length === 0 ? (
          <p className="text-gray-600 italic">No visits recorded</p>
        ) : (
          <div className="space-y-4">
            {visits.slice(0, 5).map((visit) => (
              <div key={visit.id} className="border border-gray-200 rounded p-3">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p><strong>Date:</strong> {new Date(visit.visitDate).toLocaleDateString()}</p>
                    <p><strong>Type:</strong> {visit.visitType}</p>
                  </div>
                  <div className="text-sm">
                    {visit.bloodPressure && <p><strong>BP:</strong> {visit.bloodPressure}</p>}
                    {visit.heartRate && <p><strong>HR:</strong> {visit.heartRate} bpm</p>}
                    {visit.temperature && <p><strong>Temp:</strong> {visit.temperature}°C</p>}
                    {visit.weight && <p><strong>Weight:</strong> {visit.weight} kg</p>}
                  </div>
                </div>
                {visit.complaint && (
                  <div className="mb-2">
                    <strong>Complaint:</strong> <span className="text-sm">{visit.complaint}</span>
                  </div>
                )}
                {visit.diagnosis && (
                  <div className="mb-2">
                    <strong>Diagnosis:</strong> <span className="text-sm">{visit.diagnosis}</span>
                  </div>
                )}
                {visit.treatment && (
                  <div>
                    <strong>Treatment:</strong> <span className="text-sm">{visit.treatment}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 mt-8 text-center text-sm text-gray-600">
        <p>This document was generated from {organization?.name || 'Clinic Management System'}</p>
        <p>Confidential Medical Record - For Authorized Personnel Only</p>
      </div>
    </div>
  );
}