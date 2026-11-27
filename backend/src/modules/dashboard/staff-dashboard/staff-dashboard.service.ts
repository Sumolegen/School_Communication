import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AttendanceStatus } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId, toDateOnly } from '@shared/utils';

@Injectable()
export class StaffDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const today = toDateOnly(new Date());
    const sectionIds = user.assignedSectionIds;

    const [assignments, todayAttendance, recentHomework, recentClassUpdates, upcomingEvents, unreadNotifications, unreadMessages] =
      await Promise.all([
        user.staffId
          ? this.prisma.staffAssignment.findMany({
              where: { schoolId, staffId: user.staffId },
              include: {
                section: {
                  include: {
                    schoolClass: true,
                    _count: { select: { students: true } },
                  },
                },
                subject: true,
              },
            })
          : [],
        sectionIds.length
          ? this.prisma.attendanceRecord.findMany({
              where: { schoolId, sectionId: { in: sectionIds }, date: today },
              select: { status: true, sectionId: true },
            })
          : [],
        sectionIds.length
          ? this.prisma.homework.findMany({
              where: { schoolId, sectionId: { in: sectionIds } },
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                section: { include: { schoolClass: true } },
                subject: true,
              },
            })
          : [],
        sectionIds.length
          ? this.prisma.classUpdate.findMany({
              where: { schoolId, sectionId: { in: sectionIds } },
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                section: { include: { schoolClass: true } },
              },
            })
          : [],
        this.prisma.event.findMany({
          where: { schoolId, eventDate: { gte: today } },
          take: 5,
          orderBy: { eventDate: 'asc' },
        }),
        this.prisma.notification.count({
          where: { schoolId, recipientUserId: user.userId, isRead: false },
        }),
        this.prisma.message.count({
          where: { schoolId, receiverUserId: user.userId, isRead: false },
        }),
      ]);

    const assignedClassesMap = new Map<string, { sectionId: string; label: string; studentCount: number; isClassTeacher: boolean }>();
    const assignedSubjectsMap = new Map<string, { subjectId: string; name: string; code: string }>();

    for (const a of assignments) {
      assignedClassesMap.set(a.sectionId, {
        sectionId: a.sectionId,
        label: `${a.section.schoolClass.name} - ${a.section.name}`,
        studentCount: a.section._count.students,
        isClassTeacher: a.isClassTeacher,
      });
      if (a.subject) {
        assignedSubjectsMap.set(a.subject.id, {
          subjectId: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
        });
      }
    }

    const attCounts = { present: 0, absent: 0, late: 0, leave: 0, total: todayAttendance.length };
    for (const r of todayAttendance) {
      if (r.status === AttendanceStatus.PRESENT) attCounts.present += 1;
      else if (r.status === AttendanceStatus.ABSENT) attCounts.absent += 1;
      else if (r.status === AttendanceStatus.LATE) attCounts.late += 1;
      else if (r.status === AttendanceStatus.LEAVE) attCounts.leave += 1;
    }

    return {
      role: user.role,
      assignedClasses: Array.from(assignedClassesMap.values()),
      assignedSubjects: Array.from(assignedSubjectsMap.values()),
      dailyAttendance: {
        date: today.toISOString().split('T')[0],
        ...attCounts,
      },
      recentHomework,
      recentClassUpdates,
      upcomingEvents,
      unreadNotificationsCount: unreadNotifications,
      unreadMessagesCount: unreadMessages,
    };
  }
}
