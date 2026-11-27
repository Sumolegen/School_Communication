import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_CROSS_TENANT_KEY } from '../decorators/school-scoped.decorator';
import { RoleCode } from '../enums';
import { AuthUser } from '../interfaces';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const allowCrossTenant = this.reflector.getAllAndOverride<boolean>(ALLOW_CROSS_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      params?: Record<string, string>;
      query?: Record<string, string>;
      body?: Record<string, unknown>;
    }>();

    const user = request.user;
    if (!user) {
      return true;
    }

    if (user.role === RoleCode.SUPER_ADMIN && allowCrossTenant) {
      return true;
    }

    if (user.role === RoleCode.SUPER_ADMIN) {
      return true;
    }

    if (!user.schoolId) {
      throw new ForbiddenException('Tenant school context is missing from user session.');
    }

    const requestedSchoolId =
      request.params?.schoolId ??
      request.query?.schoolId ??
      (typeof request.body?.schoolId === 'string' ? request.body.schoolId : undefined);

    if (requestedSchoolId && requestedSchoolId !== user.schoolId) {
      throw new ForbiddenException('Cross-school tenant access is strictly forbidden.');
    }

    return true;
  }
}
