import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@config/prisma.service';
import { PermissionsService } from '@core/permissions/permissions.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';

interface JwtPayload {
  sub: string;
  schoolId: string | null;
  role: RoleCode;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret') ?? 'dev-school-communication-jwt-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: true,
        school: true,
        staffProfile: {
          include: {
            staffAssignments: { select: { sectionId: true } },
            classTeacherSections: { select: { id: true } },
          },
        },
        studentProfile: { select: { id: true } },
        parentLinks: { select: { studentId: true } },
      },
    });

    if (!user || !user.isActive || !user.isPreRegistered) {
      throw new UnauthorizedException('Account is inactive or not pre-registered.');
    }

    if (user.schoolId && user.school) {
      if (!user.school.isActive || user.school.subscriptionStatus === 'SUSPENDED') {
        throw new UnauthorizedException('School access is currently suspended or inactive.');
      }
    }

    const role = user.role.code as RoleCode;
    const permissions = await this.permissionsService.getEffectiveRolePermissions(role, user.schoolId);

    const linkedStudentIds: string[] = [];
    if (role === RoleCode.PARENT) {
      linkedStudentIds.push(...user.parentLinks.map((l) => l.studentId));
    } else if (role === RoleCode.STUDENT && user.studentProfile) {
      linkedStudentIds.push(user.studentProfile.id);
    }

    const assignedSectionIds: string[] = user.staffProfile
      ? Array.from(
          new Set([
            ...user.staffProfile.staffAssignments.map((a) => a.sectionId),
            ...user.staffProfile.classTeacherSections.map((s) => s.id),
          ]),
        )
      : [];

    return {
      userId: user.id,
      schoolId: user.schoolId,
      role,
      permissions,
      phone: user.phone,
      fullName: user.fullName,
      staffId: user.staffProfile?.id ?? null,
      studentId: user.studentProfile?.id ?? null,
      linkedStudentIds,
      assignedSectionIds,
    };
  }
}
