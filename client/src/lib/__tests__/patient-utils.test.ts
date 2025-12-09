import { describe, it, expect } from 'vitest';
import { formatPatientName, getPatientInitials, formatStaffName, getStaffInitials } from '../patient-utils';

describe('patient-utils', () => {
  describe('formatPatientName', () => {
    it('should format patient name with first and last name', () => {
      const patient = {
        firstName: 'John',
        lastName: 'Doe',
      };
      expect(formatPatientName(patient)).toBe('John Doe');
    });

    it('should handle missing last name', () => {
      const patient = {
        firstName: 'John',
        lastName: '',
      };
      expect(formatPatientName(patient)).toBe('John ');
    });

    it('should handle missing first name', () => {
      const patient = {
        firstName: '',
        lastName: 'Doe',
      };
      expect(formatPatientName(patient)).toBe(' Doe');
    });

    it('should handle title prefix', () => {
      const patient = {
        title: 'Dr.',
        firstName: 'John',
        lastName: 'Doe',
      };
      expect(formatPatientName(patient)).toBe('Dr. John Doe');
    });

    it('should handle null title', () => {
      const patient = {
        title: null,
        firstName: 'John',
        lastName: 'Doe',
      };
      expect(formatPatientName(patient)).toBe('John Doe');
    });
  });

  describe('getPatientInitials', () => {
    it('should return initials from first and last name', () => {
      const patient = {
        firstName: 'John',
        lastName: 'Doe',
      };
      expect(getPatientInitials(patient)).toBe('JD');
    });

    it('should handle single name', () => {
      const patient = {
        firstName: 'John',
        lastName: '',
      };
      expect(getPatientInitials(patient)).toBe('J');
    });

    it('should handle empty names', () => {
      const patient = {
        firstName: '',
        lastName: '',
      };
      expect(getPatientInitials(patient)).toBe('');
    });
  });

  describe('formatStaffName', () => {
    it('should format staff name with first and last name', () => {
      const staff = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      expect(formatStaffName(staff)).toBe('Jane Smith');
    });

    it('should add Dr. prefix for doctors', () => {
      const staff = {
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'doctor',
      };
      expect(formatStaffName(staff)).toBe('Dr. Jane Smith');
    });

    it('should fallback to username if no name', () => {
      const staff = {
        username: 'jdoe',
      };
      expect(formatStaffName(staff)).toBe('jdoe');
    });

    it('should return default if no name or username', () => {
      const staff = {};
      expect(formatStaffName(staff)).toBe('Healthcare Staff');
    });
  });

  describe('getStaffInitials', () => {
    it('should return initials from first and last name', () => {
      const staff = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      expect(getStaffInitials(staff)).toBe('JS');
    });

    it('should fallback to username initials', () => {
      const staff = {
        username: 'jdoe',
      };
      expect(getStaffInitials(staff)).toBe('JD');
    });

    it('should return default if no name or username', () => {
      const staff = {};
      expect(getStaffInitials(staff)).toBe('HS');
    });
  });
});

