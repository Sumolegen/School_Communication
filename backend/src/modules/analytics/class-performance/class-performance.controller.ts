import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/interfaces';
import { ClassPerformanceService } from './class-performance.service';

@Controller('analytics/class-performance')
export class ClassPerformanceController {
  constructor(private readonly service: ClassPerformanceService) {}

  @Get()
  getAnalytics(@CurrentUser() user: AuthUser, @Query('examTermId') examTermId?: string) {
    return this.service.getAnalytics(user, examTermId);
  }
}
