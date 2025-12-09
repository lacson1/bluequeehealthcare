import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticateToken, requireRole, requireAnyRole } from '../auth';
import type { Request, Response } from 'express';

// Mock session
const mockSession = {
  user: {
    id: 1,
    username: 'testuser',
    role: 'doctor',
    organizationId: 1,
  },
  lastActivity: new Date(),
  destroy: vi.fn((callback) => callback(null)),
  save: vi.fn((callback) => callback(null)),
};

describe('Authentication Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNext = vi.fn();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockReq = {
      session: mockSession as any,
      headers: {},
    };
  });

  describe('authenticateToken', () => {
    it('should authenticate user with valid session', async () => {
      await authenticateToken(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe(1);
    });

    it('should reject request without session', async () => {
      mockReq.session = undefined;

      await authenticateToken(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired session', async () => {
      const expiredDate = new Date();
      expiredDate.setTime(expiredDate.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      mockSession.lastActivity = expiredDate;

      await authenticateToken(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireRole', () => {
    it('should allow access for correct role', () => {
      mockReq.user = {
        id: 1,
        username: 'testuser',
        role: 'doctor',
        organizationId: 1,
      };

      const middleware = requireRole('doctor');
      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for incorrect role', () => {
      mockReq.user = {
        id: 1,
        username: 'testuser',
        role: 'nurse',
        organizationId: 1,
      };

      const middleware = requireRole('doctor');
      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow superadmin access to everything', () => {
      mockReq.user = {
        id: 1,
        username: 'admin',
        role: 'superadmin',
        organizationId: 1,
      };

      const middleware = requireRole('doctor');
      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAnyRole', () => {
    it('should allow access if user has one of the required roles', () => {
      mockReq.user = {
        id: 1,
        username: 'testuser',
        role: 'nurse',
        organizationId: 1,
      };

      const middleware = requireAnyRole(['doctor', 'nurse', 'admin']);
      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access if user does not have required role', () => {
      mockReq.user = {
        id: 1,
        username: 'testuser',
        role: 'receptionist',
        organizationId: 1,
      };

      const middleware = requireAnyRole(['doctor', 'nurse', 'admin']);
      middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

