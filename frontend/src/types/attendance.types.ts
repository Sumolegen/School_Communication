export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export interface AttendanceRecordItem {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string | null;
}

export interface AttendanceRosterItem {
  studentId: string;
  admissionNo: string;
  fullName: string;
  rollNo?: string | null;
  status: AttendanceStatus;
  remarks: string;
}

export interface StudentAttendanceResponse {
  studentId: string;
  studentName: string;
  month: string;
  overallSummary: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    totalMarked: number;
    percentage: number;
  };
  records: AttendanceRecordItem[];
  holidays: Array<{ id: string; title: string; eventDate: string; endDate?: string | null }>;
}
