import { AnnouncementItem, ClassUpdateItem, EventItem, HomeworkItem } from './communication.types';
import { ExamMarkItem } from './academics.types';
import { SchoolConfig } from './school.types';
import { StudentRecord } from './students.types';

export interface DashboardSummaryResponse {
  role: string;
  platformMetrics?: {
    totalSchools: number;
    activeSchools: number;
    totalUsers: number;
    totalStudents: number;
  };
  schools?: SchoolConfig[];
  counts?: {
    studentCount: number;
    teacherCount: number;
    classCount: number;
    sectionCount: number;
    unreadNotificationsCount: number;
  };
  attendanceOverview?: {
    date: string;
    present: number;
    absent: number;
    late: number;
    leave: number;
    total: number;
    percentage: number;
  };
  assignedClasses?: Array<{ sectionId: string; label: string; studentCount: number; isClassTeacher: boolean }>;
  assignedSubjects?: Array<{ subjectId: string; name: string; code: string }>;
  dailyAttendance?: { date: string; present: number; absent: number; late: number; leave: number; total: number };
  recentHomework?: HomeworkItem[];
  recentClassUpdates?: ClassUpdateItem[];
  student?: StudentRecord | null;
  siblings?: StudentRecord[];
  recentAnnouncements?: AnnouncementItem[];
  homeworkSummary?: HomeworkItem[];
  upcomingEvents?: EventItem[];
  attendanceSummary?: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    totalMarked: number;
    percentage: number;
  };
  academicPerformance?: {
    averagePercentage: number;
    latestMarks: ExamMarkItem[];
  };
  recentAcademicUpdates?: Array<{ id: string; title: string; summary: string; createdAt: string }>;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
}
