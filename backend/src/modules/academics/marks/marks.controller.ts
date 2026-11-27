import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { BulkEnterMarksDto } from './marks.dto';
import { MarksService } from './marks.service';

@Controller(['marks', 'academics/marks'])
export class MarksController {
  constructor(private readonly marksService: MarksService) {}

  @Get()
  listMarks(
    @CurrentUser() user: AuthUser,
    @Query('student_id') studentIdSnake?: string,
    @Query('studentId') studentIdCamel?: string,
    @Query('term_id') termIdSnake?: string,
    @Query('termId') termIdCamel?: string,
    @Query('assessmentId') assessmentId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.marksService.listMarks(user, {
      studentId: studentIdCamel ?? studentIdSnake,
      termId: termIdCamel ?? termIdSnake,
      assessmentId,
      sectionId,
    });
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('MARKS_ENTER')
  @Post('bulk')
  bulkEnterMarks(@Body() dto: BulkEnterMarksDto, @CurrentUser() user: AuthUser) {
    return this.marksService.bulkEnterMarks(dto, user);
  }
}
