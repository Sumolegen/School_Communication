import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { StudentDashboardService } from './student-dashboard.service';

@Controller('dashboard/student')
export class StudentDashboardController {
  constructor(private readonly service: StudentDashboardService) {}

  @Roles(RoleCode.PARENT, RoleCode.STUDENT)
  @Get()
  getSummary(@CurrentUser() user: AuthUser, @Query('studentId') studentId?: string) {
    return this.service.getSummary(user, studentId);
  }
}
