import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { hashSecret } from '@shared/utils';
import { CreateSchoolDto, UpdateSchoolDto } from './school.dto';

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicConfig(schoolCode?: string, user?: AuthUser) {
    if (user?.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: user.schoolId },
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
      });
      if (!school) throw new NotFoundException('School not found.');
      return school;
    }

    if (schoolCode) {
      const school = await this.prisma.school.findUnique({
        where: { schoolCode: schoolCode.trim().toUpperCase() },
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
      });
      if (!school) throw new NotFoundException(`School with code "${schoolCode}" not found.`);
      return school;
    }

    return {
      id: null,
      schoolCode: null,
      name: 'School Communication',
      logoUrl: null,
      primaryColor: '#0F294A',
      accentColor: '#D97706',
      contactPhone: '99 408 77 778',
      contactEmail: null,
      address: null,
      subscriptionStatus: 'ACTIVE',
      messagingBroadcastOnly: false,
      messagingStartHour: null,
      messagingEndHour: null,
    };
  }

  async findAll(user: AuthUser) {
    if (user.role === RoleCode.SUPER_ADMIN) {
      return this.prisma.school.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              students: true,
              staffProfiles: true,
              classes: true,
            },
          },
        },
      });
    }

    if (!user.schoolId) {
      throw new ForbiddenException('Missing school tenant context.');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: user.schoolId },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            staffProfiles: true,
            classes: true,
          },
        },
      },
    });
    return school ? [school] : [];
  }

  async findOne(id: string, user: AuthUser) {
    if (user.role !== RoleCode.SUPER_ADMIN && user.schoolId !== id) {
      throw new ForbiddenException('You may only view your own school.');
    }
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        academicYears: { orderBy: { startDate: 'desc' } },
        _count: { select: { users: true, students: true, staffProfiles: true, classes: true } },
      },
    });
    if (!school) throw new NotFoundException('School not found.');
    return school;
  }

  async create(dto: CreateSchoolDto) {
    const normalizedCode = dto.schoolCode.trim().toUpperCase();
    const exists = await this.prisma.school.findUnique({ where: { schoolCode: normalizedCode } });
    if (exists) {
      throw new ConflictException(`School code "${normalizedCode}" already exists.`);
    }

    const adminHash = dto.adminPassword ? await hashSecret(dto.adminPassword) : await hashSecret('Admin@123');
    const schoolAdminRole = await this.prisma.role.findUnique({ where: { code: RoleCode.SCHOOL_ADMIN } });

    return this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          schoolCode: normalizedCode,
          name: dto.name.trim(),
          logoUrl: dto.logoUrl ?? null,
          primaryColor: dto.primaryColor ?? '#0F294A',
          accentColor: dto.accentColor ?? '#D97706',
          contactPhone: dto.contactPhone ?? null,
          contactEmail: dto.contactEmail ?? null,
          address: dto.address ?? null,
          subscriptionStatus: dto.subscriptionStatus ?? 'ACTIVE',
          subscriptionPlan: dto.subscriptionPlan ?? 'ANNUAL_5999',
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

      if (dto.adminPhone && schoolAdminRole) {
        await tx.user.create({
          data: {
            schoolId: school.id,
            roleId: schoolAdminRole.id,
            phone: dto.adminPhone.trim(),
            fullName: dto.adminFullName?.trim() || `${school.name} Admin`,
            pinOrPasswordHash: adminHash,
            isPreRegistered: true,
            isActive: true,
          },
        });
      }

      return school;
    });
  }

  async update(id: string, dto: UpdateSchoolDto, user: AuthUser) {
    if (user.role !== RoleCode.SUPER_ADMIN && user.schoolId !== id) {
      throw new ForbiddenException('You can only update your own school configuration.');
    }

    const existing = await this.prisma.school.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('School not found.');

    const data: Record<string, unknown> = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.primaryColor !== undefined ? { primaryColor: dto.primaryColor } : {}),
      ...(dto.accentColor !== undefined ? { accentColor: dto.accentColor } : {}),
      ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
      ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.messagingBroadcastOnly !== undefined
        ? { messagingBroadcastOnly: dto.messagingBroadcastOnly }
        : {}),
      ...(dto.messagingStartHour !== undefined ? { messagingStartHour: dto.messagingStartHour } : {}),
      ...(dto.messagingEndHour !== undefined ? { messagingEndHour: dto.messagingEndHour } : {}),
    };

    if (user.role === RoleCode.SUPER_ADMIN) {
      if (dto.subscriptionStatus !== undefined) data.subscriptionStatus = dto.subscriptionStatus;
      if (dto.subscriptionPlan !== undefined) data.subscriptionPlan = dto.subscriptionPlan;
      if (dto.subscriptionExpiresAt !== undefined) {
        data.subscriptionExpiresAt = new Date(dto.subscriptionExpiresAt);
      }
      if (dto.isActive !== undefined) data.isActive = dto.isActive;
    }

    return this.prisma.school.update({
      where: { id },
      data,
    });
  }

  async getPlatformHealth() {
    const [schoolsCount, activeSchoolsCount, usersCount, studentsCount, announcementsCount] =
      await Promise.all([
        this.prisma.school.count(),
        this.prisma.school.count({ where: { isActive: true, subscriptionStatus: 'ACTIVE' } }),
        this.prisma.user.count(),
        this.prisma.studentProfile.count(),
        this.prisma.announcement.count(),
      ]);

    return {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      metrics: {
        totalSchools: schoolsCount,
        activeSchools: activeSchoolsCount,
        totalUsers: usersCount,
        totalStudents: studentsCount,
        totalAnnouncements: announcementsCount,
      },
    };
  }
}
