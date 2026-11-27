import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@config/prisma.service';
import { PermissionsService } from '@core/permissions/permissions.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { generateNumericOtp, hashSecret, sha256, verifySecret } from '@shared/utils';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterSchoolDto,
  RegisterUserDto,
  RequestOtpDto,
  VerifyOtpDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly permissionsService: PermissionsService,
  ) {}

  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-+]/g, '');
  }

  private async resolveSchoolByCode(schoolCode?: string) {
    if (!schoolCode || !schoolCode.trim()) return null;
    const school = await this.prisma.school.findUnique({
      where: { schoolCode: schoolCode.trim().toUpperCase() },
    });
    if (!school) {
      throw new UnauthorizedException('Invalid school code.');
    }
    if (!school.isActive || school.subscriptionStatus === 'SUSPENDED') {
      throw new ForbiddenException('This school account is currently suspended or inactive.');
    }
    return school;
  }

  private async findPreRegisteredUser(phoneInput: string, schoolCode?: string) {
    const phone = this.normalizePhone(phoneInput);
    if (schoolCode && schoolCode.trim()) {
      const school = await this.resolveSchoolByCode(schoolCode);
      const user = await this.prisma.user.findFirst({
        where: { schoolId: school!.id, phone },
        include: { role: true, school: true },
      });
      if (!user || !user.isPreRegistered || !user.isActive) {
        throw new UnauthorizedException('This mobile number is not pre-registered or active for this school.');
      }
      return user;
    }

    // Without schoolCode: match unique active user or Super Admin
    const users = await this.prisma.user.findMany({
      where: { phone, isPreRegistered: true, isActive: true },
      include: { role: true, school: true },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Mobile number is not pre-registered. Contact your School Admin.');
    }
    if (users.length > 1) {
      throw new BadRequestException(
        'Multiple schools are linked to this mobile number. Please provide your School Code.',
      );
    }

    const matched = users[0];
    if (matched.school && (!matched.school.isActive || matched.school.subscriptionStatus === 'SUSPENDED')) {
      throw new ForbiddenException('School account is currently inactive or suspended.');
    }
    return matched;
  }

  async requestOtp(dto: RequestOtpDto) {
    const user = await this.findPreRegisteredUser(dto.phone, dto.schoolCode);
    const otp = generateNumericOtp(6);
    const expiryMinutes = this.configService.get<number>('auth.otpExpiryMinutes') ?? 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: {
        schoolId: user.schoolId,
        phone: user.phone,
        codeHash: sha256(otp),
        expiresAt,
      },
    });

    const devEcho = this.configService.get<boolean>('auth.otpDevEcho');
    return {
      message: 'OTP sent to registered mobile number.',
      expiresInMinutes: expiryMinutes,
      schoolCode: user.school?.schoolCode ?? null,
      ...(devEcho ? { devOtp: otp } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.findPreRegisteredUser(dto.phone, dto.schoolCode);
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        schoolId: user.schoolId,
        phone: user.phone,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('No active OTP found or OTP has expired.');
    }
    if (otpRecord.attempts >= 5) {
      throw new UnauthorizedException('Maximum OTP verification attempts exceeded.');
    }

    if (otpRecord.codeHash !== sha256(dto.otp.trim())) {
      await this.prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP code.');
    }

    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    });

    return this.issueSession(user.id, dto.fcmToken);
  }

  async loginWithPin(dto: LoginDto) {
    const user = await this.findPreRegisteredUser(dto.phone, dto.schoolCode);
    const valid = await verifySecret(dto.pinOrPassword, user.pinOrPasswordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid mobile number or PIN/password.');
    }
    return this.issueSession(user.id, dto.fcmToken);
  }

  async registerUser(dto: RegisterUserDto) {
    if (dto.roleCode === RoleCode.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot self-register as Platform Super Admin.');
    }

    const school = await this.resolveSchoolByCode(dto.schoolCode);
    if (!school) {
      throw new BadRequestException('A valid school code is required.');
    }

    const role = await this.prisma.role.findUnique({
      where: { code: dto.roleCode },
    });
    if (!role) {
      throw new BadRequestException(`Role "${dto.roleCode}" is not recognized.`);
    }

    const cleanPhone = this.normalizePhone(dto.phone);
    const existing = await this.prisma.user.findFirst({
      where: { schoolId: school.id, phone: cleanPhone },
    });
    if (existing) {
      throw new ConflictException('A user with this mobile number is already registered in this school.');
    }

    const pinOrPasswordHash = await hashSecret(dto.pinOrPassword);

    const createdUserId = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          roleId: role.id,
          phone: cleanPhone,
          fullName: dto.fullName.trim(),
          email: dto.email?.trim() || null,
          pinOrPasswordHash,
          isPreRegistered: true,
          isActive: true,
        },
      });

      if (dto.roleCode === RoleCode.TEACHER) {
        await tx.staffProfile.create({
          data: {
            schoolId: school.id,
            userId: user.id,
            employeeCode: `EMP-${cleanPhone.slice(-6)}`,
            designation: 'Teacher',
            isTeacher: true,
            isActive: true,
          },
        });
      }

      return user.id;
    });

    return this.issueSession(createdUserId, dto.fcmToken);
  }

  async registerSchool(dto: RegisterSchoolDto) {
    const normalizedCode = dto.schoolCode.trim().toUpperCase();
    const existingSchool = await this.prisma.school.findUnique({
      where: { schoolCode: normalizedCode },
    });
    if (existingSchool) {
      throw new ConflictException(`School code "${normalizedCode}" is already registered.`);
    }

    const schoolAdminRole = await this.prisma.role.findUnique({
      where: { code: RoleCode.SCHOOL_ADMIN },
    });
    if (!schoolAdminRole) {
      throw new BadRequestException('SCHOOL_ADMIN role configuration missing.');
    }

    const cleanAdminPhone = this.normalizePhone(dto.adminPhone);
    const adminPasswordHash = await hashSecret(dto.adminPassword);

    const createdAdminUserId = await this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          schoolCode: normalizedCode,
          name: dto.schoolName.trim(),
          primaryColor: '#0F294A',
          accentColor: '#D97706',
          contactPhone: cleanAdminPhone,
          contactEmail: dto.adminEmail?.trim() || null,
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: 'ANNUAL_5999',
        },
      });

      const currentYear = new Date().getUTCFullYear();
      await tx.academicYear.create({
        data: {
          schoolId: school.id,
          name: `${currentYear}-${currentYear + 1}`,
          startDate: new Date(Date.UTC(currentYear, 5, 1)),
          endDate: new Date(Date.UTC(currentYear + 1, 3, 30)),
          isCurrent: true,
        },
      });

      const defaultScales = [
        { gradeLabel: 'A+', minPercentage: 90, maxPercentage: 100, remarks: 'Outstanding' },
        { gradeLabel: 'A', minPercentage: 80, maxPercentage: 89.99, remarks: 'Excellent' },
        { gradeLabel: 'B+', minPercentage: 70, maxPercentage: 79.99, remarks: 'Very Good' },
        { gradeLabel: 'B', minPercentage: 60, maxPercentage: 69.99, remarks: 'Good' },
        { gradeLabel: 'C', minPercentage: 50, maxPercentage: 59.99, remarks: 'Satisfactory' },
        { gradeLabel: 'D', minPercentage: 35, maxPercentage: 49.99, remarks: 'Needs Improvement' },
        { gradeLabel: 'F', minPercentage: 0, maxPercentage: 34.99, remarks: 'Fail' },
      ];
      await tx.gradeScale.createMany({
        data: defaultScales.map((s) => ({ schoolId: school.id, ...s })),
      });

      const user = await tx.user.create({
        data: {
          schoolId: school.id,
          roleId: schoolAdminRole.id,
          phone: cleanAdminPhone,
          fullName: dto.adminFullName.trim(),
          email: dto.adminEmail?.trim() || null,
          pinOrPasswordHash: adminPasswordHash,
          isPreRegistered: true,
          isActive: true,
        },
      });

      return user.id;
    });

    return this.issueSession(createdAdminUserId, dto.fcmToken);
  }

  async refresh(dto: RefreshTokenDto) {
    const refreshSecret =
      this.configService.get<string>('auth.jwtRefreshSecret') ?? 'dev-school-communication-refresh-secret';

    let decoded: { sub: string };
    try {
      decoded = await this.jwtService.verifyAsync<{ sub: string }>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        userId: decoded.sub,
        tokenHash: sha256(dto.refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh session has been revoked or expired.');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(decoded.sub);
  }

  async logout(user: AuthUser) {
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { loggedOut: true };
  }

  async getLinkedStudents(user: AuthUser) {
    if (user.role === RoleCode.PARENT) {
      const links = await this.prisma.parentStudentLink.findMany({
        where: { parentUserId: user.userId, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
        include: {
          student: {
            include: {
              section: { include: { schoolClass: true } },
              academicYear: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      });
      return links.map((l) => ({
        relationship: l.relationship,
        isPrimary: l.isPrimary,
        ...l.student,
      }));
    }

    if (user.role === RoleCode.STUDENT && user.studentId) {
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: user.studentId },
        include: {
          section: { include: { schoolClass: true } },
          academicYear: { select: { id: true, name: true } },
        },
      });
      return student ? [student] : [];
    }

    return [];
  }

  async getSessionProfile(user: AuthUser) {
    const [dbUser, students] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          schoolId: true,
          phone: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          role: { select: { code: true, name: true } },
          school: {
            select: {
              id: true,
              schoolCode: true,
              name: true,
              logoUrl: true,
              primaryColor: true,
              accentColor: true,
              contactPhone: true,
              contactEmail: true,
              address: true,
              subscriptionStatus: true,
              messagingBroadcastOnly: true,
              messagingStartHour: true,
              messagingEndHour: true,
            },
          },
        },
      }),
      this.getLinkedStudents(user),
    ]);

    return {
      user: {
        ...dbUser,
        role: user.role,
        permissions: user.permissions,
        staffId: user.staffId,
        studentId: user.studentId,
      },
      school: dbUser?.school ?? null,
      students,
    };
  }

  private async issueSession(userId: string, fcmToken?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        ...(fcmToken ? { fcmToken } : {}),
      },
      include: {
        role: true,
        school: true,
        staffProfile: { select: { id: true } },
        studentProfile: { select: { id: true } },
      },
    });

    const roleCode = user.role.code as RoleCode;
    const permissions = await this.permissionsService.getEffectiveRolePermissions(roleCode, user.schoolId);

    const payload = {
      sub: user.id,
      schoolId: user.schoolId,
      role: roleCode,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshSecret =
      this.configService.get<string>('auth.jwtRefreshSecret') ?? 'dev-school-communication-refresh-secret';
    const refreshExpiresIn = this.configService.get<string>('auth.jwtRefreshExpiresIn') ?? '7d';

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      { secret: refreshSecret, expiresIn: refreshExpiresIn as never },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const authUser: AuthUser = {
      userId: user.id,
      schoolId: user.schoolId,
      role: roleCode,
      permissions,
      phone: user.phone,
      fullName: user.fullName,
      staffId: user.staffProfile?.id ?? null,
      studentId: user.studentProfile?.id ?? null,
      linkedStudentIds: [],
      assignedSectionIds: [],
    };
    const students = await this.getLinkedStudents(authUser);

    return {
      accessToken,
      refreshToken,
      redirectPath: '/dashboard',
      user: {
        id: user.id,
        schoolId: user.schoolId,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: roleCode,
        permissions,
        staffId: user.staffProfile?.id ?? null,
        studentId: user.studentProfile?.id ?? null,
      },
      school: user.school
        ? {
            id: user.school.id,
            schoolCode: user.school.schoolCode,
            name: user.school.name,
            logoUrl: user.school.logoUrl,
            primaryColor: user.school.primaryColor,
            accentColor: user.school.accentColor,
            contactPhone: user.school.contactPhone,
            contactEmail: user.school.contactEmail,
            address: user.school.address,
            subscriptionStatus: user.school.subscriptionStatus,
            messagingBroadcastOnly: user.school.messagingBroadcastOnly,
            messagingStartHour: user.school.messagingStartHour,
            messagingEndHour: user.school.messagingEndHour,
          }
        : null,
      students,
    };
  }
}
