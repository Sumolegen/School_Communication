import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AttendanceStatus, RoleCode, TargetScope } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertStudentAccess, calculatePercentage, resolveEffectiveSchoolId, toDateOnly } from '@shared/utils';

@Injectable()
export class StudentDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthUser, studentIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    const today = toDateOnly(new Date());

    const activeStudentId = studentIdParam ?? user.linkedStudentIds[0];
    if (!activeStudentId) {
      return {
        role: user.role,
        student: null,
        siblings: [],
        recentAnnouncements: [],
        homeworkSummary: [],
        upcomingEvents: [],
        attendanceSummary: { present: 0, absent: 0, late: 0, leave: 0, totalMarked: 0, percentage: 100 },
        academicPerformance: { averagePercentage: 0, latestMarks: [] },
        recentAcademicUpdates: [],
        unreadNotificationsCount: 0,
      };
    }

    const accessStu = await assertStudentAccess(this.prisma, user, activeStudentId);

    const [
      student,
      siblings,
      recentAnnouncements,
      homeworkSummary,
      upcomingEvents,
      attendanceRecords,
      latestMarks,
      recentAcademicUpdates,
      unreadNotificationsCount,
      unreadMessagesCount,
    ] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { id: accessStu.id },
        include: {
          section: {
            include: {
              schoolClass: true,
              classTeacher: { include: { user: { select: { id: true, fullName: true } } } },
            },
          },
          academicYear: { select: { id: true, name: true } },
        },
      }),
      user.role === RoleCode.PARENT
        ? this.prisma.parentStudentLink.findMany({
            where: { schoolId, parentUserId: user.userId },
            include: {
              student: {
                include: { section: { include: { schoolClass: true } } },
              },
            },
          })
        : [],
      this.prisma.announcement.findMany({
        where: {
          schoolId,
          OR: [
            { targetScope: TargetScope.ENTIRE_SCHOOL },
            { targetScope: TargetScope.CLASS_SECTION, targets: { some: { sectionId: accessStu.sectionId } } },
            { targetScope: TargetScope.INDIVIDUAL_STUDENTS, targets: { some: { studentId: accessStu.id } } },
          ],
        },
        take: 5,
        orderBy: { publishedAt: 'desc' },
        include: {
          createdBy: { select: { fullName: true } },
          reads: { where: { userId: user.userId }, select: { readAt: true } },
        },
      }),
      this.prisma.homework.findMany({
        where: { schoolId, sectionId: accessStu.sectionId },
        take: 5,
        orderBy: [{ assignedDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          subject: true,
          teacher: { include: { user: { select: { fullName: true } } } },
          attachments: { include: { file: true } },
        },
      }),
      this.prisma.event.findMany({
        where: {
          schoolId,
          eventDate: { gte: today },
          OR: [{ targetScope: TargetScope.ENTIRE_SCHOOL }, { sectionId: accessStu.sectionId }],
        },
        take: 5,
        orderBy: { eventDate: 'asc' },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { schoolId, academicYearId: accessStu.academicYearId, studentId: accessStu.id },
        select: { status: true },
      }),
      this.prisma.examMark.findMany({
        where: { schoolId, studentId: accessStu.id },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          assessment: { include: { subject: true, examTerm: true } },
        },
      }),
      this.prisma.academicUpdate.findMany({
        where: { schoolId, studentId: accessStu.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: { include: { user: { select: { fullName: true } } } },
          examTerm: true,
        },
      }),
      this.prisma.notification.count({
        where: { schoolId, recipientUserId: user.userId, isRead: false },
      }),
      this.prisma.message.count({
        where: { schoolId, receiverUserId: user.userId, isRead: false },
      }),
    ]);

    const att = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const r of attendanceRecords) {
      if (r.status === AttendanceStatus.PRESENT) att.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) att.absent += 1;
      else if (r.status === AttendanceStatus.LATE) att.late += 1;
      else if (r.status === AttendanceStatus.LEAVE) att.leave += 1;
    }
    const totalMarked = attendanceRecords.length;
    const attPct = totalMarked > 0 ? Number((((att.present + att.late) / totalMarked) * 100).toFixed(1)) : 100;

    const obtainedSum = latestMarks.reduce((s, m) => s + m.marksObtained, 0);
    const maxSum = latestMarks.reduce((s, m) => s + m.assessment.maxMarks, 0);

    return {
      role: user.role,
      student,
      siblings: siblings.map((l) => l.student),
      recentAnnouncements: recentAnnouncements.map((a) => ({
        ...a,
        isRead: a.reads.length > 0,
      })),
      homeworkSummary,
      upcomingEvents,
      attendanceSummary: {
        ...att,
        totalMarked,
        percentage: attPct,
      },
      academicPerformance: {
        averagePercentage: calculatePercentage(obtainedSum, maxSum),
        latestMarks,
      },
      recentAcademicUpdates,
      unreadNotificationsCount,
      unreadMessagesCount,
    };
  }
}
