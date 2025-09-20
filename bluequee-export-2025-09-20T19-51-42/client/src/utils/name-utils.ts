// Utility functions for consistent name display across the application

interface UserProfile {
  title?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
}

/**
 * Get the display name for a user with proper priority:
 * 1. Title + First Name + Last Name (if available)
 * 2. First Name + Last Name (if available)
 * 3. Username (fallback)
 */
export function getDisplayName(profile: UserProfile): string {
  const { title, firstName, lastName, username } = profile;
  
  // Ensure we're working with strings
  const firstStr = typeof firstName === 'string' ? firstName.trim() : '';
  const lastStr = typeof lastName === 'string' ? lastName.trim() : '';
  const titleStr = typeof title === 'string' ? title.trim() : '';
  const userStr = typeof username === 'string' ? username.trim() : '';
  
  // Check if we have first or last name
  if (firstStr || lastStr) {
    const fullName = `${firstStr} ${lastStr}`.trim();
    
    // Add title if available and not "none"
    if (titleStr && titleStr !== 'none') {
      return `${titleStr} ${fullName}`;
    }
    
    return fullName;
  }
  
  // Fallback to username if no personal name is available
  return userStr || 'User';
}

/**
 * Get formal display name (always includes title if available)
 */
export function getFormalName(profile: UserProfile): string {
  const { title, firstName, lastName, username } = profile;
  
  const hasPersonalName = firstName?.trim() || lastName?.trim();
  
  if (hasPersonalName) {
    const fullName = `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim();
    
    if (title && title !== 'none') {
      return `${title} ${fullName}`;
    }
    
    return fullName;
  }
  
  return username || 'User';
}

/**
 * Get initials for avatar display
 */
export function getInitials(profile: UserProfile): string {
  const { firstName, lastName, username } = profile;
  
  // Ensure we're working with strings
  const firstStr = typeof firstName === 'string' ? firstName.trim() : '';
  const lastStr = typeof lastName === 'string' ? lastName.trim() : '';
  const userStr = typeof username === 'string' ? username.trim() : '';
  
  if (firstStr || lastStr) {
    const firstInitial = firstStr ? firstStr.charAt(0).toUpperCase() : '';
    const lastInitial = lastStr ? lastStr.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}` || 'U';
  }
  
  // Fallback to username initials
  if (userStr) {
    const parts = userStr.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return userStr.substring(0, 2).toUpperCase();
  }
  
  return 'U';
}

/**
 * Check if user has complete personal information
 */
export function hasPersonalInfo(profile: UserProfile): boolean {
  return !!(profile.firstName?.trim() || profile.lastName?.trim());
}

/**
 * Get name for administrative contexts (shows username if no personal name)
 */
export function getAdminDisplayName(profile: UserProfile): string {
  const displayName = getDisplayName(profile);
  const { username } = profile;
  
  if (hasPersonalInfo(profile) && username && displayName !== username) {
    return `${displayName} (${username})`;
  }
  
  return displayName;
}