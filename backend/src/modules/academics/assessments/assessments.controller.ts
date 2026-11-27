import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { AssessmentsQueryDto, CreateAssessmentDto } from './assessments.dto';
import { AssessmentsService } from './assessments.service';

@Controller('academics/assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get()
  list(@Query() query: AssessmentsQueryDto, @CurrentUser() user: AuthUser) {
    return this.assessmentsService.list(query, user);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('EXAM_MANAGE')
  @Post()
  create(@Body() dto: CreateAssessmentDto, @CurrentUser() user: AuthUser) {
    return this.assessmentsService.create(dto, user);
  }
}
