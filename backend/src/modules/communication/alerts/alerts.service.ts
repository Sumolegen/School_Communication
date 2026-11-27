import { Injectable } from '@nestjs/common';
import { AnnouncementKind, PriorityLevel } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { AnnouncementsService } from '../announcements/announcements.service';
import { CreateAlertDto } from './alerts.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  list(user: AuthUser, page?: number, limit?: number, studentId?: string) {
    return this.announcementsService.list(
      { kind: AnnouncementKind.ALERT, page, limit, studentId },
      user,
    );
  }

  create(dto: CreateAlertDto, user: AuthUser) {
    return this.announcementsService.create(
      {
        ...dto,
        kind: AnnouncementKind.ALERT,
        priority: dto.priority ?? PriorityLevel.URGENT,
      },
      user,
    );
  }
}
