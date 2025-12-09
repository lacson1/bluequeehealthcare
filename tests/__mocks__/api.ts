// Mock API responses for testing

export const mockPatients = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    phone: '123-456-7890',
    email: 'john@example.com',
    organizationId: 1,
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1985-05-15',
    gender: 'female',
    phone: '987-654-3210',
    email: 'jane@example.com',
    organizationId: 1,
  },
];

export const mockUser = {
  id: 1,
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'doctor',
  organizationId: 1,
  email: 'test@example.com',
};

export const mockVisit = {
  id: 1,
  patientId: 1,
  doctorId: 1,
  visitDate: new Date().toISOString(),
  complaint: 'Headache',
  diagnosis: 'Migraine',
  treatment: 'Rest and medication',
  visitType: 'consultation',
  status: 'draft',
  organizationId: 1,
};

export const mockLabOrder = {
  id: 1,
  patientId: 1,
  status: 'pending',
  priority: 'routine',
  clinicalNotes: 'Routine checkup',
  organizationId: 1,
  createdAt: new Date().toISOString(),
};

export const mockPrescription = {
  id: 1,
  patientId: 1,
  visitId: 1,
  medicationName: 'Paracetamol',
  dosage: '500mg',
  frequency: 'Twice daily',
  duration: '7 days',
  instructions: 'Take with food',
  organizationId: 1,
};

