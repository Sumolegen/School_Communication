import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { ParseUuidPipe } from '@shared/pipes/parse-uuid.pipe';
import { BulkUpsertTimetableDto, CreateTimetableEntryDto } from './schedules.dto';
import { SchedulesService } from './schedules.service';

@Controller('timetable')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  getSchedule(
    @CurrentUser() user: AuthUser,
    @Query('sectionId') sectionId?: string,
    @Query('class_id') classIdAlias?: string,
    @Query('teacherStaffId') teacherStaffId?: string,
  ) {
    return this.schedulesService.getSchedule(user, sectionId ?? classIdAlias, teacherStaffId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('TIMETABLE_MANAGE')
  @Post()
  upsertEntry(@Body() dto: CreateTimetableEntryDto, @CurrentUser() user: AuthUser) {
    return this.schedulesService.createOrUpsertEntry(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('TIMETABLE_MANAGE')
  @Post('bulk')
  bulkUpsert(@Body() dto: BulkUpsertTimetableDto, @CurrentUser() user: AuthUser) {
    return this.schedulesService.bulkUpsert(dto, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @RequirePermissions('TIMETABLE_MANAGE')
  @Delete(':id')
  remove(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.schedulesService.remove(id, user);
  }
}
