import React from 'react';
import { useLocation } from 'wouter';
import MentalHealthSupport from '@/components/mental-health-support';

export default function MentalHealthPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const patientId = params.get('patientId') ? parseInt(params.get('patientId')!) : undefined;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Mental Health Services</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive mental health support, assessments, and therapy resources
        </p>
      </div>
      <MentalHealthSupport patientId={patientId} />
    </div>
  );
}