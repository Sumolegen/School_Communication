import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { AttendanceStatus, EventType } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import {
  assertSectionAccess,
  assertStudentAccess,
  formatIsoDate,
  getMonthRange,
  resolveEffectiveSchoolId,
  toDateOnly,
} from '@shared/utils';
import { BulkAttendanceDto } from './records.dto';

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async getSectionRosterForDate(sectionId: string, dateStr: string | undefined, user: AuthUser) {
    const section = await assertSectionAccess(this.prisma, user, sectionId);
    const targetDate = toDateOnly(dateStr ?? new Date());

    const [students, existingRecords] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where: { schoolId: section.schoolId, sectionId: section.id, isActive: true },
        orderBy: [{ rollNo: 'asc' }, { fullName: 'asc' }],
        select: { id: true, admissionNo: true, fullName: true, rollNo: true },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { schoolId: section.schoolId, sectionId: section.id, date: targetDate },
      }),
    ]);

    const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));

    return {
      sectionId: section.id,
      date: formatIsoDate(targetDate),
      alreadySubmitted: existingRecords.length > 0,
      students: students.map((stu) => {
        const rec = recordMap.get(stu.id);
        return {
          studentId: stu.id,
          admissionNo: stu.admissionNo,
          fullName: stu.fullName,
          rollNo: stu.rollNo,
          status: rec?.status ?? AttendanceStatus.PRESENT,
          remarks: rec?.remarks ?? '',
        };
      }),
    };
  }

  async markBulk(dto: BulkAttendanceDto, user: AuthUser) {
    const section = await assertSectionAccess(this.prisma, user, dto.sectionId);
    const targetDate = toDateOnly(dto.date);
    const dateIso = formatIsoDate(targetDate);

    const validStudents = await this.prisma.studentProfile.findMany({
      where: {
        schoolId: section.schoolId,
        sectionId: section.id,
        id: { in: dto.records.map((r) => r.studentId) },
      },
      select: { id: true, fullName: true },
    });

    const studentNameMap = new Map(validStudents.map((s) => [s.id, s.fullName]));
    if (studentNameMap.size !== new Set(dto.records.map((r) => r.studentId)).size) {
      throw new BadRequestException('One or more students do not belong to the specified class section.');
    }

    const saved = await this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const entry of dto.records) {
        const upserted = await tx.attendanceRecord.upsert({
          where: { studentId_date: { studentId: entry.studentId, date: targetDate } },
          update: {
            status: entry.status,
            remarks: entry.remarks ?? null,
            markedById: user.userId,
          },
          create: {
            schoolId: section.schoolId,
            academicYearId: section.academicYearId,
            sectionId: section.id,
            studentId: entry.studentId,
            date: targetDate,
            status: entry.status,
            markedById: user.userId,
            remarks: entry.remarks ?? null,
          },
        });
        results.push(upserted);
      }
      return results;
    });

    const absentStudents = dto.records
      .filter((r) => r.status === AttendanceStatus.ABSENT)
      .map((r) => ({
        studentId: r.studentId,
        studentName: studentNameMap.get(r.studentId) ?? 'Student',
        dateIso,
      }));

    const alertSummary = await this.notificationsService.notifyParentsOfAbsence({
      schoolId: section.schoolId,
      absentStudents,
    });

    return {
      date: dateIso,
      sectionId: section.id,
      savedCount: saved.length,
      absentCount: absentStudents.length,
      absenceAlertsSent: alertSummary.count,
      records: saved,
    };
  }

  async getStudentAttendance(studentId: string, monthInput: string | undefined, user: AuthUser) {
    const student = await assertStudentAccess(this.prisma, user, studentId);
    const { start, end } = getMonthRange(monthInput);

    const [monthlyRecords, overallRecords, holidays] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: {
          schoolId: student.schoolId,
          studentId: student.id,
          date: { gte: start, lte: end },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          schoolId: student.schoolId,
          academicYearId: student.academicYearId,
          studentId: student.id,
        },
        select: { status: true },
      }),
      this.prisma.event.findMany({
        where: {
          schoolId: student.schoolId,
          eventType: EventType.HOLIDAY,
          eventDate: { gte: start, lte: end },
        },
        select: { id: true, title: true, eventDate: true, endDate: true },
      }),
    ]);

    const summary = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const r of overallRecords) {
      if (r.status === AttendanceStatus.PRESENT) summary.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) summary.absent += 1;
      else if (r.status === AttendanceStatus.LATE) summary.late += 1;
      else if (r.status === AttendanceStatus.LEAVE) summary.leave += 1;
    }

    const totalMarked = overallRecords.length;
    const attendedDays = summary.present + summary.late;
    const percentage = totalMarked > 0 ? Number(((attendedDays / totalMarked) * 100).toFixed(1)) : 100;

    return {
      studentId: student.id,
      studentName: student.fullName,
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
      overallSummary: {
        ...summary,
        totalMarked,
        percentage,
      },
      records: monthlyRecords,
      holidays,
    };
  }

  async getSectionHistory(sectionId: string, monthInput: string | undefined, user: AuthUser) {
    const section = await assertSectionAccess(this.prisma, user, sectionId);
    const { start, end } = getMonthRange(monthInput);

    return this.prisma.attendanceRecord.findMany({
      where: {
        schoolId: section.schoolId,
        sectionId: section.id,
        date: { gte: start, lte: end },
      },
      include: {
        student: { select: { id: true, admissionNo: true, fullName: true, rollNo: true } },
      },
      orderBy: [{ date: 'desc' }, { student: { rollNo: 'asc' } }],
    });
  }
}
