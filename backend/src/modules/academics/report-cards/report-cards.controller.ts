import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/interfaces';
import { ReportCardsService } from './report-cards.service';

@Controller('academics/report-cards')
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Get()
  getReportCard(
    @CurrentUser() user: AuthUser,
    @Query('studentId') studentIdCamel?: string,
    @Query('student_id') studentIdSnake?: string,
    @Query('termId') termIdCamel?: string,
    @Query('term_id') termIdSnake?: string,
  ) {
    const studentId = studentIdCamel ?? studentIdSnake ?? user.linkedStudentIds[0];
    if (!studentId) throw new BadRequestException('studentId is required.');
    return this.reportCardsService.generateReportCard(studentId, termIdCamel ?? termIdSnake, user);
  }
}
