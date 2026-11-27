import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { CreateEventDto, EventsQueryDto } from './events.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(@Query() query: EventsQueryDto, @CurrentUser() user: AuthUser) {
    return this.eventsService.list(query, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('EVENT_MANAGE')
  @Post()
  create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthUser) {
    return this.eventsService.create(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('EVENT_MANAGE')
  @Delete(':id')
  remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.eventsService.remove(id, user);
  }
}
