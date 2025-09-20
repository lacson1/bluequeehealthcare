import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { organizations, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface TenantRequest extends Request {
  tenant?: {
    id: number;
    name: string;
    type: string;
    logoUrl?: string;
    themeColor: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    isActive: boolean;
  };
}

// Middleware to extract and validate tenant context
export async function tenantMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    // Extract tenant information from subdomain, header, or user context
    let tenantId: number | null = null;
    
    // Method 1: From subdomain (e.g., clinic1.bluequee.com)
    const subdomain = req.hostname.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'bluequee') {
      const orgBySubdomain = await db.select()
        .from(organizations)
        .where(and(
          eq(organizations.name, subdomain),
          eq(organizations.isActive, true)
        ))
        .limit(1);
      
      if (orgBySubdomain.length > 0) {
        tenantId = orgBySubdomain[0].id;
        req.tenant = orgBySubdomain[0];
      }
    }
    
    // Method 2: From X-Tenant-ID header
    if (!tenantId && req.headers['x-tenant-id']) {
      const headerTenantId = parseInt(req.headers['x-tenant-id'] as string);
      if (!isNaN(headerTenantId)) {
        const orgById = await db.select()
          .from(organizations)
          .where(and(
            eq(organizations.id, headerTenantId),
            eq(organizations.isActive, true)
          ))
          .limit(1);
        
        if (orgById.length > 0) {
          tenantId = orgById[0].id;
          req.tenant = orgById[0];
        }
      }
    }
    
    // Method 3: From authenticated user's organization
    if (!tenantId && (req as any).user?.organizationId) {
      const userOrgId = (req as any).user.organizationId;
      const orgByUser = await db.select()
        .from(organizations)
        .where(and(
          eq(organizations.id, userOrgId),
          eq(organizations.isActive, true)
        ))
        .limit(1);
      
      if (orgByUser.length > 0) {
        tenantId = orgByUser[0].id;
        req.tenant = orgByUser[0];
      }
    }
    
    // If no tenant found, return error for protected routes
    if (!tenantId && req.path.startsWith('/api/')) {
      return res.status(400).json({ 
        error: 'Tenant context required',
        message: 'Please specify organization context via subdomain, header, or user authentication'
      });
    }
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ error: 'Failed to resolve tenant context' });
  }
}

// Middleware to ensure user belongs to the current tenant
export function validateUserTenant(req: TenantRequest, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.tenant) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  
  // Check if user belongs to the current tenant
  if (user.organizationId !== req.tenant.id) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'User does not belong to this organization'
    });
  }
  
  next();
}

// Helper function to get tenant-scoped query conditions
export function getTenantScope(tenantId: number) {
  return { organizationId: tenantId };
}

// Helper function to add tenant context to data
export function addTenantContext<T extends Record<string, any>>(
  data: T, 
  tenantId: number
): T & { organizationId: number } {
  return {
    ...data,
    organizationId: tenantId
  };
}