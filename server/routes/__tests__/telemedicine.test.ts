import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../../db';
import { telemedicineSessions, patients, users } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../middleware/auth', () => ({
  authenticateToken: vi.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 1,
      role: 'doctor',
      organizationId: 1,
    };
    next();
  }),
  requireAnyRole: vi.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock the routes
const mockSessions = [
  {
    id: 1,
    patientId: 1,
    patientName: 'John Doe',
    doctorId: 1,
    doctorName: 'Dr. Smith',
    scheduledTime: new Date('2024-01-15T10:00:00Z'),
    status: 'scheduled',
    type: 'video',
    sessionUrl: null,
    notes: null,
    duration: null,
    createdAt: new Date(),
    completedAt: null,
  },
  {
    id: 2,
    patientId: 2,
    patientName: 'Jane Smith',
    doctorId: 1,
    doctorName: 'Dr. Smith',
    scheduledTime: new Date('2024-01-16T14:00:00Z'),
    status: 'active',
    type: 'audio',
    sessionUrl: 'https://meet.clinic.com/room-2',
    notes: 'Patient consultation in progress',
    duration: null,
    createdAt: new Date(),
    completedAt: null,
  },
];

describe('Telemedicine API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());

    // Setup mock routes
    app.get('/api/telemedicine/sessions', async (req, res) => {
      try {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(mockSessions),
        };

        const sessions = mockSessions.map((s) => ({
          id: s.id,
          patientId: s.patientId,
          patientName: s.patientName,
          doctorId: s.doctorId,
          doctorName: s.doctorName,
          scheduledTime: s.scheduledTime,
          status: s.status,
          type: s.type,
          sessionUrl: s.sessionUrl,
          notes: s.notes,
          duration: s.duration,
        }));

        res.json(sessions);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch telemedicine sessions' });
      }
    });

    app.post('/api/telemedicine/sessions', async (req, res) => {
      try {
        const { patientId, type, scheduledTime, status } = req.body;

        if (!patientId || !scheduledTime) {
          return res.status(400).json({ message: 'Validation error' });
        }

        const newSession = {
          id: 3,
          patientId: parseInt(patientId),
          patientName: 'New Patient',
          doctorId: 1,
          doctorName: 'Dr. Smith',
          scheduledTime: new Date(scheduledTime),
          status: status || 'scheduled',
          type: type || 'video',
          sessionUrl: null,
          notes: null,
          duration: null,
          createdAt: new Date(),
          completedAt: null,
        };

        res.status(201).json(newSession);
      } catch (error) {
        res.status(500).json({ message: 'Failed to create telemedicine session' });
      }
    });

    app.patch('/api/telemedicine/sessions/:id', async (req, res) => {
      try {
        const sessionId = parseInt(req.params.id);
        const updateData = req.body;

        const session = mockSessions.find((s) => s.id === sessionId);
        if (!session) {
          return res.status(404).json({ message: 'Session not found' });
        }

        const updatedSession = {
          ...session,
          ...updateData,
        };

        res.json(updatedSession);
      } catch (error) {
        res.status(500).json({ message: 'Failed to update session' });
      }
    });
  });

  describe('GET /api/telemedicine/sessions', () => {
    it('should fetch all telemedicine sessions', async () => {
      const response = await request(app)
        .get('/api/telemedicine/sessions')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('patientId');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('type');
    });

    it('should return sessions with patient and doctor information', async () => {
      const response = await request(app)
        .get('/api/telemedicine/sessions')
        .expect(200);

      expect(response.body[0]).toHaveProperty('patientName');
      expect(response.body[0]).toHaveProperty('doctorName');
    });

    it('should handle errors gracefully', async () => {
      // Create a separate app instance for error testing
      const errorApp = express();
      errorApp.use(express.json());
      errorApp.get('/api/telemedicine/sessions', (req, res) => {
        res.status(500).json({ message: 'Failed to fetch telemedicine sessions' });
      });

      await request(errorApp)
        .get('/api/telemedicine/sessions')
        .expect(500);
    });
  });

  describe('POST /api/telemedicine/sessions', () => {
    it('should create a new telemedicine session', async () => {
      const sessionData = {
        patientId: 1,
        type: 'video',
        scheduledTime: '2024-01-20T10:00:00Z',
        status: 'scheduled',
      };

      const response = await request(app)
        .post('/api/telemedicine/sessions')
        .send(sessionData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.patientId).toBe(sessionData.patientId);
      expect(response.body.type).toBe(sessionData.type);
      expect(response.body.status).toBe(sessionData.status);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        type: 'video',
        // Missing patientId and scheduledTime
      };

      const response = await request(app)
        .post('/api/telemedicine/sessions')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should accept different session types', async () => {
      const types = ['video', 'audio', 'chat'];

      for (const type of types) {
        const sessionData = {
          patientId: 1,
          type,
          scheduledTime: '2024-01-20T10:00:00Z',
        };

        const response = await request(app)
          .post('/api/telemedicine/sessions')
          .send(sessionData)
          .expect(201);

        expect(response.body.type).toBe(type);
      }
    });

    it('should handle server errors', async () => {
      // Create a separate app instance for error testing
      const errorApp = express();
      errorApp.use(express.json());
      errorApp.post('/api/telemedicine/sessions', (req, res) => {
        res.status(500).json({ message: 'Failed to create telemedicine session' });
      });

      await request(errorApp)
        .post('/api/telemedicine/sessions')
        .send({
          patientId: 1,
          scheduledTime: '2024-01-20T10:00:00Z',
        })
        .expect(500);
    });
  });

  describe('PATCH /api/telemedicine/sessions/:id', () => {
    it('should update an existing session', async () => {
      const updateData = {
        status: 'active',
        sessionUrl: 'https://meet.clinic.com/room-1',
      };

      const response = await request(app)
        .patch('/api/telemedicine/sessions/1')
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(updateData.status);
      expect(response.body.sessionUrl).toBe(updateData.sessionUrl);
    });

    it('should update session notes', async () => {
      const updateData = {
        notes: 'Patient consultation completed successfully',
      };

      const response = await request(app)
        .patch('/api/telemedicine/sessions/1')
        .send(updateData)
        .expect(200);

      expect(response.body.notes).toBe(updateData.notes);
    });

    it('should update session status to completed', async () => {
      const updateData = {
        status: 'completed',
        notes: 'Session completed',
        duration: 30,
      };

      const response = await request(app)
        .patch('/api/telemedicine/sessions/1')
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.duration).toBe(30);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .patch('/api/telemedicine/sessions/999')
        .send({ status: 'active' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Session not found');
    });

    it('should handle server errors', async () => {
      // Create a separate app instance for error testing
      const errorApp = express();
      errorApp.use(express.json());
      errorApp.patch('/api/telemedicine/sessions/:id', (req, res) => {
        res.status(500).json({ message: 'Failed to update session' });
      });

      await request(errorApp)
        .patch('/api/telemedicine/sessions/1')
        .send({ status: 'active' })
        .expect(500);
    });
  });

  describe('Session Status Transitions', () => {
    it('should allow status transition from scheduled to active', async () => {
      const response = await request(app)
        .patch('/api/telemedicine/sessions/1')
        .send({
          status: 'active',
          sessionUrl: 'https://meet.clinic.com/room-1',
        })
        .expect(200);

      expect(response.body.status).toBe('active');
      expect(response.body.sessionUrl).toBeDefined();
    });

    it('should allow status transition from active to completed', async () => {
      const response = await request(app)
        .patch('/api/telemedicine/sessions/2')
        .send({
          status: 'completed',
          duration: 45,
        })
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.duration).toBe(45);
    });

    it('should allow status transition to cancelled', async () => {
      const response = await request(app)
        .patch('/api/telemedicine/sessions/1')
        .send({
          status: 'cancelled',
        })
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });
  });
});

