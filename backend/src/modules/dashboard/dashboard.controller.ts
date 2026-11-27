import { Controller, Get, Query } from '@nestjs/common';
import { AllowCrossTenant } from '@shared/decorators/school-scoped.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { AdminDashboardService } from './admin-dashboard/admin-dashboard.service';
import { StaffDashboardService } from './staff-dashboard/staff-dashboard.service';
import { StudentDashboardService } from './student-dashboard/student-dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly adminDashboard: AdminDashboardService,
    private readonly staffDashboard: StaffDashboardService,
    private readonly studentDashboard: StudentDashboardService,
  ) {}

  @AllowCrossTenant()
  @Get()
  getRoleDashboard(@CurrentUser() user: AuthUser, @Query('studentId') studentId?: string) {
    if (user.role === RoleCode.SUPER_ADMIN || user.role === RoleCode.SCHOOL_ADMIN) {
      return this.adminDashboard.getSummary(user);
    }
    if (user.role === RoleCode.TEACHER) {
      return this.staffDashboard.getSummary(user);
    }
    return this.studentDashboard.getSummary(user, studentId);
  }
}
