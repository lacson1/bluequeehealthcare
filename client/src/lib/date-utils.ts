/**
 * International date and time formatting utilities
 * Follows ISO 8601 standards for data storage, displays in user's locale
 */

/**
 * Get user's locale from browser, with fallback to 'en-US'
 */
export function getUserLocale(): string {
  if (typeof window !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'en-US';
}

/**
 * Format date according to international standards
 * Uses browser locale for display, ISO 8601 for storage
 * 
 * @param date - Date string, Date object, or timestamp
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in user's locale
 */
export function formatDate(
  date: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const locale = getUserLocale();
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
}

/**
 * Format date in short format (MM/DD/YYYY or locale equivalent)
 */
export function formatDateShort(date: string | Date | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format date in medium format (e.g., "Jan 15, 2024")
 */
export function formatDateMedium(date: string | Date | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date in long format (e.g., "January 15, 2024")
 */
export function formatDateLong(date: string | Date | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return formatDate(date, { ...defaultOptions, ...options });
}

/**
 * Format time only
 */
export function formatTime(date: string | Date | number): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date for display in patient profile (DOB format)
 * Shows: "MMM DD, YYYY" (e.g., "May 15, 1990")
 */
export function formatDateOfBirth(date: string | Date | number): string {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date for medical records (ISO-like but readable)
 * Shows: "YYYY-MM-DD" for consistency in medical contexts
 */
export function formatDateMedical(date: string | Date | number): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date | number): number {
  try {
    const birth = typeof dateOfBirth === 'string' || typeof dateOfBirth === 'number'
      ? new Date(dateOfBirth)
      : dateOfBirth;
    
    if (isNaN(birth.getTime())) {
      return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Age calculation error:', error);
    return 0;
  }
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(date: string | Date | number): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDateMedium(dateObj);
    }
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Invalid Date';
  }
}

