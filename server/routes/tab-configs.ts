import { Express, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tabConfigs, insertTabConfigSchema } from '../../shared/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { authenticateToken, type AuthRequest } from '../middleware/auth';
import { tenantMiddleware, type TenantRequest } from '../middleware/tenant';

// System tabs configuration - matches the registry
const SYSTEM_TABS = [
  { key: 'overview', label: 'Overview', icon: 'User', contentType: 'builtin_component', displayOrder: 10, category: 'clinical' },
  { key: 'visits', label: 'Visits', icon: 'Calendar', contentType: 'builtin_component', displayOrder: 20, category: 'clinical' },
  { key: 'lab', label: 'Lab Results', icon: 'TestTube', contentType: 'builtin_component', displayOrder: 30, category: 'clinical' },
  { key: 'medications', label: 'Medications', icon: 'Pill', contentType: 'builtin_component', displayOrder: 40, category: 'clinical' },
  { key: 'vitals', label: 'Vitals', icon: 'Activity', contentType: 'builtin_component', displayOrder: 50, category: 'clinical' },
  { key: 'documents', label: 'Documents', icon: 'FileText', contentType: 'builtin_component', displayOrder: 60, category: 'administrative' },
  { key: 'billing', label: 'Billing', icon: 'CreditCard', contentType: 'builtin_component', displayOrder: 70, category: 'administrative' },
  { key: 'insurance', label: 'Insurance', icon: 'Shield', contentType: 'builtin_component', displayOrder: 80, category: 'administrative' },
  { key: 'appointments', label: 'Appointments', icon: 'CalendarDays', contentType: 'builtin_component', displayOrder: 90, category: 'administrative' },
  { key: 'history', label: 'History', icon: 'History', contentType: 'builtin_component', displayOrder: 100, category: 'clinical' },
  { key: 'med-reviews', label: 'Reviews', icon: 'FileCheck', contentType: 'builtin_component', displayOrder: 110, category: 'clinical' },
  { key: 'communication', label: 'Chat', icon: 'MessageSquare', contentType: 'builtin_component', displayOrder: 120, category: 'administrative' },
  { key: 'immunizations', label: 'Vaccines', icon: 'Syringe', contentType: 'builtin_component', displayOrder: 130, category: 'clinical' },
  { key: 'timeline', label: 'Timeline', icon: 'Clock', contentType: 'builtin_component', displayOrder: 140, category: 'clinical' },
  { key: 'safety', label: 'Safety', icon: 'Shield', contentType: 'builtin_component', displayOrder: 150, category: 'clinical' },
  { key: 'specialty', label: 'Specialty', icon: 'Stethoscope', contentType: 'builtin_component', displayOrder: 160, category: 'clinical' },
  { key: 'allergies', label: 'Allergies', icon: 'AlertTriangle', contentType: 'builtin_component', displayOrder: 170, category: 'clinical' },
  { key: 'imaging', label: 'Imaging', icon: 'Scan', contentType: 'builtin_component', displayOrder: 180, category: 'clinical' },
  { key: 'procedures', label: 'Procedures', icon: 'Scissors', contentType: 'builtin_component', displayOrder: 190, category: 'clinical' },
  { key: 'referrals', label: 'Referrals', icon: 'Users', contentType: 'builtin_component', displayOrder: 200, category: 'clinical' },
  { key: 'care-plans', label: 'Care Plans', icon: 'ClipboardList', contentType: 'builtin_component', displayOrder: 210, category: 'clinical' },
  { key: 'notes', label: 'Notes', icon: 'BookOpen', contentType: 'builtin_component', displayOrder: 220, category: 'clinical' },
  { key: 'longevity', label: 'Longevity', icon: 'Timer', contentType: 'builtin_component', displayOrder: 230, category: 'clinical' },
];

// Auto-seed system tabs if they don't exist
async function ensureSystemTabsSeeded() {
  try {
    const existingTabs = await db
      .select()
      .from(tabConfigs)
      .where(and(eq(tabConfigs.scope, 'system'), eq(tabConfigs.isSystemDefault, true)));
    
    const existingKeys = new Set(existingTabs.map(t => t.key));
    const tabsToInsert = SYSTEM_TABS.filter(tab => !existingKeys.has(tab.key));
    
    if (tabsToInsert.length > 0) {
      await db.insert(tabConfigs).values(
        tabsToInsert.map(tab => ({
          ...tab,
          scope: 'system' as const,
          isSystemDefault: true,
          isVisible: true,
          isMandatory: false,
          settings: {},
          organizationId: null,
          roleId: null,
          userId: null,
          createdBy: null,
        }))
      );
      console.log(`✅ Auto-seeded ${tabsToInsert.length} system tabs`);
    }
  } catch (error) {
    console.error('⚠️  Error auto-seeding tabs (non-critical):', error);
    // Don't throw - this is a non-critical operation
  }
}

type TabScope = 'system' | 'organization' | 'role' | 'user';

// Combined type for tenant + auth requests
interface CombinedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    roleId?: number;
    organizationId?: number;
    currentOrganizationId?: number;
  };
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

export function setupTabConfigRoutes(app: Express) {
  // Auto-seed tabs on first request (non-blocking)
  let seedingPromise: Promise<void> | null = null;
  const ensureSeeded = () => {
    if (!seedingPromise) {
      seedingPromise = ensureSystemTabsSeeded();
    }
    return seedingPromise;
  };

  // Get tab configurations with scope hierarchy resolution
  app.get('/api/tab-configs', authenticateToken, tenantMiddleware, async (req: CombinedRequest, res: Response) => {
    // Ensure tabs are seeded (non-blocking)
    ensureSeeded().catch(() => {});
    
    try {
      const organizationId = req.tenant?.id;
      const userId = req.user?.id;
      const roleId = req.user?.roleId;

      // If no organization context, return system tabs only (fallback)
      if (!organizationId) {
        console.warn('No organization context, returning system tabs only');
        const systemTabs = await db
          .select()
          .from(tabConfigs)
          .where(
            and(
              eq(tabConfigs.scope, 'system'),
              eq(tabConfigs.isSystemDefault, true),
              eq(tabConfigs.isVisible, true)
            )
          )
          .orderBy(tabConfigs.displayOrder);
        return res.json(systemTabs);
      }

      // Fetch tabs in hierarchy order: system -> organization -> role -> user
      const tabs = await db
        .select()
        .from(tabConfigs)
        .where(
          or(
            // System defaults (available to all)
            and(eq(tabConfigs.scope, 'system'), eq(tabConfigs.isSystemDefault, true)),
            // Organization-specific tabs
            and(eq(tabConfigs.scope, 'organization'), eq(tabConfigs.organizationId, organizationId)),
            // Role-specific tabs (if user has a role)
            roleId ? and(eq(tabConfigs.scope, 'role'), eq(tabConfigs.roleId, roleId)) : undefined,
            // User-specific tabs
            userId ? and(eq(tabConfigs.scope, 'user'), eq(tabConfigs.userId, userId)) : undefined
          )
        )
        .orderBy(tabConfigs.displayOrder);

      // Merge tabs by key, preferring more specific scopes
      const tabMap = new Map();
      const scopePriority: Record<TabScope, number> = { system: 1, organization: 2, role: 3, user: 4 };

      for (const tab of tabs) {
        const existing = tabMap.get(tab.key);
        const tabScope = tab.scope as TabScope;
        const existingScope = existing?.scope as TabScope;
        
        if (!existing || scopePriority[tabScope] > scopePriority[existingScope]) {
          tabMap.set(tab.key, tab);
        }
      }

      const mergedTabs = Array.from(tabMap.values())
        .filter(tab => tab.isVisible)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      res.json(mergedTabs);
    } catch (error) {
      console.error('Error fetching tab configs:', error);
      res.status(500).json({ error: 'Failed to fetch tab configurations' });
    }
  });

  // Create a new custom tab
  app.post('/api/tab-configs', authenticateToken, tenantMiddleware, async (req: CombinedRequest, res: Response) => {
    try {
      const organizationId = req.tenant?.id;
      const userId = req.user?.id;

      if (!organizationId) {
        return res.status(403).json({ error: 'Organization context required' });
      }

      if (!userId) {
        return res.status(403).json({ error: 'User context required' });
      }

      console.log('Creating tab with data:', JSON.stringify(req.body, null, 2));

      const validatedData = insertTabConfigSchema.parse(req.body);

      // Auto-assign IDs based on scope
      const tabData = {
        ...validatedData,
        organizationId: validatedData.scope === 'organization' ? organizationId : null,
        userId: validatedData.scope === 'user' ? userId : null,
        createdBy: userId,
        isSystemDefault: false,
      };

      console.log('Inserting tab data:', JSON.stringify(tabData, null, 2));

      const [newTab] = await db.insert(tabConfigs).values(tabData).returning();

      console.log('Successfully created tab:', newTab);

      res.status(201).json(newTab);
    } catch (error: any) {
      console.error('Error creating tab config:', error);
      
      // Return detailed error message for validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors,
          message: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      
      res.status(400).json({ 
        error: error.message || 'Failed to create tab configuration',
        details: error.toString()
      });
    }
  });

  // Hide/Show tab (creates override for system tabs, updates custom tabs)
  app.patch('/api/tab-configs/:id/visibility', authenticateToken, tenantMiddleware, async (req: CombinedRequest, res: Response) => {
    try {
      const tabId = parseInt(req.params.id);
      const { isVisible, scope: targetScope = 'user' } = req.body;
      const userId = req.user?.id;
      const roleId = req.user?.roleId;
      const organizationId = req.tenant?.id;

      if (!organizationId) {
        return res.status(403).json({ error: 'Organization context required' });
      }

      const [existingTab] = await db
        .select()
        .from(tabConfigs)
        .where(eq(tabConfigs.id, tabId));

      if (!existingTab) {
        return res.status(404).json({ error: 'Tab configuration not found' });
      }

      // Check if tab is mandatory
      if (existingTab.isMandatory && !isVisible) {
        return res.status(403).json({ 
          error: 'Cannot hide mandatory tab',
          message: 'This tab is required and cannot be hidden'
        });
      }

      // Validate targetScope authorization
      if (targetScope === 'role' && !roleId) {
        return res.status(400).json({ error: 'Cannot create role override without a role assignment' });
      }
      if (targetScope === 'organization' && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only admins can create organization-wide overrides' });
      }

      // If hiding, ensure at least one tab will remain visible in the MERGED view
      if (!isVisible) {
        // Fetch all tabs (same as GET endpoint)
        const allTabs = await db
          .select()
          .from(tabConfigs)
          .where(
            or(
              and(eq(tabConfigs.scope, 'system'), eq(tabConfigs.isSystemDefault, true)),
              and(eq(tabConfigs.scope, 'organization'), eq(tabConfigs.organizationId, organizationId)),
              roleId ? and(eq(tabConfigs.scope, 'role'), eq(tabConfigs.roleId, roleId)) : undefined,
              userId ? and(eq(tabConfigs.scope, 'user'), eq(tabConfigs.userId, userId)) : undefined
            )
          );

        // Merge tabs by key, preferring more specific scopes (same logic as GET)
        const tabMap = new Map();
        const scopePriority: Record<TabScope, number> = { system: 1, organization: 2, role: 3, user: 4 };

        for (const tab of allTabs) {
          const existing = tabMap.get(tab.key);
          const tabScope = tab.scope as TabScope;
          const existingScope = existing?.scope as TabScope;
          
          if (!existing || scopePriority[tabScope] > scopePriority[existingScope]) {
            tabMap.set(tab.key, tab);
          }
        }

        // Simulate the hide by setting the target tab as hidden in the merged view
        const targetTabInMerged = tabMap.get(existingTab.key);
        if (targetTabInMerged) {
          const targetScopePriority = scopePriority[targetScope as TabScope];
          const currentScopePriority = scopePriority[targetTabInMerged.scope as TabScope];
          
          // If the new override will take precedence, mark it as hidden
          if (targetScopePriority >= currentScopePriority) {
            tabMap.set(existingTab.key, { ...targetTabInMerged, isVisible: false });
          }
        }

        // Count visible tabs in merged view (after simulating the hide)
        const mergedTabs = Array.from(tabMap.values());
        const visibleCount = mergedTabs.filter(t => t.isVisible).length;
        
        // Only prevent hiding if it would leave zero visible tabs
        // This allows maximum flexibility while ensuring at least one tab remains visible
        if (visibleCount === 0) {
          return res.status(400).json({ 
            error: 'Cannot hide last visible tab',
            message: 'At least one tab must remain visible in your view'
          });
        }
      }

      // For system tabs, create or update an override
      if (existingTab.isSystemDefault) {
        // Check if override already exists
        const [existingOverride] = await db
          .select()
          .from(tabConfigs)
          .where(
            and(
              eq(tabConfigs.key, existingTab.key),
              eq(tabConfigs.scope, targetScope),
              targetScope === 'user' ? eq(tabConfigs.userId, userId!) : 
              targetScope === 'role' ? eq(tabConfigs.roleId, roleId!) : 
              eq(tabConfigs.organizationId, organizationId)
            )
          );

        if (existingOverride) {
          // Update existing override
          const [updated] = await db
            .update(tabConfigs)
            .set({ isVisible, updatedAt: new Date() })
            .where(eq(tabConfigs.id, existingOverride.id))
            .returning();
          return res.json(updated);
        } else {
          // Create new override
          const overrideData = {
            key: existingTab.key,
            label: existingTab.label,
            icon: existingTab.icon,
            contentType: existingTab.contentType,
            settings: existingTab.settings,
            scope: targetScope,
            organizationId: targetScope === 'organization' ? organizationId : null,
            roleId: targetScope === 'role' ? roleId : null,
            userId: targetScope === 'user' ? userId : null,
            isVisible,
            isSystemDefault: false,
            isMandatory: false,
            displayOrder: existingTab.displayOrder,
            createdBy: userId,
          };

          const [newOverride] = await db.insert(tabConfigs).values(overrideData).returning();
          return res.json(newOverride);
        }
      } else {
        // For custom tabs, update directly
        const [updatedTab] = await db
          .update(tabConfigs)
          .set({ isVisible, updatedAt: new Date() })
          .where(eq(tabConfigs.id, tabId))
          .returning();
        return res.json(updatedTab);
      }
    } catch (error) {
      console.error('Error updating tab visibility:', error);
      res.status(400).json({ error: 'Failed to update tab visibility' });
    }
  });

  // Update tab configuration (for custom tabs only)
  app.patch('/api/tab-configs/:id', authenticateToken, tenantMiddleware, async (req: CombinedRequest, res: Response) => {
    try {
      const tabId = parseInt(req.params.id);
      const userId = req.user?.id;
      const organizationId = req.tenant?.id;

      const [existingTab] = await db
        .select()
        .from(tabConfigs)
        .where(eq(tabConfigs.id, tabId));

      if (!existingTab) {
        return res.status(404).json({ error: 'Tab configuration not found' });
      }

      if (existingTab.isSystemDefault) {
        return res.status(403).json({ error: 'Cannot modify system default tabs directly. Use visibility endpoint to create overrides.' });
      }

      // Multi-tenant access control: verify ownership
      if (existingTab.scope === 'organization' && existingTab.organizationId !== organizationId) {
        return res.status(403).json({ error: 'Cannot edit another organization\'s tab' });
      }

      if (existingTab.scope === 'role') {
        if (existingTab.organizationId !== organizationId || existingTab.roleId !== req.user?.roleId) {
          return res.status(403).json({ error: 'Cannot edit another role\'s tab' });
        }
      }

      if (existingTab.scope === 'user' && existingTab.userId !== userId) {
        return res.status(403).json({ error: 'Cannot edit another user\'s tab' });
      }

      const { label, icon, isVisible, settings } = req.body;

      const [updatedTab] = await db
        .update(tabConfigs)
        .set({
          label,
          icon,
          isVisible,
          settings,
          updatedAt: new Date(),
        })
        .where(eq(tabConfigs.id, tabId))
        .returning();

      res.json(updatedTab);
    } catch (error) {
      console.error('Error updating tab config:', error);
      res.status(400).json({ error: 'Failed to update tab configuration' });
    }
  });

  // Reorder tabs
  app.patch('/api/tab-configs/reorder', authenticateToken, tenantMiddleware, async (req: CombinedRequest, res: Response) => {
    try {
      const { tabs } = req.body;
      const organizationId = req.tenant?.id;
      const userId = req.user?.id;

      if (!organizationId) {
        return res.status(403).json({ error: 'Organization context required' });
      }

      if (!Array.isArray(tabs)) {
        return res.status(400).json({ error: 'Invalid request format' });
      }

      if (tabs.length === 0) {
        return res.json({ message: 'No tabs to reorder', count: 0 });
      }

      // Fetch all tabs to verify ownership before reordering
      const tabIds = tabs.map(t => t.id);
      const existingTabs = await db
        .select()
        .from(tabConfigs)
        .where(inArray(tabConfigs.id, tabIds));

      // SECURITY: Ensure ALL requested tabs were found
      // If counts don't match, some IDs don't exist or belong to another tenant
      if (existingTabs.length !== tabs.length) {
        return res.status(403).json({ error: 'Cannot reorder tabs that do not belong to your organization' });
      }

      // Verify each tab belongs to current tenant/user
      // SECURITY: Also filter out system defaults to prevent global ordering changes
      for (const tab of existingTabs) {
        // System defaults cannot be reordered (immutable)
        if (tab.isSystemDefault) {
          return res.status(403).json({ error: 'Cannot reorder system default tabs' });
        }

        if (tab.scope === 'organization' && tab.organizationId !== organizationId) {
          return res.status(403).json({ error: 'Cannot reorder another organization\'s tabs' });
        }
        if (tab.scope === 'role') {
          if (tab.organizationId !== organizationId || tab.roleId !== req.user?.roleId) {
            return res.status(403).json({ error: 'Cannot reorder another role\'s tabs' });
          }
        }
        if (tab.scope === 'user' && tab.userId !== userId) {
          return res.status(403).json({ error: 'Cannot reorder another user\'s tabs' });
        }
      }

      const updates = await Promise.all(
        tabs.map(({ id, displayOrder }: { id: number; displayOrder: number }) =>
          db
            .update(tabConfigs)
            .set({ displayOrder, updatedAt: new Date() })
            .where(eq(tabConfigs.id, id))
            .returning()
        )
      );

      res.json({ message: 'Tab order updated successfully', count: updates.length });
    } catch (error) {
      console.error('Error reordering tabs:', error);
      res.status(400).json({ error: 'Failed to reorder tabs' });
    }
  });

  // Delete a custom tab
  app.delete('/api/tab-configs/:id', authenticateToken, tenantMiddleware, async (req: CombinedRequest, res: Response) => {
    try {
      const tabId = parseInt(req.params.id);
      const userId = req.user?.id;
      const organizationId = req.tenant?.id;

      const [existingTab] = await db
        .select()
        .from(tabConfigs)
        .where(eq(tabConfigs.id, tabId));

      if (!existingTab) {
        return res.status(404).json({ error: 'Tab configuration not found' });
      }

      if (existingTab.isSystemDefault) {
        return res.status(403).json({ error: 'Cannot delete system default tabs' });
      }

      // Multi-tenant access control: verify ownership
      if (existingTab.scope === 'organization' && existingTab.organizationId !== organizationId) {
        return res.status(403).json({ error: 'Cannot delete another organization\'s tab' });
      }

      if (existingTab.scope === 'role') {
        if (existingTab.organizationId !== organizationId || existingTab.roleId !== req.user?.roleId) {
          return res.status(403).json({ error: 'Cannot delete another role\'s tab' });
        }
      }

      if (existingTab.scope === 'user' && existingTab.userId !== userId) {
        return res.status(403).json({ error: 'Cannot delete another user\'s tab' });
      }

      await db.delete(tabConfigs).where(eq(tabConfigs.id, tabId));

      res.json({ message: 'Tab deleted successfully' });
    } catch (error) {
      console.error('Error deleting tab config:', error);
      res.status(500).json({ error: 'Failed to delete tab configuration' });
    }
  });

  // Reset to defaults (remove all overrides for user/role/org)
  app.delete('/api/tab-configs/reset', authenticateToken, tenantMiddleware, async (req: CombinedRequest, res: Response) => {
    try {
      const { scope = 'user' } = req.body;
      const userId = req.user?.id;
      const roleId = req.user?.roleId;
      const organizationId = req.tenant?.id;

      if (!organizationId) {
        return res.status(403).json({ error: 'Organization context required' });
      }

      // Authorization check
      if (scope === 'organization' && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only admins can reset organization-wide tabs' });
      }

      // Delete overrides based on scope
      let deletedCount = 0;
      if (scope === 'user' && userId) {
        const result = await db.delete(tabConfigs)
          .where(and(
            eq(tabConfigs.scope, 'user'),
            eq(tabConfigs.userId, userId),
            eq(tabConfigs.isSystemDefault, false)
          ))
          .returning();
        deletedCount = result.length;
      } else if (scope === 'role' && roleId) {
        const result = await db.delete(tabConfigs)
          .where(and(
            eq(tabConfigs.scope, 'role'),
            eq(tabConfigs.roleId, roleId),
            eq(tabConfigs.isSystemDefault, false)
          ))
          .returning();
        deletedCount = result.length;
      } else if (scope === 'organization' && organizationId) {
        const result = await db.delete(tabConfigs)
          .where(and(
            eq(tabConfigs.scope, 'organization'),
            eq(tabConfigs.organizationId, organizationId),
            eq(tabConfigs.isSystemDefault, false)
          ))
          .returning();
        deletedCount = result.length;
      }

      res.json({ 
        message: 'Tab configuration reset to defaults', 
        deletedCount,
        scope
      });
    } catch (error) {
      console.error('Error resetting tab configs:', error);
      res.status(500).json({ error: 'Failed to reset tab configuration' });
    }
  });

  // Tab configuration seeding endpoint removed
}
