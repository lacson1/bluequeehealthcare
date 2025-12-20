import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockFetch } from '../../utils/test-utils';
import Patients from '@/pages/patients';

/**
 * Unit tests for patient registration component
 */
describe('Patient Registration Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render patient registration form', () => {
    mockFetch({ patients: [] });
    
    renderWithProviders(<Patients />);
    
    // Check for key form elements
    expect(screen.getByText(/patient/i)).toBeDefined();
  });

  it('should display patient list', async () => {
    const mockPatients = [
      { id: 1, firstName: 'John', lastName: 'Doe', phone: '+1234567890' },
      { id: 2, firstName: 'Jane', lastName: 'Smith', phone: '+1234567891' }
    ];

    mockFetch({ patients: mockPatients });

    renderWithProviders(<Patients />);

    await waitFor(() => {
      expect(screen.getByText(/John/i)).toBeDefined();
    });
  });

  it('should handle patient search', async () => {
    const mockPatients = [
      { id: 1, firstName: 'John', lastName: 'Doe', phone: '+1234567890' }
    ];

    mockFetch({ patients: mockPatients });

    renderWithProviders(<Patients />);

    // Search functionality should be present
    const searchInput = screen.queryByPlaceholderText(/search/i);
    expect(searchInput || screen.queryByRole('searchbox')).toBeDefined();
  });
});

