import React, { ReactNode } from 'react';
import { PatientAuthContext, usePatientAuthState } from '@/hooks/usePatientAuth';

interface PatientAuthProviderProps {
  children: ReactNode;
}

export const PatientAuthProvider: React.FC<PatientAuthProviderProps> = ({ children }) => {
  const authState = usePatientAuthState();

  return (
    <PatientAuthContext.Provider value={authState}>
      {children}
    </PatientAuthContext.Provider>
  );
};