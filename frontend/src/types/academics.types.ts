export type ExamTermType = 'UNIT_TEST' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface ExamTermItem {
  id: string;
  name: string;
  termType: ExamTermType;
  startDate: string;
  endDate: string;
}

export interface AssessmentItem {
  id: string;
  examTermId: string;
  sectionId: string;
  subjectId: string;
  title: string;
  maxMarks: number;
  passMarks: number;
  examDate: string;
  examTerm?: ExamTermItem;
  subject?: SubjectItem;
  section?: { id: string; name: string; schoolClass?: { name: string } };
}

export interface GradeScaleItem {
  id: string;
  gradeLabel: string;
  minPercentage: number;
  maxPercentage: number;
  remarks?: string | null;
}

export interface ExamMarkItem {
  id: string;
  assessmentId: string;
  studentId: string;
  marksObtained: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
  remarks?: string | null;
  student?: { id: string; admissionNo: string; fullName: string; rollNo?: string | null };
  assessment?: AssessmentItem;
}

export interface AcademicUpdateItem {
  id: string;
  title: string;
  summary: string;
  remarks?: string | null;
  createdAt: string;
  student?: { id: string; fullName: string; admissionNo: string };
  examTerm?: { id: string; name: string; termType: ExamTermType } | null;
  teacher?: { user: { fullName: string } };
}

export interface ReportCardResponse {
  school: {
    id: string;
    name: string;
    schoolCode: string;
    logoUrl?: string | null;
    primaryColor: string;
    accentColor: string;
    address?: string | null;
    contactPhone?: string | null;
  };
  student: {
    id: string;
    fullName: string;
    admissionNo: string;
    rollNo?: string | null;
    className: string;
    sectionName: string;
    academicYear: string;
  };
  examTerm: { id: string; name: string; termType: ExamTermType } | null;
  subjects: Array<{
    markId: string;
    termName: string;
    termType: ExamTermType;
    subjectName: string;
    subjectCode: string;
    assessmentTitle: string;
    marksObtained: number;
    maxMarks: number;
    passMarks: number;
    percentage: number;
    grade: string;
    isPassed: boolean;
    remarks?: string | null;
  }>;
  summary: {
    totalObtained: number;
    totalMax: number;
    overallPercentage: number;
    overallGrade: string;
    resultStatus: 'PASS' | 'FAIL' | 'PENDING';
    attendancePercentage: number;
    totalAttendanceDays: number;
    presentDays: number;
  };
  generatedAt: string;
}
