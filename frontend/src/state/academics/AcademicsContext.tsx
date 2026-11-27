import React, { createContext, useState } from 'react';

export interface AcademicsContextValue {
  selectedTermId: string;
  setSelectedTermId: (termId: string) => void;
  selectedSectionId: string;
  setSelectedSectionId: (sectionId: string) => void;
}

export const AcademicsContext = createContext<AcademicsContextValue | null>(null);

export const AcademicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTermId, setSelectedTermId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  return (
    <AcademicsContext.Provider
      value={{
        selectedTermId,
        setSelectedTermId,
        selectedSectionId,
        setSelectedSectionId,
      }}
    >
      {children}
    </AcademicsContext.Provider>
  );
};
