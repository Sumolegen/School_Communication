import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { AnnouncementsQueryDto, CreateAnnouncementDto } from './announcements.dto';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  list(@Query() query: AnnouncementsQueryDto, @CurrentUser() user: AuthUser) {
    return this.announcementsService.list(query, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('ANNOUNCEMENT_PUBLISH')
  @Post()
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: AuthUser) {
    return this.announcementsService.create(dto, user);
  }

  @Post(':id/read')
  markAsRead(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.announcementsService.markAsRead(id, user);
  }
}
