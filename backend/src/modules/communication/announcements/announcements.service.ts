import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { AnnouncementKind, NotificationCategory, PriorityLevel, RoleCode, TargetScope } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import {
  buildPaginatedResult,
  getStudentOrParentSectionIds,
  normalizePagination,
  resolveEffectiveSchoolId,
} from '@shared/utils';
import { AnnouncementsQueryDto, CreateAnnouncementDto } from './announcements.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async list(query: AnnouncementsQueryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Record<string, unknown> = {
      schoolId,
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };

    if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      let targetStudentIds = user.linkedStudentIds;
      let targetSectionIds = await getStudentOrParentSectionIds(this.prisma, user);

      if (query.studentId && user.linkedStudentIds.includes(query.studentId)) {
        const stu = await this.prisma.studentProfile.findUnique({
          where: { id: query.studentId },
          select: { id: true, sectionId: true },
        });
        if (stu) {
          targetStudentIds = [stu.id];
          targetSectionIds = [stu.sectionId];
        }
      }

      where.OR = [
        { targetScope: TargetScope.ENTIRE_SCHOOL },
        {
          targetScope: TargetScope.CLASS_SECTION,
          targets: { some: { sectionId: { in: targetSectionIds.length ? targetSectionIds : ['__none__'] } } },
        },
        {
          targetScope: TargetScope.INDIVIDUAL_STUDENTS,
          targets: { some: { studentId: { in: targetStudentIds.length ? targetStudentIds : ['__none__'] } } },
        },
      ];
    } else if (user.role === RoleCode.TEACHER) {
      where.OR = [
        { createdById: user.userId },
        { targetScope: TargetScope.ENTIRE_SCHOOL },
        {
          targetScope: TargetScope.CLASS_SECTION,
          targets: {
            some: { sectionId: { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] } },
          },
        },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
        include: {
          createdBy: { select: { id: true, fullName: true, role: { select: { code: true, name: true } } } },
          attachmentFile: { select: { id: true, originalName: true, mimeType: true, publicUrl: true } },
          targets: {
            include: {
              section: { include: { schoolClass: true } },
              student: { select: { id: true, fullName: true, admissionNo: true } },
            },
          },
          reads: { where: { userId: user.userId }, select: { readAt: true } },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    const items = rows.map((row) => ({
      ...row,
      isRead: row.reads.length > 0,
      readAt: row.reads[0]?.readAt ?? null,
    }));

    return buildPaginatedResult(items, total, page, limit);
  }

  async create(dto: CreateAnnouncementDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const scope = dto.targetScope ?? TargetScope.ENTIRE_SCHOOL;
    const kind = dto.kind ?? AnnouncementKind.ANNOUNCEMENT;
    const priority = dto.priority ?? PriorityLevel.NORMAL;

    if (user.role === RoleCode.TEACHER) {
      if (scope === TargetScope.ENTIRE_SCHOOL) {
        throw new ForbiddenException('Teachers can target assigned class sections or students, not entire school.');
      }
      if (scope === TargetScope.CLASS_SECTION && dto.sectionIds?.length) {
        const unauthorized = dto.sectionIds.some((id) => !user.assignedSectionIds.includes(id));
        if (unauthorized) {
          throw new ForbiddenException('You can only target your assigned class sections.');
        }
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: {
          schoolId,
          createdById: user.userId,
          title: dto.title.trim(),
          body: dto.body.trim(),
          kind,
          priority,
          targetScope: scope,
          attachmentFileId: dto.attachmentFileId ?? null,
        },
      });

      const targetRows: Array<{
        schoolId: string;
        announcementId: string;
        sectionId?: string;
        studentId?: string;
      }> = [];

      if (scope === TargetScope.CLASS_SECTION && dto.sectionIds?.length) {
        for (const sectionId of dto.sectionIds) {
          targetRows.push({ schoolId, announcementId: announcement.id, sectionId });
        }
      } else if (scope === TargetScope.INDIVIDUAL_STUDENTS && dto.studentIds?.length) {
        for (const studentId of dto.studentIds) {
          targetRows.push({ schoolId, announcementId: announcement.id, studentId });
        }
      }

      if (targetRows.length > 0) {
        await tx.announcementTarget.createMany({ data: targetRows });
      }

      return tx.announcement.findUnique({
        where: { id: announcement.id },
        include: {
          createdBy: { select: { id: true, fullName: true, role: { select: { code: true, name: true } } } },
          attachmentFile: { select: { id: true, originalName: true, mimeType: true, publicUrl: true } },
          targets: true,
        },
      });
    });

    await this.notificationsService.dispatchToScope({
      schoolId,
      targetScope: scope,
      sectionIds: dto.sectionIds,
      studentIds: dto.studentIds,
      excludeUserId: user.userId,
      title: dto.title.trim(),
      body: dto.body.trim(),
      category: kind === AnnouncementKind.ALERT ? NotificationCategory.ALERT : NotificationCategory.ANNOUNCEMENT,
      priority,
      referenceType: kind,
      referenceId: created!.id,
    });

    return created;
  }

  async markAsRead(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const announcement = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!announcement) throw new NotFoundException('Announcement not found.');

    return this.prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId: id, userId: user.userId } },
      update: { readAt: new Date() },
      create: { announcementId: id, userId: user.userId },
    });
  }
}
