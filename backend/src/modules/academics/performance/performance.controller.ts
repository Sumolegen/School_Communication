import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/interfaces';
import { PerformanceService } from './performance.service';

@Controller('academics/performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  getTermComparison(
    @CurrentUser() user: AuthUser,
    @Query('studentId') studentIdCamel?: string,
    @Query('student_id') studentIdSnake?: string,
  ) {
    const studentId = studentIdCamel ?? studentIdSnake ?? user.linkedStudentIds[0];
    if (!studentId) throw new BadRequestException('studentId is required.');
    return this.performanceService.getStudentTermComparison(studentId, user);
  }
}
