/**
 * Audit Log Compression Utility
 * Optimizes audit log storage to reduce database size while maintaining exportability
 */

/**
 * Compress user agent string to essential info only
 * Reduces from ~200-500 chars to ~30-50 chars
 */
export function compressUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;
  
  // Extract browser and OS info only
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|Brave)\/?([\d.]+)?/i);
  const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)[\s\/]?([\d.]+)?/i);
  
  const browser = browserMatch ? browserMatch[1] : 'Unknown';
  const browserVer = browserMatch?.[2]?.split('.')[0] || '';
  const os = osMatch ? osMatch[1].replace('iPhone', 'iOS').replace('iPad', 'iOS') : 'Unknown';
  const osVer = osMatch?.[2]?.split('.')[0] || '';
  
  return `${browser}${browserVer ? `/${browserVer}` : ''} ${os}${osVer ? `/${osVer}` : ''}`.trim();
}

/**
 * Compress JSON details - minify and remove unnecessary whitespace
 * Also removes null/undefined values to reduce size
 */
export function compressDetails(details: Record<string, any> | null | undefined): string | null {
  if (!details || typeof details !== 'object') return null;
  
  // Remove null/undefined values
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(details)) {
    if (value !== null && value !== undefined) {
      // Truncate very long strings
      if (typeof value === 'string' && value.length > 200) {
        cleaned[key] = value.substring(0, 200) + '...';
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  if (Object.keys(cleaned).length === 0) return null;
  
  // Minify JSON (no spaces, no indentation)
  return JSON.stringify(cleaned);
}

/**
 * Decompress details back to readable format
 */
export function decompressDetails(compressedDetails: string | null): Record<string, any> | null {
  if (!compressedDetails) return null;
  
  try {
    return JSON.parse(compressedDetails);
  } catch {
    return null;
  }
}

/**
 * Compress action string - use shorter codes for common actions
 */
const ACTION_MAP: Record<string, string> = {
  'Patient Created': 'P_CREATE',
  'Patient Viewed': 'P_VIEW',
  'Patient Updated': 'P_UPDATE',
  'Patient QR Code Generated': 'P_QR',
  'Visit Created': 'V_CREATE',
  'Visit Viewed': 'V_VIEW',
  'Visit Updated': 'V_UPDATE',
  'Lab Result Created': 'L_CREATE',
  'Lab Result Viewed': 'L_VIEW',
  'Lab Result Updated': 'L_UPDATE',
  'Prescription Created': 'PR_CREATE',
  'Prescription Viewed': 'PR_VIEW',
  'Prescription Updated': 'PR_UPDATE',
  'Prescription Dispensed': 'PR_DISP',
  'Medicine Created': 'M_CREATE',
  'Medicine Updated': 'M_UPDATE',
  'Medicine Stock Updated': 'M_STOCK',
  'User Login': 'U_LOGIN',
  'User Logout': 'U_LOGOUT',
  'User Created': 'U_CREATE',
  'User Updated': 'U_UPDATE',
  'User Profile Viewed': 'U_PROF_V',
  'User Profile Updated': 'U_PROF_U',
  'Referral Created': 'REF_CREATE',
  'Referral Viewed': 'REF_VIEW',
  'Referral Updated': 'REF_UPDATE',
  'Data Export': 'SYS_EXPORT',
  'Report Generated': 'SYS_REPORT',
  'System Backup': 'SYS_BACKUP',
};

const REVERSE_ACTION_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ACTION_MAP).map(([k, v]) => [v, k])
);

/**
 * Compress action to short code
 */
export function compressAction(action: string): string {
  // If already compressed (starts with known pattern), return as-is
  if (Object.values(ACTION_MAP).includes(action)) {
    return action;
  }
  return ACTION_MAP[action] || action.substring(0, 50); // Fallback to truncated if not in map
}

/**
 * Decompress action code back to full name
 */
export function decompressAction(compressedAction: string): string {
  // If already decompressed (not in reverse map), return as-is
  if (!REVERSE_ACTION_MAP[compressedAction] && compressedAction.length > 10) {
    return compressedAction;
  }
  return REVERSE_ACTION_MAP[compressedAction] || compressedAction;
}

/**
 * Compress entity type to shorter code
 */
const ENTITY_TYPE_MAP: Record<string, string> = {
  'patient': 'P',
  'visit': 'V',
  'lab_result': 'L',
  'prescription': 'PR',
  'medicine': 'M',
  'user': 'U',
  'referral': 'REF',
  'system': 'SYS',
};

const REVERSE_ENTITY_TYPE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ENTITY_TYPE_MAP).map(([k, v]) => [v, k])
);

/**
 * Compress entity type
 */
export function compressEntityType(entityType: string): string {
  // If already compressed (single letter or short code), return as-is
  if (Object.values(ENTITY_TYPE_MAP).includes(entityType)) {
    return entityType;
  }
  return ENTITY_TYPE_MAP[entityType] || entityType;
}

/**
 * Decompress entity type
 */
export function decompressEntityType(compressedType: string): string {
  // If already decompressed (longer than 3 chars), return as-is
  if (!REVERSE_ENTITY_TYPE_MAP[compressedType] && compressedType.length > 3) {
    return compressedType;
  }
  return REVERSE_ENTITY_TYPE_MAP[compressedType] || compressedType;
}

/**
 * Full compression of audit log data before storage
 */
export interface CompressedAuditData {
  userId: number;
  action: string; // Compressed
  entityType: string; // Compressed
  entityId?: number | null;
  details?: string | null; // Compressed JSON
  ipAddress?: string | null;
  userAgent?: string | null; // Compressed
}

export function compressAuditData(data: {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): CompressedAuditData {
  return {
    userId: data.userId,
    action: compressAction(data.action),
    entityType: compressEntityType(data.entityType),
    entityId: data.entityId || null,
    details: compressDetails(data.details || null),
    ipAddress: data.ipAddress || null,
    userAgent: compressUserAgent(data.userAgent || null),
  };
}

/**
 * Decompress audit log data for reading/export
 */
export function decompressAuditData(data: {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
} {
  return {
    userId: data.userId,
    action: decompressAction(data.action),
    entityType: decompressEntityType(data.entityType),
    entityId: data.entityId || null,
    details: decompressDetails(data.details || null),
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null, // Already compressed format is fine for display
  };
}

