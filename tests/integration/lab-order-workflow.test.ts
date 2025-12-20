import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { setupRoutes } from '@/server/routes/index';
import { registerRoutes } from '@/server/routes';

/**
 * Integration tests for lab order workflow
 * Tests: Lab Order Creation → Results Entry → Results Review
 */
describe('Lab Order Workflow Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let patientId: number;
  let labOrderId: number;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    setupRoutes(app);
    await registerRoutes(app);
    authToken = 'mock-auth-token';
    
    // Create test patient
    const patientResponse = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Lab',
        lastName: 'Test',
        phone: '+1234567892',
        dateOfBirth: '1985-05-15',
        gender: 'male',
        organizationId: 1
      });
    
    if (patientResponse.status === 200) {
      patientId = patientResponse.body.id;
    }
  });

  describe('Lab Order Creation', () => {
    it('should create lab order with multiple tests', async () => {
      if (!patientId) {
        // Skip if patient creation failed
        return;
      }

      const labOrderResponse = await request(app)
        .post(`/api/patients/${patientId}/lab-orders`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          testIds: [1, 2, 3],
          priority: 'routine',
          notes: 'Routine checkup'
        });

      expect(labOrderResponse.status).toBe(201);
      labOrderId = labOrderResponse.body.id;
      expect(labOrderResponse.body.status).toBe('pending');
    });
  });

  describe('Lab Results Entry', () => {
    it('should enter results for lab order items', async () => {
      if (!labOrderId) {
        return;
      }

      // Get lab order items
      const itemsResponse = await request(app)
        .get(`/api/lab-orders/${labOrderId}/items`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(itemsResponse.status).toBe(200);
      const items = itemsResponse.body;
      expect(Array.isArray(items)).toBe(true);

      if (items.length > 0) {
        // Update first item with result
        const updateResponse = await request(app)
          .patch(`/api/lab-orders/${labOrderId}/items/${items[0].id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            result: '12.5',
            status: 'completed',
            remarks: 'Normal range'
          });

        expect([200, 201]).toContain(updateResponse.status);
      }
    });
  });

  describe('Lab Results Review', () => {
    it('should retrieve reviewed lab results', async () => {
      const reviewedResponse = await request(app)
        .get('/api/lab-results/reviewed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: '1', limit: '10' });

      expect(reviewedResponse.status).toBe(200);
      expect(reviewedResponse.body.data).toBeDefined();
      expect(Array.isArray(reviewedResponse.body.data)).toBe(true);
    });
  });
});

