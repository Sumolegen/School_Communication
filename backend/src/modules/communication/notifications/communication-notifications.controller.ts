import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AllowCrossTenant } from '@shared/decorators/school-scoped.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { NotificationFeedQueryDto } from './communication-notifications.dto';
import { CommunicationNotificationsService } from './communication-notifications.service';

@Controller('communication/notifications')
export class CommunicationNotificationsController {
  constructor(private readonly service: CommunicationNotificationsService) {}

  @AllowCrossTenant()
  @Get()
  list(@Query() query: NotificationFeedQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @AllowCrossTenant()
  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.service.getUnreadCount(user);
  }

  @AllowCrossTenant()
  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.service.markAllRead(user);
  }

  @AllowCrossTenant()
  @Post(':id/read')
  markRead(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.markRead(id, user);
  }
}
