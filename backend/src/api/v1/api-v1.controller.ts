import { Controller, Get } from '@nestjs/common';
import { AuthService } from '@core/auth/auth.service';
import { AllowCrossTenant } from '@shared/decorators/school-scoped.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Public } from '@shared/decorators/public.decorator';
import { AuthUser } from '@shared/interfaces';

@Controller()
export class ApiV1Controller {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'school-communication-api',
      version: 'v1',
      timestamp: new Date().toISOString(),
    };
  }

  @AllowCrossTenant()
  @Get('me/students')
  getMyStudents(@CurrentUser() user: AuthUser) {
    return this.authService.getLinkedStudents(user);
  }
}
