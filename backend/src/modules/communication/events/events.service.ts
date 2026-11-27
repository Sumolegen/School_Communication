import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { NotificationCategory, PriorityLevel, RoleCode, TargetScope } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import {
  getMonthRange,
  getStudentOrParentSectionIds,
  resolveEffectiveSchoolId,
  toDateOnly,
} from '@shared/utils';
import { CreateEventDto, EventsQueryDto } from './events.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async list(query: EventsQueryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const where: Record<string, unknown> = {
      schoolId,
      ...(query.eventType ? { eventType: query.eventType } : {}),
    };

    if (query.month) {
      const { start, end } = getMonthRange(query.month);
      where.eventDate = { gte: start, lte: end };
    }

    if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const sectionIds = await getStudentOrParentSectionIds(this.prisma, user);
      where.OR = [
        { targetScope: TargetScope.ENTIRE_SCHOOL },
        { sectionId: { in: sectionIds.length ? sectionIds : ['__none__'] } },
      ];
    }

    return this.prisma.event.findMany({
      where,
      include: {
        section: { include: { schoolClass: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { eventDate: 'asc' },
    });
  }

  async create(dto: CreateEventDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    });
    if (!academicYear) {
      throw new BadRequestException('No active academic year found for this school.');
    }

    const scope = dto.targetScope ?? TargetScope.ENTIRE_SCHOOL;
    const event = await this.prisma.event.create({
      data: {
        schoolId,
        academicYearId: academicYear.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        eventType: dto.eventType,
        eventDate: toDateOnly(dto.eventDate),
        endDate: dto.endDate ? toDateOnly(dto.endDate) : null,
        targetScope: scope,
        sectionId: dto.sectionId ?? null,
        createdById: user.userId,
      },
      include: {
        section: { include: { schoolClass: true } },
      },
    });

    await this.notificationsService.dispatchToScope({
      schoolId,
      targetScope: scope,
      sectionIds: dto.sectionId ? [dto.sectionId] : undefined,
      excludeUserId: user.userId,
      title: `Calendar Update: ${event.title}`,
      body: `${event.eventType} scheduled on ${dto.eventDate}`,
      category: NotificationCategory.EVENT,
      priority: PriorityLevel.NORMAL,
      referenceType: 'EVENT',
      referenceId: event.id,
    });

    return event;
  }

  async remove(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.event.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Event not found.');
    await this.prisma.event.delete({ where: { id } });
    return { deleted: true, id };
  }
}
