import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { getStudentOrParentSectionIds, resolveEffectiveSchoolId } from '@shared/utils';

@Injectable()
export class ClassPerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(user: AuthUser, examTermId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);

    let allowedSections: string[] | null = null;
    if (user.role === RoleCode.TEACHER) {
      allowedSections = user.assignedSectionIds;
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      allowedSections = await getStudentOrParentSectionIds(this.prisma, user);
    }

    const marks = await this.prisma.examMark.findMany({
      where: {
        schoolId,
        assessment: {
          ...(examTermId ? { examTermId } : {}),
          ...(allowedSections !== null
            ? { sectionId: { in: allowedSections.length ? allowedSections : ['__none__'] } }
            : {}),
        },
      },
      include: {
        assessment: {
          include: {
            section: { include: { schoolClass: true } },
          },
        },
      },
    });

    const sectionMap = new Map<
      string,
      { sectionId: string; className: string; totalPct: number; count: number; passed: number }
    >();

    for (const m of marks) {
      const sec = m.assessment.section;
      const bucket = sectionMap.get(sec.id) ?? {
        sectionId: sec.id,
        className: `${sec.schoolClass.name} - ${sec.name}`,
        totalPct: 0,
        count: 0,
        passed: 0,
      };
      bucket.totalPct += m.percentage;
      bucket.count += 1;
      if (m.isPassed) bucket.passed += 1;
      sectionMap.set(sec.id, bucket);
    }

    return Array.from(sectionMap.values()).map((b) => ({
      sectionId: b.sectionId,
      className: b.className,
      assessmentsEvaluated: b.count,
      averagePercentage: b.count > 0 ? Number((b.totalPct / b.count).toFixed(1)) : 0,
      passRate: b.count > 0 ? Number(((b.passed / b.count) * 100).toFixed(1)) : 0,
    }));
  }
}
