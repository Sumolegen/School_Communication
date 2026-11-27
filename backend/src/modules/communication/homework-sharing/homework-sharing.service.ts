import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
  toDateOnly,
} from '@shared/utils';
import { CreateHomeworkDto, HomeworkQueryDto } from './homework-sharing.dto';

@Injectable()
export class HomeworkSharingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async list(query: HomeworkQueryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    let sectionId = query.sectionId ?? query.class_id;

    if (query.studentId) {
      const stu = await assertStudentAccess(this.prisma, user, query.studentId);
      sectionId = stu.sectionId;
    }

    const where: Record<string, unknown> = {
      schoolId,
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.date ? { assignedDate: toDateOnly(query.date) } : {}),
    };

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
      this.prisma.homework.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ assignedDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          section: { include: { schoolClass: true } },
          subject: true,
          teacher: { include: { user: { select: { id: true, fullName: true } } } },
          attachments: {
            include: {
              file: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, publicUrl: true } },
            },
          },
        },
      }),
      this.prisma.homework.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async create(dto: CreateHomeworkDto, user: AuthUser) {
    const section = await assertSectionAccess(this.prisma, user, dto.sectionId, dto.subjectId);
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, schoolId: section.schoolId },
    });
    if (!subject) throw new NotFoundException('Subject not found in this school.');

    let teacherId = user.staffId;
    if (!teacherId) {
      const fallbackStaff = await this.prisma.staffProfile.findFirst({
        where: { schoolId: section.schoolId, isTeacher: true },
        select: { id: true },
      });
      if (!fallbackStaff) {
        throw new BadRequestException('No staff/teacher profile exists to attribute homework.');
      }
      teacherId = fallbackStaff.id;
    }

    const homework = await this.prisma.$transaction(async (tx) => {
      const created = await tx.homework.create({
        data: {
          schoolId: section.schoolId,
          academicYearId: section.academicYearId,
          sectionId: section.id,
          subjectId: subject.id,
          teacherId,
          title: dto.title.trim(),
          instructions: dto.instructions.trim(),
          assignedDate: toDateOnly(dto.assignedDate ?? new Date()),
          dueDate: toDateOnly(dto.dueDate),
          externalLinks: (dto.externalLinks ?? []) as unknown as object,
        },
      });

      if (dto.attachmentFileIds?.length) {
        await tx.homeworkAttachment.createMany({
          data: dto.attachmentFileIds.map((fileId) => ({ homeworkId: created.id, fileId })),
        });
      }

      return tx.homework.findUnique({
        where: { id: created.id },
        include: {
          section: { include: { schoolClass: true } },
          subject: true,
          teacher: { include: { user: { select: { id: true, fullName: true } } } },
          attachments: {
            include: {
              file: { select: { id: true, originalName: true, mimeType: true, publicUrl: true } },
            },
          },
        },
      });
    });

    await this.notificationsService.dispatchToScope({
      schoolId: section.schoolId,
      targetScope: TargetScope.CLASS_SECTION,
      sectionIds: [section.id],
      excludeUserId: user.userId,
      title: `New Homework: ${subject.name}`,
      body: `${dto.title.trim()} (Due: ${dto.dueDate})`,
      category: NotificationCategory.HOMEWORK,
      priority: PriorityLevel.NORMAL,
      referenceType: 'HOMEWORK',
      referenceId: homework!.id,
    });

    return homework;
  }

  async remove(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.homework.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Homework not found.');
    if (user.role === RoleCode.TEACHER && existing.teacherId !== user.staffId) {
      throw new ForbiddenException('Teachers may only delete homework they created.');
    }
    await this.prisma.homework.delete({ where: { id } });
    return { deleted: true, id };
  }
}
