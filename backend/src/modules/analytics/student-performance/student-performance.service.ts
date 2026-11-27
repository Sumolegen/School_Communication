import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AuthUser } from '@shared/interfaces';
import { assertStudentAccess, calculatePercentage } from '@shared/utils';

@Injectable()
export class StudentPerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(studentIdParam: string | undefined, user: AuthUser) {
    const studentId = studentIdParam ?? user.linkedStudentIds[0];
    if (!studentId) throw new BadRequestException('studentId is required.');

    const student = await assertStudentAccess(this.prisma, user, studentId);

    const marks = await this.prisma.examMark.findMany({
      where: { schoolId: student.schoolId, studentId: student.id },
      include: {
        assessment: { include: { subject: true, examTerm: true } },
      },
      orderBy: { assessment: { examDate: 'asc' } },
    });

    const subjectAveragesMap = new Map<string, { subjectName: string; obtained: number; max: number; count: number }>();
    const termTrendsMap = new Map<string, { termName: string; obtained: number; max: number }>();

    for (const m of marks) {
      const subj = m.assessment.subject.name;
      const sBucket = subjectAveragesMap.get(subj) ?? { subjectName: subj, obtained: 0, max: 0, count: 0 };
      sBucket.obtained += m.marksObtained;
      sBucket.max += m.assessment.maxMarks;
      sBucket.count += 1;
      subjectAveragesMap.set(subj, sBucket);

      const termName = m.assessment.examTerm.name;
      const tBucket = termTrendsMap.get(termName) ?? { termName, obtained: 0, max: 0 };
      tBucket.obtained += m.marksObtained;
      tBucket.max += m.assessment.maxMarks;
      termTrendsMap.set(termName, tBucket);
    }

    return {
      studentId: student.id,
      studentName: student.fullName,
      subjectBreakdown: Array.from(subjectAveragesMap.values()).map((s) => ({
        subjectName: s.subjectName,
        assessmentsCount: s.count,
        averagePercentage: calculatePercentage(s.obtained, s.max),
      })),
      termTrend: Array.from(termTrendsMap.values()).map((t) => ({
        termName: t.termName,
        percentage: calculatePercentage(t.obtained, t.max),
      })),
    };
  }
}
