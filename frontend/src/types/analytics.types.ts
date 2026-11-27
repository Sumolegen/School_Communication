export interface StudentAnalyticsResponse {
  studentId: string;
  studentName: string;
  subjectBreakdown: Array<{ subjectName: string; assessmentsCount: number; averagePercentage: number }>;
  termTrend: Array<{ termName: string; percentage: number }>;
}

export interface SubjectPerformanceItem {
  subjectId: string;
  subjectName: string;
  entriesCount: number;
  averagePercentage: number;
  passRate: number;
  highestPercentage: number;
}

export interface ClassPerformanceItem {
  sectionId: string;
  className: string;
  assessmentsEvaluated: number;
  averagePercentage: number;
  passRate: number;
}

export interface AttendancePerformanceResponse {
  month: string;
  bySection: Array<{
    sectionId: string;
    className: string;
    present: number;
    absent: number;
    late: number;
    leave: number;
    total: number;
    attendanceRate: number;
  }>;
  dailyTrend: Array<{ date: string; present: number; absent: number; late: number; leave: number }>;
}
