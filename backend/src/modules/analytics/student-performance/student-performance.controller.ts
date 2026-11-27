import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/interfaces';
import { StudentPerformanceService } from './student-performance.service';

@Controller('analytics/student-performance')
export class StudentPerformanceController {
  constructor(private readonly service: StudentPerformanceService) {}

  @Get()
  getAnalytics(@CurrentUser() user: AuthUser, @Query('studentId') studentId?: string) {
    return this.service.getAnalytics(studentId, user);
  }
}
