import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { NotificationCategory, PriorityLevel, TargetScope } from '@shared/enums';
import { DispatchNotificationParams, DispatchScopedNotificationParams } from './notifications.dto';

@Injectable()
export class CoreNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async dispatchToUsers(params: DispatchNotificationParams): Promise<{ count: number }> {
    const uniqueRecipientIds = Array.from(new Set(params.recipientUserIds.filter(Boolean)));
    if (uniqueRecipientIds.length === 0) {
      return { count: 0 };
    }

    const result = await this.prisma.notification.createMany({
      data: uniqueRecipientIds.map((recipientUserId) => ({
        schoolId: params.schoolId,
        recipientUserId,
        studentId: params.studentId ?? null,
        title: params.title,
        body: params.body,
        category: params.category,
        priority: params.priority ?? PriorityLevel.NORMAL,
        referenceType: params.referenceType ?? null,
        referenceId: params.referenceId ?? null,
      })),
    });

    return { count: result.count };
  }

  async dispatchToScope(params: DispatchScopedNotificationParams): Promise<{ count: number }> {
    const recipientSet = new Set<string>();

    if (params.targetScope === TargetScope.ENTIRE_SCHOOL) {
      const users = await this.prisma.user.findMany({
        where: { schoolId: params.schoolId, isActive: true },
        select: { id: true },
      });
      for (const u of users) recipientSet.add(u.id);
    } else if (params.targetScope === TargetScope.CLASS_SECTION && params.sectionIds?.length) {
      const students = await this.prisma.studentProfile.findMany({
        where: { schoolId: params.schoolId, sectionId: { in: params.sectionIds }, isActive: true },
        select: {
          userId: true,
          parentLinks: { select: { parentUserId: true } },
        },
      });
      for (const s of students) {
        if (s.userId) recipientSet.add(s.userId);
        for (const link of s.parentLinks) recipientSet.add(link.parentUserId);
      }
    } else if (params.targetScope === TargetScope.INDIVIDUAL_STUDENTS && params.studentIds?.length) {
      const students = await this.prisma.studentProfile.findMany({
        where: { schoolId: params.schoolId, id: { in: params.studentIds }, isActive: true },
        select: {
          userId: true,
          parentLinks: { select: { parentUserId: true } },
        },
      });
      for (const s of students) {
        if (s.userId) recipientSet.add(s.userId);
        for (const link of s.parentLinks) recipientSet.add(link.parentUserId);
      }
    }

    if (params.excludeUserId) {
      recipientSet.delete(params.excludeUserId);
    }

    return this.dispatchToUsers({
      schoolId: params.schoolId,
      recipientUserIds: Array.from(recipientSet),
      title: params.title,
      body: params.body,
      category: params.category,
      priority: params.priority,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
    });
  }

  async notifyParentsOfAbsence(params: {
    schoolId: string;
    absentStudents: Array<{ studentId: string; studentName: string; dateIso: string }>;
  }): Promise<{ count: number }> {
    if (params.absentStudents.length === 0) {
      return { count: 0 };
    }

    const studentIds = params.absentStudents.map((s) => s.studentId);
    const links = await this.prisma.parentStudentLink.findMany({
      where: { schoolId: params.schoolId, studentId: { in: studentIds } },
      select: { parentUserId: true, studentId: true },
    });

    const studentMap = new Map(params.absentStudents.map((s) => [s.studentId, s]));
    const rows = links
      .map((link) => {
        const info = studentMap.get(link.studentId);
        if (!info) return null;
        return {
          schoolId: params.schoolId,
          recipientUserId: link.parentUserId,
          studentId: link.studentId,
          title: `Absence Alert: ${info.studentName}`,
          body: `${info.studentName} was marked absent on ${info.dateIso}. Please contact the school if this requires leave confirmation.`,
          category: NotificationCategory.ABSENCE,
          priority: PriorityLevel.URGENT,
          referenceType: 'ATTENDANCE',
          referenceId: link.studentId,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length === 0) {
      return { count: 0 };
    }

    const created = await this.prisma.notification.createMany({ data: rows });
    return { count: created.count };
  }
}
