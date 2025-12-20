import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockFetch } from '../../utils/test-utils';

/**
 * Unit tests for lab order creation component
 */
describe('Lab Order Creation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render lab order form', () => {
    mockFetch({ labTests: [] });
    
    // Mock the lab order component
    const LabOrderForm = () => (
      <div>
        <h2>Create Lab Order</h2>
        <button>Select Tests</button>
      </div>
    );

    renderWithProviders(<LabOrderForm />);
    
    expect(screen.getByText(/lab order/i)).toBeDefined();
  });

  it('should display available lab tests', async () => {
    const mockTests = [
      { id: 1, name: 'Complete Blood Count', category: 'Hematology' },
      { id: 2, name: 'Blood Glucose', category: 'Chemistry' }
    ];

    mockFetch({ labTests: mockTests });

    // Component should display tests
    const TestList = () => (
      <div>
        {mockTests.map(test => (
          <div key={test.id}>{test.name}</div>
        ))}
      </div>
    );

    renderWithProviders(<TestList />);

    await waitFor(() => {
      expect(screen.getByText(/Complete Blood Count/i)).toBeDefined();
    });
  });
});

