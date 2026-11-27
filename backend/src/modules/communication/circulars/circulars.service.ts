import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { NotificationCategory, PriorityLevel, RoleCode, TargetScope } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import {
  buildPaginatedResult,
  getStudentOrParentSectionIds,
  normalizePagination,
  resolveEffectiveSchoolId,
  toDateOnly,
} from '@shared/utils';
import { CircularsQueryDto, CreateCircularDto } from './circulars.dto';

@Injectable()
export class CircularsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async list(query: CircularsQueryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Record<string, unknown> = {
      schoolId,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.fromDate || query.toDate
        ? {
            circularDate: {
              ...(query.fromDate ? { gte: toDateOnly(query.fromDate) } : {}),
              ...(query.toDate ? { lte: toDateOnly(query.toDate) } : {}),
            },
          }
        : {}),
    };

    if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const sectionIds = await getStudentOrParentSectionIds(this.prisma, user);
      where.AND = [
        {
          OR: [
            { targetScope: TargetScope.ENTIRE_SCHOOL },
            { sectionId: { in: sectionIds.length ? sectionIds : ['__none__'] } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.circular.findMany({
        where,
        skip,
        take: limit,
        orderBy: { circularDate: 'desc' },
        include: {
          file: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, publicUrl: true } },
          section: { include: { schoolClass: true } },
          publishedBy: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.circular.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async create(dto: CreateCircularDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const file = await this.prisma.fileAsset.findFirst({ where: { id: dto.fileId, schoolId } });
    if (!file) throw new NotFoundException('Circular file attachment not found in this school.');

    const scope = dto.targetScope ?? TargetScope.ENTIRE_SCHOOL;
    const circular = await this.prisma.circular.create({
      data: {
        schoolId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        circularDate: toDateOnly(dto.circularDate),
        fileId: file.id,
        targetScope: scope,
        sectionId: dto.sectionId ?? null,
        publishedById: user.userId,
      },
      include: {
        file: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, publicUrl: true } },
        section: { include: { schoolClass: true } },
      },
    });

    await this.notificationsService.dispatchToScope({
      schoolId,
      targetScope: scope,
      sectionIds: dto.sectionId ? [dto.sectionId] : undefined,
      excludeUserId: user.userId,
      title: `Official Circular: ${circular.title}`,
      body: circular.description ?? 'A new circular has been published.',
      category: NotificationCategory.CIRCULAR,
      priority: PriorityLevel.NORMAL,
      referenceType: 'CIRCULAR',
      referenceId: circular.id,
    });

    return circular;
  }

  async remove(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.circular.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Circular not found.');
    await this.prisma.circular.delete({ where: { id } });
    return { deleted: true, id };
  }
}
