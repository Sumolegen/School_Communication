import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AuthUser } from '@shared/interfaces';
import { assertStudentAccess, calculatePercentage } from '@shared/utils';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentTermComparison(studentId: string, user: AuthUser) {
    const student = await assertStudentAccess(this.prisma, user, studentId);

    const marks = await this.prisma.examMark.findMany({
      where: { schoolId: student.schoolId, studentId: student.id },
      include: {
        assessment: {
          include: {
            subject: true,
            examTerm: true,
          },
        },
      },
      orderBy: { assessment: { examTerm: { startDate: 'asc' } } },
    });

    const termMap = new Map<
      string,
      {
        termId: string;
        termName: string;
        termType: string;
        totalObtained: number;
        totalMax: number;
        subjects: Array<{
          subjectName: string;
          marksObtained: number;
          maxMarks: number;
          percentage: number;
          grade: string;
          isPassed: boolean;
        }>;
      }
    >();

    for (const m of marks) {
      const term = m.assessment.examTerm;
      const bucket = termMap.get(term.id) ?? {
        termId: term.id,
        termName: term.name,
        termType: term.termType,
        totalObtained: 0,
        totalMax: 0,
        subjects: [],
      };
      bucket.totalObtained += m.marksObtained;
      bucket.totalMax += m.assessment.maxMarks;
      bucket.subjects.push({
        subjectName: m.assessment.subject.name,
        marksObtained: m.marksObtained,
        maxMarks: m.assessment.maxMarks,
        percentage: m.percentage,
        grade: m.grade,
        isPassed: m.isPassed,
      });
      termMap.set(term.id, bucket);
    }

    const terms = Array.from(termMap.values()).map((t) => ({
      ...t,
      overallPercentage: calculatePercentage(t.totalObtained, t.totalMax),
    }));

    return {
      studentId: student.id,
      studentName: student.fullName,
      terms,
    };
  }
}
