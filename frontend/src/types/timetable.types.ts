export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface TimetableEntryItem {
  id: string;
  sectionId: string;
  dayOfWeek: DayOfWeek;
  periodNo: number;
  startTime: string;
  endTime: string;
  subject: { id: string; name: string; code: string };
  teacher: { id: string; user: { id: string; fullName: string } };
  section?: { id: string; name: string; schoolClass?: { name: string } };
}
