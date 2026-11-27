import {
  AcademicUpdateItem,
  AssessmentItem,
  ExamMarkItem,
  ExamTermItem,
  ExamTermType,
  GradeScaleItem,
  ReportCardResponse,
  SubjectItem,
} from '@/types';
import { apiClient } from './api';

export const academicsService = {
  // Subjects
  listSubjects: async () => {
    const { data } = await apiClient.get<SubjectItem[]>('/academics/subjects');
    return data;
  },
  createSubject: async (payload: { name: string; code: string }) => {
    const { data } = await apiClient.post<SubjectItem>('/academics/subjects', payload);
    return data;
  },

  // Exam Terms
  listExamTerms: async () => {
    const { data } = await apiClient.get<ExamTermItem[]>('/academics/exams');
    return data;
  },
  createExamTerm: async (payload: {
    name: string;
    termType: ExamTermType;
    startDate: string;
    endDate: string;
  }) => {
    const { data } = await apiClient.post<ExamTermItem>('/academics/exams', payload);
    return data;
  },

  // Assessments
  listAssessments: async (params?: { examTermId?: string; sectionId?: string; subjectId?: string }) => {
    const { data } = await apiClient.get<AssessmentItem[]>('/academics/assessments', { params });
    return data;
  },
  createAssessment: async (payload: {
    examTermId: string;
    sectionId: string;
    subjectId: string;
    title: string;
    maxMarks: number;
    passMarks: number;
    examDate: string;
  }) => {
    const { data } = await apiClient.post<AssessmentItem>('/academics/assessments', payload);
    return data;
  },

  // Grades
  listGradeScales: async () => {
    const { data } = await apiClient.get<GradeScaleItem[]>('/academics/grades');
    return data;
  },
  saveGradeScale: async (payload: {
    gradeLabel: string;
    minPercentage: number;
    maxPercentage: number;
    remarks?: string;
  }) => {
    const { data } = await apiClient.post<GradeScaleItem>('/academics/grades', payload);
    return data;
  },

  // Marks
  listMarks: async (params?: { studentId?: string; termId?: string; assessmentId?: string; sectionId?: string }) => {
    const { data } = await apiClient.get<ExamMarkItem[]>('/marks', { params });
    return data;
  },
  bulkEnterMarks: async (payload: {
    assessmentId: string;
    entries: Array<{ studentId: string; marksObtained: number; remarks?: string }>;
  }) => {
    const { data } = await apiClient.post<{ savedCount: number; marks: ExamMarkItem[] }>('/marks/bulk', payload);
    return data;
  },

  // Academic Updates
  listAcademicUpdates: async (studentId?: string) => {
    const { data } = await apiClient.get<AcademicUpdateItem[]>('/academics/academic-updates', {
      params: studentId ? { studentId } : undefined,
    });
    return data;
  },
  createAcademicUpdate: async (payload: {
    studentId: string;
    examTermId?: string;
    title: string;
    summary: string;
    remarks?: string;
  }) => {
    const { data } = await apiClient.post<AcademicUpdateItem>('/academics/academic-updates', payload);
    return data;
  },

  // Report Cards
  getReportCard: async (studentId: string, termId?: string) => {
    const { data } = await apiClient.get<ReportCardResponse>('/academics/report-cards', {
      params: { studentId, termId },
    });
    return data;
  },

  // Term Performance Comparison
  getTermComparison: async (studentId: string) => {
    const { data } = await apiClient.get<{
      studentId: string;
      studentName: string;
      terms: Array<{
        termId: string;
        termName: string;
        termType: ExamTermType;
        totalObtained: number;
        totalMax: number;
        overallPercentage: number;
        subjects: Array<{
          subjectName: string;
          marksObtained: number;
          maxMarks: number;
          percentage: number;
          grade: string;
          isPassed: boolean;
        }>;
      }>;
    }>('/academics/performance', { params: { studentId } });
    return data;
  },
};
