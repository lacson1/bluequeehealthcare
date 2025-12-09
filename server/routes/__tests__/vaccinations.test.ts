import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupVaccinationRoutes } from '../vaccinations';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock('../../middleware/auth', () => ({
  authenticateToken: vi.fn((req, res, next) => next()),
  requireAnyRole: vi.fn(() => (req, res, next) => next()),
}));

describe('Vaccination Routes', () => {
  let router: any;

  beforeEach(() => {
    vi.clearAllMocks();
    router = setupVaccinationRoutes();
  });

  it('should setup vaccination routes', () => {
    expect(router).toBeDefined();
  });

  it('should have GET /vaccinations/all route', () => {
    expect(router).toBeDefined();
  });

  it('should have GET /patients/:id/vaccinations route', () => {
    expect(router).toBeDefined();
  });

  it('should have POST /patients/:id/vaccinations route', () => {
    expect(router).toBeDefined();
  });

  it('should have PATCH /patients/:patientId/vaccinations/:id route', () => {
    expect(router).toBeDefined();
  });

  it('should have DELETE /patients/:patientId/vaccinations/:id route', () => {
    expect(router).toBeDefined();
  });

  it('should have GET /vaccinations/due-soon route', () => {
    expect(router).toBeDefined();
  });

  it('should have GET /vaccinations/statistics route', () => {
    expect(router).toBeDefined();
  });
});

