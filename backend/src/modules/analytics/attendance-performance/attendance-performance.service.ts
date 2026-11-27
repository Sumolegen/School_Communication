import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AttendanceStatus, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { getMonthRange, resolveEffectiveSchoolId } from '@shared/utils';

@Injectable()
export class AttendancePerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(user: AuthUser, month?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    const { start, end } = getMonthRange(month);

    const where: Record<string, unknown> = {
      schoolId,
      date: { gte: start, lte: end },
    };

    if (user.role === RoleCode.TEACHER) {
      where.sectionId = { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] };
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      where.studentId = { in: user.linkedStudentIds.length ? user.linkedStudentIds : ['__none__'] };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        section: { include: { schoolClass: true } },
      },
      orderBy: { date: 'asc' },
    });

    const sectionStats = new Map<
      string,
      { sectionId: string; className: string; present: number; absent: number; late: number; leave: number; total: number }
    >();
    const dailyStats = new Map<string, { date: string; present: number; absent: number; late: number; leave: number }>();

    for (const r of records) {
      const secBucket = sectionStats.get(r.sectionId) ?? {
        sectionId: r.sectionId,
        className: `${r.section.schoolClass.name} - ${r.section.name}`,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        total: 0,
      };
      secBucket.total += 1;
      if (r.status === AttendanceStatus.PRESENT) secBucket.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) secBucket.absent += 1;
      else if (r.status === AttendanceStatus.LATE) secBucket.late += 1;
      else if (r.status === AttendanceStatus.LEAVE) secBucket.leave += 1;
      sectionStats.set(r.sectionId, secBucket);

      const dateKey = r.date.toISOString().split('T')[0];
      const dayBucket = dailyStats.get(dateKey) ?? { date: dateKey, present: 0, absent: 0, late: 0, leave: 0 };
      if (r.status === AttendanceStatus.PRESENT) dayBucket.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) dayBucket.absent += 1;
      else if (r.status === AttendanceStatus.LATE) dayBucket.late += 1;
      else if (r.status === AttendanceStatus.LEAVE) dayBucket.leave += 1;
      dailyStats.set(dateKey, dayBucket);
    }

    return {
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
      bySection: Array.from(sectionStats.values()).map((s) => ({
        ...s,
        attendanceRate: s.total > 0 ? Number((((s.present + s.late) / s.total) * 100).toFixed(1)) : 100,
      })),
      dailyTrend: Array.from(dailyStats.values()),
    };
  }
}
