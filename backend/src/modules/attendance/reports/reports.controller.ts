import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/interfaces';
import { ReportsService } from './reports.service';

@Controller('attendance/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  getReport(
    @CurrentUser() user: AuthUser,
    @Query('sectionId') sectionId?: string,
    @Query('month') month?: string,
  ) {
    return this.reportsService.getAttendanceReport(user, sectionId, month);
  }
}
