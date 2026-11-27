import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { CreateAlertDto } from './alerts.dto';
import { AlertsService } from './alerts.service';

@Controller('communication/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('studentId') studentId?: string,
  ) {
    return this.alertsService.list(user, page, limit, studentId);
  }

  @Roles(RoleCode.SUPER_ADMIN, RoleCode.SCHOOL_ADMIN, RoleCode.TEACHER)
  @RequirePermissions('ALERT_PUBLISH')
  @Post()
  create(@Body() dto: CreateAlertDto, @CurrentUser() user: AuthUser) {
    return this.alertsService.create(dto, user);
  }
}
