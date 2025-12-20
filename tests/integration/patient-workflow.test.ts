import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { setupRoutes } from '@/server/routes/index';
import { registerRoutes } from '@/server/routes';

/**
 * Integration tests for critical patient workflow
 * Tests: Patient Registration → Visit Creation → Lab Order → Prescription
 */
describe('Patient Workflow Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let patientId: number;

  beforeEach(async () => {
    // Setup test app
    app = express();
    app.use(express.json());
    
    // Setup routes
    setupRoutes(app);
    await registerRoutes(app);
    
    // Use mock token for testing
    authToken = 'mock-auth-token';
  });

  describe('Complete Patient Visit Workflow', () => {
    it('should create patient, record visit, create lab order, and prescribe medication', async () => {
      // Step 1: Create Patient
      const patientResponse = await request(app)
        .post('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Patient',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          organizationId: 1
        });

      expect(patientResponse.status).toBe(200);
      patientId = patientResponse.body.id;
      expect(patientId).toBeDefined();

      // Step 2: Record Visit
      const visitResponse = await request(app)
        .post(`/api/patients/${patientId}/visits`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          visitType: 'consultation',
          chiefComplaint: 'Fever and cough',
          notes: 'Patient presents with symptoms'
        });

      expect(visitResponse.status).toBe(201);
      const visitId = visitResponse.body.id;
      expect(visitId).toBeDefined();

      // Step 3: Create Lab Order
      const labOrderResponse = await request(app)
        .post(`/api/patients/${patientId}/lab-orders`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          testIds: [1, 2], // Assuming test IDs exist
          notes: 'Routine blood work'
        });

      expect(labOrderResponse.status).toBe(201);
      const labOrderId = labOrderResponse.body.id;
      expect(labOrderId).toBeDefined();

      // Step 4: Create Prescription
      const prescriptionResponse = await request(app)
        .post(`/api/patients/${patientId}/prescriptions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicationName: 'Paracetamol',
          dosage: '500mg',
          frequency: 'twice daily',
          duration: '5 days',
          instructions: 'Take with food'
        });

      expect(prescriptionResponse.status).toBe(201);
      const prescriptionId = prescriptionResponse.body.id;
      expect(prescriptionId).toBeDefined();

      // Verify all records are linked to patient
      expect(patientId).toBe(visitResponse.body.patientId);
      expect(patientId).toBe(labOrderResponse.body.patientId);
      expect(patientId).toBe(prescriptionResponse.body.patientId);
    });
  });

  describe('Patient Search and Access', () => {
    it('should search patients by name and phone', async () => {
      const searchResponse = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Test' });

      expect(searchResponse.status).toBe(200);
      expect(Array.isArray(searchResponse.body)).toBe(true);
    });

    it('should retrieve patient profile with all data', async () => {
      if (!patientId) {
        // Create test patient first
        const patientResponse = await request(app)
          .post('/api/patients')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Profile',
            lastName: 'Test',
            phone: '+1234567891',
            dateOfBirth: '1990-01-01',
            gender: 'female',
            organizationId: 1
          });
        patientId = patientResponse.body.id;
      }

      const profileResponse = await request(app)
        .get(`/api/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.id).toBe(patientId);
      expect(profileResponse.body.firstName).toBeDefined();
    });
  });
});

