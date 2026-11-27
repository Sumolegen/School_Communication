import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertSectionAccess, getStudentOrParentSectionIds, resolveEffectiveSchoolId } from '@shared/utils';

@Injectable()
export class SubjectPerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(user: AuthUser, sectionId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    if (sectionId) {
      await assertSectionAccess(this.prisma, user, sectionId);
    }

    const assessmentFilter: Record<string, unknown> = { schoolId };
    if (sectionId) {
      assessmentFilter.sectionId = sectionId;
    } else if (user.role === RoleCode.TEACHER) {
      assessmentFilter.sectionId = { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] };
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const allowed = await getStudentOrParentSectionIds(this.prisma, user);
      assessmentFilter.sectionId = { in: allowed.length ? allowed : ['__none__'] };
    }

    const marks = await this.prisma.examMark.findMany({
      where: {
        schoolId,
        assessment: assessmentFilter,
        ...(user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT
          ? { studentId: { in: user.linkedStudentIds.length ? user.linkedStudentIds : ['__none__'] } }
          : {}),
      },
      include: {
        assessment: { include: { subject: true } },
      },
    });

    const subjectMap = new Map<
      string,
      { subjectId: string; subjectName: string; totalPct: number; count: number; passed: number; highest: number }
    >();

    for (const m of marks) {
      const s = m.assessment.subject;
      const bucket = subjectMap.get(s.id) ?? {
        subjectId: s.id,
        subjectName: s.name,
        totalPct: 0,
        count: 0,
        passed: 0,
        highest: 0,
      };
      bucket.totalPct += m.percentage;
      bucket.count += 1;
      if (m.isPassed) bucket.passed += 1;
      if (m.percentage > bucket.highest) bucket.highest = m.percentage;
      subjectMap.set(s.id, bucket);
    }

    return Array.from(subjectMap.values()).map((b) => ({
      subjectId: b.subjectId,
      subjectName: b.subjectName,
      entriesCount: b.count,
      averagePercentage: b.count > 0 ? Number((b.totalPct / b.count).toFixed(1)) : 0,
      passRate: b.count > 0 ? Number(((b.passed / b.count) * 100).toFixed(1)) : 0,
      highestPercentage: b.highest,
    }));
  }
}
