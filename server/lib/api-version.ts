/**
 * API Versioning Utilities
 * 
 * Provides helpers for API versioning. Currently the API is at v1.
 * This module prepares the codebase for future version changes.
 * 
 * Usage in routes:
 *   router.get('/api/v1/patients', ...);
 *   router.get('/api/v2/patients', ...);
 * 
 * Or use the middleware to detect version from header:
 *   req.apiVersion // 'v1' | 'v2' etc.
 */

import { Request, Response, NextFunction } from 'express';
import { apiLogger as logger } from './logger';

// Current API version
export const CURRENT_API_VERSION = 'v1';

// Supported API versions
export const SUPPORTED_VERSIONS = ['v1'] as const;

export type ApiVersion = typeof SUPPORTED_VERSIONS[number];

// Extend Express Request to include apiVersion
declare global {
  namespace Express {
    interface Request {
      apiVersion?: ApiVersion;
    }
  }
}

/**
 * API version detection middleware
 * 
 * Detects API version from:
 * 1. URL path prefix (/api/v1/...)
 * 2. Accept-Version header
 * 3. X-API-Version header
 * 4. Falls back to current version
 */
export function detectApiVersion(req: Request, res: Response, next: NextFunction) {
  let version: string | undefined;

  // 1. Check URL path
  const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    version = pathMatch[1];
  }

  // 2. Check Accept-Version header
  if (!version && req.headers['accept-version']) {
    version = req.headers['accept-version'] as string;
  }

  // 3. Check X-API-Version header
  if (!version && req.headers['x-api-version']) {
    version = req.headers['x-api-version'] as string;
  }

  // Validate version
  if (version && !SUPPORTED_VERSIONS.includes(version as ApiVersion)) {
    logger.warn(`Unsupported API version requested: ${version}`);
    return res.status(400).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_VERSION',
        message: `API version '${version}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      },
    });
  }

  // Set version on request (default to current)
  req.apiVersion = (version as ApiVersion) || CURRENT_API_VERSION;

  // Set version in response header
  res.setHeader('X-API-Version', req.apiVersion);

  next();
}

/**
 * Version-specific route handler
 * 
 * Usage:
 *   router.get('/patients', versionedRoute({
 *     v1: (req, res) => { ... },
 *     v2: (req, res) => { ... },
 *   }));
 */
export function versionedRoute(handlers: Partial<Record<ApiVersion, (req: Request, res: Response) => void>>) {
  return (req: Request, res: Response) => {
    const version = req.apiVersion || CURRENT_API_VERSION;
    const handler = handlers[version];

    if (!handler) {
      // Fall back to the most recent version that's available
      const availableVersions = Object.keys(handlers) as ApiVersion[];
      const fallbackVersion = availableVersions[availableVersions.length - 1];
      
      if (fallbackVersion && handlers[fallbackVersion]) {
        logger.debug(`Using fallback version ${fallbackVersion} for ${req.path}`);
        return handlers[fallbackVersion]!(req, res);
      }

      return res.status(501).json({
        success: false,
        error: {
          code: 'VERSION_NOT_IMPLEMENTED',
          message: `This endpoint is not implemented for API version ${version}`,
        },
      });
    }

    return handler(req, res);
  };
}

/**
 * Get API info for health/status endpoints
 */
export function getApiInfo() {
  return {
    version: CURRENT_API_VERSION,
    supportedVersions: SUPPORTED_VERSIONS,
    deprecatedVersions: [] as string[],
  };
}

export default {
  CURRENT_API_VERSION,
  SUPPORTED_VERSIONS,
  detectApiVersion,
  versionedRoute,
  getApiInfo,
};

