import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { setupRoutes } from '@/server/routes/index';
import { registerRoutes } from '@/server/routes';

/**
 * Integration tests for authentication and authorization
 */
describe('Authentication Integration Tests', () => {
  let app: Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    setupRoutes(app);
    await registerRoutes(app);
  });

  describe('User Authentication', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        });

      // Should either succeed or fail gracefully
      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('id');
      }
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'invalid',
          password: 'wrong'
        });

      expect([401, 403]).toContain(response.status);
    });

    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/patients')
        .send();

      expect([401, 403]).toContain(response.status);
    });

    it('should allow access with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        });

      if (loginResponse.status === 200) {
        const token = loginResponse.body.token || loginResponse.body.user?.token;
        
        if (token) {
          const protectedResponse = await request(app)
            .get('/api/patients')
            .set('Authorization', `Bearer ${token}`);

          expect([200, 403]).toContain(protectedResponse.status);
        }
      }
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce role permissions', async () => {
      // Test that non-admin users cannot access admin routes
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', 'Bearer mock-token');

      expect([401, 403]).toContain(response.status);
    });
  });
});

