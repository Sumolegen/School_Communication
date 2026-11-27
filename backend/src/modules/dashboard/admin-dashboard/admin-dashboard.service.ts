import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AttendanceStatus, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId, toDateOnly } from '@shared/utils';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthUser) {
    if (user.role === RoleCode.SUPER_ADMIN) {
      const [totalSchools, activeSchools, totalUsers, totalStudents, schools] = await Promise.all([
        this.prisma.school.count(),
        this.prisma.school.count({ where: { isActive: true, subscriptionStatus: 'ACTIVE' } }),
        this.prisma.user.count(),
        this.prisma.studentProfile.count(),
        this.prisma.school.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { students: true, users: true, classes: true } } },
        }),
      ]);

      return {
        role: user.role,
        platformMetrics: {
          totalSchools,
          activeSchools,
          totalUsers,
          totalStudents,
        },
        schools,
      };
    }

    const schoolId = resolveEffectiveSchoolId(user);
    const today = toDateOnly(new Date());

    const [
      studentCount,
      teacherCount,
      classCount,
      sectionCount,
      todayAttendance,
      recentAnnouncements,
      upcomingEvents,
      unreadNotificationsCount,
      classes,
    ] = await Promise.all([
      this.prisma.studentProfile.count({ where: { schoolId, isActive: true } }),
      this.prisma.staffProfile.count({ where: { schoolId, isTeacher: true, isActive: true } }),
      this.prisma.schoolClass.count({ where: { schoolId } }),
      this.prisma.section.count({ where: { schoolId } }),
      this.prisma.attendanceRecord.findMany({
        where: { schoolId, date: today },
        select: { status: true },
      }),
      this.prisma.announcement.findMany({
        where: { schoolId },
        take: 5,
        orderBy: { publishedAt: 'desc' },
        include: { createdBy: { select: { fullName: true } } },
      }),
      this.prisma.event.findMany({
        where: { schoolId, eventDate: { gte: today } },
        take: 5,
        orderBy: { eventDate: 'asc' },
      }),
      this.prisma.notification.count({
        where: { schoolId, recipientUserId: user.userId, isRead: false },
      }),
      this.prisma.schoolClass.findMany({
        where: { schoolId },
        orderBy: { displayOrder: 'asc' },
        include: {
          sections: {
            include: { _count: { select: { students: true } } },
          },
        },
      }),
    ]);

    const attCounts = { present: 0, absent: 0, late: 0, leave: 0, total: todayAttendance.length };
    for (const a of todayAttendance) {
      if (a.status === AttendanceStatus.PRESENT) attCounts.present += 1;
      else if (a.status === AttendanceStatus.ABSENT) attCounts.absent += 1;
      else if (a.status === AttendanceStatus.LATE) attCounts.late += 1;
      else if (a.status === AttendanceStatus.LEAVE) attCounts.leave += 1;
    }

    return {
      role: user.role,
      counts: {
        studentCount,
        teacherCount,
        classCount,
        sectionCount,
        unreadNotificationsCount,
      },
      attendanceOverview: {
        date: today.toISOString().split('T')[0],
        ...attCounts,
        percentage:
          attCounts.total > 0
            ? Number((((attCounts.present + attCounts.late) / attCounts.total) * 100).toFixed(1))
            : 100,
      },
      classes,
      recentAnnouncements,
      upcomingEvents,
    };
  }
}
