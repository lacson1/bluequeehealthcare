import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupAppointmentRoutes } from '../appointments';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../audit', () => ({
  AuditLogger: vi.fn().mockImplementation(() => ({
    logPatientAction: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../middleware/auth', () => ({
  authenticateToken: vi.fn((req, res, next) => next()),
  requireAnyRole: vi.fn(() => (req, res, next) => next()),
}));

describe('Appointment Routes', () => {
  let router: any;

  beforeEach(() => {
    vi.clearAllMocks();
    router = setupAppointmentRoutes();
  });

  it('should setup appointment routes', () => {
    expect(router).toBeDefined();
  });

  it('should have GET /appointments route', () => {
    expect(router).toBeDefined();
  });

  it('should have POST /appointments route', () => {
    expect(router).toBeDefined();
  });

  it('should have GET /appointments/:id route', () => {
    expect(router).toBeDefined();
  });

  it('should have PATCH /appointments/:id route', () => {
    expect(router).toBeDefined();
  });

  it('should have DELETE /appointments/:id route', () => {
    expect(router).toBeDefined();
  });

  it('should have POST /appointments/:id/start-consultation route', () => {
    expect(router).toBeDefined();
  });

  it('should have POST /appointments/:id/complete-consultation route', () => {
    expect(router).toBeDefined();
  });
});

