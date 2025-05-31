import { PrintableDocument, PrintService } from './print-service';

export async function fetchPrintData() {
  // Fetch current user info
  const userResponse = await fetch('/api/profile');
  const currentUser = await userResponse.json();
  
  // Try to get organization data from the system
  let organization = {
    name: 'Grace',
    type: 'clinic',
    address: '123 Healthcare Avenue, Lagos, Nigeria',
    phone: '+234 802 123 4567',
    email: 'grace@clinic.com',
    website: 'www.grace-clinic.com'
  };
  
  // If user has organizationId, try to fetch specific organization
  if (currentUser.organizationId) {
    try {
      const orgResponse = await fetch(`/api/organizations/${currentUser.organizationId}`);
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        organization = {
          name: orgData.name,
          type: orgData.type,
          address: orgData.address || '123 Healthcare Avenue, Lagos, Nigeria',
          phone: orgData.phone || '+234 802 123 4567',
          email: orgData.email,
          website: orgData.website || `www.${orgData.name.toLowerCase().replace(/\s+/g, '-')}.com`
        };
      }
    } catch (error) {
      console.warn('Could not fetch specific organization, using default');
    }
  }
  
  return {
    currentUser,
    organization
  };
}

export function formatPatientInfo(patient: any) {
  return {
    id: patient.id,
    fullName: `${patient.title || ''} ${patient.firstName} ${patient.lastName}`.trim(),
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    phone: patient.phone,
    address: patient.address
  };
}

export function formatStaffInfo(user: any) {
  return {
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
    title: user.title,
    role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    username: user.username,
    phone: user.phone
  };
}

export function formatOrganizationInfo(org: any) {
  return {
    name: org.name,
    type: org.type,
    address: org.address,
    phone: org.phone,
    email: org.email,
    website: org.website,
    logoUrl: org.logoUrl
  };
}

export async function printPrescription(prescription: any, patient: any) {
  try {
    const { currentUser, organization } = await fetchPrintData();
    
    const document: PrintableDocument = {
      type: 'prescription',
      data: prescription,
      organizationInfo: formatOrganizationInfo(organization),
      patientInfo: formatPatientInfo(patient),
      staffInfo: formatStaffInfo(currentUser),
      createdAt: prescription.createdAt || new Date().toISOString(),
      recordId: prescription.id
    };
    
    await PrintService.printDocument(document);
  } catch (error) {
    console.error('Error printing prescription:', error);
    throw new Error('Failed to print prescription. Please try again.');
  }
}

export async function printLabOrder(labOrder: any, patient: any) {
  try {
    const { currentUser, organization } = await fetchPrintData();
    
    const document: PrintableDocument = {
      type: 'lab-order',
      data: labOrder,
      organizationInfo: formatOrganizationInfo(organization),
      patientInfo: formatPatientInfo(patient),
      staffInfo: formatStaffInfo(currentUser),
      createdAt: labOrder.createdAt || new Date().toISOString(),
      recordId: labOrder.id
    };
    
    await PrintService.printDocument(document);
  } catch (error) {
    console.error('Error printing lab order:', error);
    throw new Error('Failed to print lab order. Please try again.');
  }
}

export async function printConsultation(consultation: any, patient: any) {
  try {
    const { currentUser, organization } = await fetchPrintData();
    
    const document: PrintableDocument = {
      type: 'consultation',
      data: consultation,
      organizationInfo: formatOrganizationInfo(organization),
      patientInfo: formatPatientInfo(patient),
      staffInfo: formatStaffInfo(currentUser),
      createdAt: consultation.createdAt || new Date().toISOString(),
      recordId: consultation.id
    };
    
    await PrintService.printDocument(document);
  } catch (error) {
    console.error('Error printing consultation:', error);
    throw new Error('Failed to print consultation. Please try again.');
  }
}