import React, { createContext, useState } from 'react';
import { currentMonthKey } from '@/utils';

export interface AttendanceContextValue {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedSectionId: string;
  setSelectedSectionId: (id: string) => void;
}

export const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [selectedSectionId, setSelectedSectionId] = useState('');

  return (
    <AttendanceContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        selectedSectionId,
        setSelectedSectionId,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};
