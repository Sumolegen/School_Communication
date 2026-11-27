import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { NotificationCategory, PriorityLevel, RoleCode, TargetScope } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import {
  assertSectionAccess,
  assertStudentAccess,
  buildPaginatedResult,
  getStudentOrParentSectionIds,
  normalizePagination,
  resolveEffectiveSchoolId,
} from '@shared/utils';
import { ClassUpdatesQueryDto, CreateClassUpdateDto } from './class-updates.dto';

@Injectable()
export class ClassUpdatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async list(query: ClassUpdatesQueryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    let sectionId = query.sectionId;
    if (query.studentId) {
      const stu = await assertStudentAccess(this.prisma, user, query.studentId);
      sectionId = stu.sectionId;
    }

    const where: Record<string, unknown> = { schoolId };
    if (sectionId) {
      await assertSectionAccess(this.prisma, user, sectionId);
      where.sectionId = sectionId;
    } else if (user.role === RoleCode.TEACHER) {
      where.sectionId = { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] };
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const allowed = await getStudentOrParentSectionIds(this.prisma, user);
      where.sectionId = { in: allowed.length ? allowed : ['__none__'] };
    }

    const [items, total] = await Promise.all([
      this.prisma.classUpdate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          section: { include: { schoolClass: true } },
          teacher: { include: { user: { select: { id: true, fullName: true } } } },
          attachmentFile: { select: { id: true, originalName: true, mimeType: true, publicUrl: true } },
        },
      }),
      this.prisma.classUpdate.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async create(dto: CreateClassUpdateDto, user: AuthUser) {
    const section = await assertSectionAccess(this.prisma, user, dto.sectionId);

    let teacherId = user.staffId;
    if (!teacherId) {
      const fallback = await this.prisma.staffProfile.findFirst({
        where: { schoolId: section.schoolId, isTeacher: true },
        select: { id: true },
      });
      if (!fallback) throw new BadRequestException('No staff profile available for class update.');
      teacherId = fallback.id;
    }

    const created = await this.prisma.classUpdate.create({
      data: {
        schoolId: section.schoolId,
        academicYearId: section.academicYearId,
        sectionId: section.id,
        teacherId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        attachmentFileId: dto.attachmentFileId ?? null,
      },
      include: {
        section: { include: { schoolClass: true } },
        teacher: { include: { user: { select: { id: true, fullName: true } } } },
        attachmentFile: { select: { id: true, originalName: true, mimeType: true, publicUrl: true } },
      },
    });

    await this.notificationsService.dispatchToScope({
      schoolId: section.schoolId,
      targetScope: TargetScope.CLASS_SECTION,
      sectionIds: [section.id],
      excludeUserId: user.userId,
      title: `Class Update: ${created.title}`,
      body: created.content,
      category: NotificationCategory.CLASS_UPDATE,
      priority: PriorityLevel.NORMAL,
      referenceType: 'CLASS_UPDATE',
      referenceId: created.id,
    });

    return created;
  }
}
