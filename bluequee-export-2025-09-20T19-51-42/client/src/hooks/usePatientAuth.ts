import { useState, useEffect, createContext, useContext } from 'react';

interface PatientAuthState {
  token: string | null;
  patient: any | null;
  isAuthenticated: boolean;
  login: (credentials: { patientId: string; phone: string; dateOfBirth: string }) => Promise<void>;
  logout: () => void;
}

const PatientAuthContext = createContext<PatientAuthState | null>(null);

export const usePatientAuth = () => {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error('usePatientAuth must be used within PatientAuthProvider');
  }
  return context;
};

export const usePatientAuthState = () => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('patientToken');
    }
    return null;
  });
  
  const [patient, setPatient] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('patientData');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const isAuthenticated = Boolean(token && patient);

  const login = async (credentials: { patientId: string; phone: string; dateOfBirth: string }) => {
    const response = await fetch('/api/patient-auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    setToken(data.token);
    setPatient(data.patient);
    
    localStorage.setItem('patientToken', data.token);
    localStorage.setItem('patientData', JSON.stringify(data.patient));
  };

  const logout = () => {
    setToken(null);
    setPatient(null);
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientData');
  };

  // Clear auth data if token is expired
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
  }, [token]);

  return {
    token,
    patient,
    isAuthenticated,
    login,
    logout,
  };
};

export { PatientAuthContext };