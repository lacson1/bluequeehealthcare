import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => 
        s.key.toLowerCase() === event.key.toLowerCase() &&
        !!s.ctrlKey === event.ctrlKey &&
        !!s.shiftKey === event.shiftKey &&
        !!s.altKey === event.altKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useGlobalShortcuts() {
  const [, setLocation] = useLocation();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        // Trigger new patient modal
        const event = new CustomEvent('open-patient-modal');
        window.dispatchEvent(event);
      },
      description: 'New Patient Registration'
    },
    {
      key: 'v',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        // Trigger quick visit recording
        const event = new CustomEvent('open-visit-modal');
        window.dispatchEvent(event);
      },
      description: 'Quick Visit Recording'
    },
    {
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      action: () => setLocation('/lab-orders'),
      description: 'Lab Orders'
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        // Trigger prescription modal
        const event = new CustomEvent('open-prescription-modal');
        window.dispatchEvent(event);
      },
      description: 'New Prescription'
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Focus global search
        const searchInput = document.querySelector('[data-global-search]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Global Search'
    },
    {
      key: 'm',
      ctrlKey: true,
      shiftKey: true,
      action: () => setLocation('/staff-messages'),
      description: 'Staff Messages'
    },
    {
      key: '1',
      altKey: true,
      action: () => setLocation('/dashboard'),
      description: 'Dashboard'
    },
    {
      key: '2',
      altKey: true,
      action: () => setLocation('/patients'),
      description: 'Patients'
    },
    {
      key: '3',
      altKey: true,
      action: () => setLocation('/appointments'),
      description: 'Appointments'
    },
    {
      key: '4',
      altKey: true,
      action: () => setLocation('/lab-results'),
      description: 'Lab Results'
    },
    {
      key: '5',
      altKey: true,
      action: () => setLocation('/pharmacy'),
      description: 'Pharmacy'
    }
  ];

  useKeyboardShortcuts(shortcuts);
  
  return shortcuts;
}