import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AttendanceStatus, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertSectionAccess, getMonthRange, resolveEffectiveSchoolId } from '@shared/utils';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceReport(user: AuthUser, sectionId?: string, month?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    const { start, end } = getMonthRange(month);

    if (sectionId) {
      await assertSectionAccess(this.prisma, user, sectionId);
    }

    const where: Record<string, unknown> = {
      schoolId,
      date: { gte: start, lte: end },
      ...(sectionId ? { sectionId } : {}),
    };

    if (!sectionId && user.role === RoleCode.TEACHER) {
      where.sectionId = { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] };
    } else if (!sectionId && (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT)) {
      where.studentId = { in: user.linkedStudentIds.length ? user.linkedStudentIds : ['__none__'] };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, admissionNo: true, rollNo: true } },
        section: { include: { schoolClass: true } },
      },
      orderBy: { date: 'asc' },
    });

    const totals = { present: 0, absent: 0, late: 0, leave: 0, total: records.length };
    const byStudentMap = new Map<
      string,
      {
        studentId: string;
        fullName: string;
        admissionNo: string;
        sectionName: string;
        present: number;
        absent: number;
        late: number;
        leave: number;
        total: number;
      }
    >();

    for (const r of records) {
      if (r.status === AttendanceStatus.PRESENT) totals.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) totals.absent += 1;
      else if (r.status === AttendanceStatus.LATE) totals.late += 1;
      else if (r.status === AttendanceStatus.LEAVE) totals.leave += 1;

      const existing = byStudentMap.get(r.studentId) ?? {
        studentId: r.studentId,
        fullName: r.student.fullName,
        admissionNo: r.student.admissionNo,
        sectionName: `${r.section.schoolClass.name} - ${r.section.name}`,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        total: 0,
      };
      existing.total += 1;
      if (r.status === AttendanceStatus.PRESENT) existing.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) existing.absent += 1;
      else if (r.status === AttendanceStatus.LATE) existing.late += 1;
      else if (r.status === AttendanceStatus.LEAVE) existing.leave += 1;
      byStudentMap.set(r.studentId, existing);
    }

    const overallPercentage =
      totals.total > 0 ? Number((((totals.present + totals.late) / totals.total) * 100).toFixed(1)) : 100;

    return {
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
      overallPercentage,
      totals,
      students: Array.from(byStudentMap.values()).map((s) => ({
        ...s,
        percentage: s.total > 0 ? Number((((s.present + s.late) / s.total) * 100).toFixed(1)) : 100,
      })),
    };
  }
}
