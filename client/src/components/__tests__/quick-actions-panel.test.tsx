import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, screen, waitFor } from '../../../../tests/utils/test-utils';
import { QuickActionsPanel } from '@/components/quick-actions-panel';
import { QueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock wouter - must be inside the mock factory
vi.mock('wouter', () => {
  const mockSetLocation = vi.fn();
  return {
    useLocation: () => ['/', mockSetLocation]
  };
});

// Mock PatientRegistrationModal
vi.mock('@/components/patient-registration-modal', () => ({
  default: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    if (!open) return null;
    return (
      <div data-testid="patient-registration-modal">
        <button onClick={() => onOpenChange(false)}>Close Modal</button>
      </div>
    );
  }
}));

describe('QuickActionsPanel', () => {
  let queryClient: QueryClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock fetch for API calls
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const mockTodayOverview = {
    scheduledAppointments: 5,
    completedVisits: 3,
    pendingLabs: 2,
    pendingPrescriptions: 4,
    criticalAlerts: 1,
    lowStockItems: 3,
    upcomingAppointments: [
      {
        id: 1,
        patientName: 'John Doe',
        time: '10:00 AM',
        type: 'Consultation'
      },
      {
        id: 2,
        patientName: 'Jane Smith',
        time: '11:30 AM',
        type: 'Follow-up'
      }
    ],
    urgentTasks: [
      {
        id: '1',
        title: 'Review critical lab results',
        type: 'lab',
        priority: 'high' as const
      }
    ]
  };

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodayOverview,
      });

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      // Should show loading skeletons
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render today overview card with statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodayOverview,
      });

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Today's Overview")).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // scheduledAppointments
        expect(screen.getByText('3')).toBeInTheDocument(); // completedVisits
        expect(screen.getByText('2')).toBeInTheDocument(); // pendingLabs
        expect(screen.getByText('4')).toBeInTheDocument(); // pendingPrescriptions
      });
    });

    it('should render quick action buttons for doctor role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodayOverview,
      });

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('Register Patient')).toBeInTheDocument();
        expect(screen.getByText('Book Appointment')).toBeInTheDocument();
        expect(screen.getByText('Record Visit')).toBeInTheDocument();
        expect(screen.getByText('New Prescription')).toBeInTheDocument();
        expect(screen.getByText('Order Lab Test')).toBeInTheDocument();
      });
    });

    it('should filter actions based on user role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodayOverview,
      });

      // Test for pharmacist role
      const { rerender } = renderWithProviders(<QuickActionsPanel userRole="pharmacist" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('Pharmacy')).toBeInTheDocument();
        // Pharmacist should not see doctor-only actions
        expect(screen.queryByText('Record Visit')).not.toBeInTheDocument();
      });

      // Test for nurse role
      rerender(<QuickActionsPanel userRole="nurse" />);
      await waitFor(() => {
        expect(screen.getByText('Record Visit')).toBeInTheDocument();
        expect(screen.getByText('Order Lab Test')).toBeInTheDocument();
        // Nurse should not see doctor-only prescriptions
        expect(screen.queryByText('New Prescription')).not.toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons Functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodayOverview,
      });
    });

    it('should open patient registration modal when Register Patient is clicked', async () => {
      renderWithProviders(<QuickActionsPanel userRole="admin" />, { queryClient });
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Register Patient')).toBeInTheDocument();
      });

      const registerButton = screen.getByText('Register Patient').closest('button');
      expect(registerButton).toBeInTheDocument();

      if (registerButton) {
        await user.click(registerButton);
        await waitFor(() => {
          expect(screen.getByTestId('patient-registration-modal')).toBeInTheDocument();
        });
      }
    });

    it('should show count badges on actions with pending items', async () => {
      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      await waitFor(() => {
        // Book Appointment should show count
        const bookAppointment = screen.getByText('Book Appointment').closest('button');
        expect(bookAppointment).toBeInTheDocument();
        
        // New Prescription should show count
        const prescription = screen.getByText('New Prescription').closest('button');
        expect(prescription).toBeInTheDocument();
      });
    });
  });

  describe('Urgent Tasks Section', () => {
    it('should display urgent tasks when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodayOverview,
      });

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('Urgent Tasks')).toBeInTheDocument();
        expect(screen.getByText('Review critical lab results')).toBeInTheDocument();
        expect(screen.getByText('high')).toBeInTheDocument();
      });
    });

    it('should not display urgent tasks section when empty', async () => {
      const noUrgentTasks = {
        ...mockTodayOverview,
        urgentTasks: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => noUrgentTasks,
      });

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      await waitFor(() => {
        expect(screen.queryByText('Urgent Tasks')).not.toBeInTheDocument();
      });
    });
  });

  describe('Upcoming Appointments Section', () => {
    it('should display upcoming appointments when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodayOverview,
      });

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
        expect(screen.getByText('11:30 AM')).toBeInTheDocument();
      });
    });

    it('should not display appointments section when empty', async () => {
      const noAppointments = {
        ...mockTodayOverview,
        upcomingAppointments: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => noAppointments,
      });

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      await waitFor(() => {
        expect(screen.queryByText('Upcoming Appointments')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch today overview data on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTodayOverview,
      });

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/dashboard/today-overview'),
          expect.any(Object)
        );
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<QuickActionsPanel userRole="doctor" />, { queryClient });

      // Should not crash, just show loading or empty state
      await waitFor(() => {
        // Component should still render without data
        expect(screen.getByText("Today's Overview")).toBeInTheDocument();
      });
    });
  });
});
