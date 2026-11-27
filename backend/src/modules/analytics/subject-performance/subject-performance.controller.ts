import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/interfaces';
import { SubjectPerformanceService } from './subject-performance.service';

@Controller('analytics/subject-performance')
export class SubjectPerformanceController {
  constructor(private readonly service: SubjectPerformanceService) {}

  @Get()
  getAnalytics(@CurrentUser() user: AuthUser, @Query('sectionId') sectionId?: string) {
    return this.service.getAnalytics(user, sectionId);
  }
}
