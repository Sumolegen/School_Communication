import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AuthUser } from '@shared/interfaces';
import { buildPaginatedResult, normalizePagination, resolveEffectiveSchoolId } from '@shared/utils';
import { NotificationFeedQueryDto } from './communication-notifications.dto';

@Injectable()
export class CommunicationNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: NotificationFeedQueryDto, user: AuthUser) {
    const schoolId = user.schoolId ? resolveEffectiveSchoolId(user) : undefined;
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Record<string, unknown> = {
      recipientUserId: user.userId,
      ...(schoolId ? { schoolId } : {}),
      ...(query.unreadOnly ? { isRead: false } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipientUserId: user.userId, ...(schoolId ? { schoolId } : {}), isRead: false },
      }),
    ]);

    return {
      ...buildPaginatedResult(items, total, page, limit),
      unreadCount,
    };
  }

  async getUnreadCount(user: AuthUser) {
    const count = await this.prisma.notification.count({
      where: {
        recipientUserId: user.userId,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
        isRead: false,
      },
    });
    return { unreadCount: count };
  }

  async markRead(id: string, user: AuthUser) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, recipientUserId: user.userId },
    });
    if (!existing) throw new NotFoundException('Notification not found.');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(user: AuthUser) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientUserId: user.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }
}
