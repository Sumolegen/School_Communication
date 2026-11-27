import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/interfaces';
import { AttendancePerformanceService } from './attendance-performance.service';

@Controller('analytics/attendance-performance')
export class AttendancePerformanceController {
  constructor(private readonly service: AttendancePerformanceService) {}

  @Get()
  getAnalytics(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.service.getAnalytics(user, month);
  }
}
