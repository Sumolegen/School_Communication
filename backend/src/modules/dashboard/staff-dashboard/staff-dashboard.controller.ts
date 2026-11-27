import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { StaffDashboardService } from './staff-dashboard.service';

@Controller('dashboard/staff')
export class StaffDashboardController {
  constructor(private readonly service: StaffDashboardService) {}

  @Roles(RoleCode.TEACHER, RoleCode.SCHOOL_ADMIN)
  @Get()
  getSummary(@CurrentUser() user: AuthUser) {
    return this.service.getSummary(user);
  }
}
