import { Controller, Get } from '@nestjs/common';
import { AllowCrossTenant } from '@shared/decorators/school-scoped.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('dashboard/admin')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN)
  @AllowCrossTenant()
  @Get()
  getSummary(@CurrentUser() user: AuthUser) {
    return this.service.getSummary(user);
  }
}
