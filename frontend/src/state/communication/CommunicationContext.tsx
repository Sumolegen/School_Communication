import React, { createContext, useState } from 'react';
import { AnnouncementItem, HomeworkItem } from '@/types';

export interface CommunicationContextValue {
  announcements: AnnouncementItem[];
  setAnnouncements: (items: AnnouncementItem[]) => void;
  homeworkList: HomeworkItem[];
  setHomeworkList: (items: HomeworkItem[]) => void;
  selectedSectionId: string;
  setSelectedSectionId: (id: string) => void;
}

export const CommunicationContext = createContext<CommunicationContextValue | null>(null);

export const CommunicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');

  return (
    <CommunicationContext.Provider
      value={{
        announcements,
        setAnnouncements,
        homeworkList,
        setHomeworkList,
        selectedSectionId,
        setSelectedSectionId,
      }}
    >
      {children}
    </CommunicationContext.Provider>
  );
};
