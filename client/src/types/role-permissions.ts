/**
 * Type definitions for Role Permissions Management
 */

export interface Permission {
  id: number;
  name: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissions: Permission[];
  createdAt: string;
}

export interface PermissionGroup {
  all: Permission[];
  grouped: Record<string, Permission[]>;
}

export interface UpdatePermissionsPayload {
  roleId: number;
  permissionIds: number[];
}

export interface RolePermissionsState {
  selectedRoleId: number | null;
  searchTerm: string;
  filterCategory: string;
  selectedPermissions: number[];
  expandedCategories: Set<string>;
  hasUnsavedChanges: boolean;
}

