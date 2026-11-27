import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { BulkAttendanceDto } from './records.dto';
import { RecordsService } from './records.service';

@Controller('attendance')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get('roster')
  getRoster(
    @Query('sectionId') sectionId: string,
    @Query('date') date: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    if (!sectionId) throw new BadRequestException('sectionId query parameter is required.');
    return this.recordsService.getSectionRosterForDate(sectionId, date, user);
  }

  @Get()
  getAttendance(
    @Query('student_id') studentIdSnake: string | undefined,
    @Query('studentId') studentIdCamel: string | undefined,
    @Query('sectionId') sectionId: string | undefined,
    @Query('month') month: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    const studentId = studentIdCamel ?? studentIdSnake ?? user.linkedStudentIds[0];
    if (studentId) {
      return this.recordsService.getStudentAttendance(studentId, month, user);
    }
    if (sectionId) {
      return this.recordsService.getSectionHistory(sectionId, month, user);
    }
    throw new BadRequestException('Provide studentId or sectionId.');
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('ATTENDANCE_MARK')
  @Post('bulk')
  markBulk(@Body() dto: BulkAttendanceDto, @CurrentUser() user: AuthUser) {
    return this.recordsService.markBulk(dto, user);
  }
}
