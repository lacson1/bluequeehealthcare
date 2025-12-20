import { generatePrintDocument, printWithOrganizationHeader } from '../components/organization-print-header';
import { format } from 'date-fns';

export interface Organization {
  id: number;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  themeColor?: string;
  letterheadConfig?: {
    tagline?: string;
    accreditation?: string;
    certifications?: string[];
    footerNote?: string;
    disclaimer?: string;
    primaryColor?: string;
    secondaryColor?: string;
    showLogo?: boolean;
    showTagline?: boolean;
    showAccreditation?: boolean;
    showCertifications?: boolean;
  };
}

/**
 * Fetch organization data from API
 */
export async function fetchOrganizationData(organizationId?: number): Promise<Organization | null> {
  try {
    // If organizationId is provided, use it, otherwise try to get from user context
    let url = '/api/organization';
    if (organizationId) {
      url = `/api/organizations/${organizationId}`;
    }

    const response = await fetch(url, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organization');
    }

    const data = await response.json();
    return data as Organization;
  } catch (error) {
    console.warn('Could not fetch organization data:', error);
    return null;
  }
}

/**
 * Get default organization data if fetch fails
 */
function getDefaultOrganization(): Organization {
  return {
    id: 1,
    name: 'Healthcare Facility',
    type: 'clinic',
    address: '123 Healthcare Avenue',
    phone: '+234 802 123 4567',
    email: 'info@clinic.com',
    website: 'www.clinic.com',
    themeColor: '#1e40af',
    letterheadConfig: {
      tagline: 'Excellence in Healthcare Services',
      accreditation: 'Licensed Healthcare Facility',
      primaryColor: '#1e40af',
      secondaryColor: '#3b82f6',
      showLogo: true,
      showTagline: true,
      showAccreditation: true
    }
  };
}

/**
 * Print any document with organization letterhead
 */
export async function printWithLetterhead(
  contentHTML: string,
  documentTitle: string,
  options: {
    documentId?: string;
    documentDate?: Date | string;
    organizationId?: number;
    organization?: Organization;
    pageSize?: 'A4' | 'A5' | 'A6' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    showFooter?: boolean;
  } = {}
): Promise<void> {
  let organization: Organization | null = null;

  // Use provided organization or fetch it
  if (options.organization) {
    organization = options.organization;
  } else {
    organization = await fetchOrganizationData(options.organizationId);
  }

  // Fallback to default if fetch fails
  if (!organization) {
    organization = getDefaultOrganization();
  }

  printWithOrganizationHeader(
    organization,
    {
      documentTitle,
      documentId: options.documentId,
      documentDate: options.documentDate,
      pageSize: options.pageSize || 'A4',
      orientation: options.orientation || 'portrait',
      showFooter: options.showFooter !== false
    },
    contentHTML
  );
}

/**
 * Generate HTML for printing with organization letterhead (without opening print dialog)
 */
export async function generatePrintHTMLWithLetterhead(
  contentHTML: string,
  documentTitle: string,
  options: {
    documentId?: string;
    documentDate?: Date | string;
    organizationId?: number;
    organization?: Organization;
    pageSize?: 'A4' | 'A5' | 'A6' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    showFooter?: boolean;
  } = {}
): Promise<string> {
  let organization: Organization | null = null;

  // Use provided organization or fetch it
  if (options.organization) {
    organization = options.organization;
  } else {
    organization = await fetchOrganizationData(options.organizationId);
  }

  // Fallback to default if fetch fails
  if (!organization) {
    organization = getDefaultOrganization();
  }

  return generatePrintDocument(
    organization,
    {
      documentTitle,
      documentId: options.documentId,
      documentDate: options.documentDate,
      pageSize: options.pageSize || 'A4',
      orientation: options.orientation || 'portrait',
      showFooter: options.showFooter !== false
    },
    contentHTML
  );
}

/**
 * Open print window with organization letterhead
 */
export async function openPrintWindowWithLetterhead(
  contentHTML: string,
  documentTitle: string,
  options: {
    documentId?: string;
    documentDate?: Date | string;
    organizationId?: number;
    organization?: Organization;
    pageSize?: 'A4' | 'A5' | 'A6' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    showFooter?: boolean;
    autoPrint?: boolean;
  } = {}
): Promise<Window | null> {
  const html = await generatePrintHTMLWithLetterhead(contentHTML, documentTitle, options);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return null;
  }

  // Write the HTML content
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for the window to be ready before printing
  if (options.autoPrint !== false) {
    // Use multiple methods to ensure the window is ready
    const tryPrint = () => {
      try {
        if (printWindow && !printWindow.closed) {
          printWindow.focus();
          printWindow.print();
        }
      } catch (error) {
        console.error('Print error:', error);
      }
    };

    // Method 1: Wait for window to load
    if (printWindow.document.readyState === 'complete') {
      // Already loaded, print immediately
      setTimeout(tryPrint, 100);
    } else {
      // Wait for load event
      printWindow.addEventListener('load', () => {
        setTimeout(tryPrint, 250);
      }, { once: true });
    }

    // Method 2: Fallback timeout (in case load event doesn't fire)
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        tryPrint();
      }
    }, 500);
  }

  return printWindow;
}

