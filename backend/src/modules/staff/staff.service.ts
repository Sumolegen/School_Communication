import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { buildPaginatedResult, hashSecret, normalizePagination, resolveEffectiveSchoolId } from '@shared/utils';
import { CreateStaffDto, StaffQueryDto, UpdateStaffDto } from './staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: StaffQueryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user, query.schoolId);
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    // Parents/students only see public teacher directory fields (phone hidden for teacher privacy!)
    const isParentOrStudent = user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT;

    const where: Record<string, unknown> = {
      schoolId,
      ...(query.teachersOnly ? { isTeacher: true } : {}),
      ...(query.search
        ? {
            OR: [
              { employeeCode: { contains: query.search, mode: 'insensitive' } },
              { designation: { contains: query.search, mode: 'insensitive' } },
              { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.staffProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              isActive: true,
              ...(isParentOrStudent ? {} : { phone: true, email: true }),
            },
          },
          staffAssignments: {
            include: {
              section: { include: { schoolClass: true } },
              subject: true,
            },
          },
        },
      }),
      this.prisma.staffProfile.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const isParentOrStudent = user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT;

    const staff = await this.prisma.staffProfile.findFirst({
      where: { id, schoolId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isActive: true,
            ...(isParentOrStudent ? {} : { phone: true, email: true }),
          },
        },
        staffAssignments: {
          include: {
            section: { include: { schoolClass: true } },
            subject: true,
          },
        },
      },
    });
    if (!staff) throw new NotFoundException('Staff profile not found.');
    return staff;
  }

  async create(dto: CreateStaffDto, user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    const cleanPhone = dto.phone.replace(/[\s\-+]/g, '');

    const [existingPhone, existingCode, teacherRole] = await Promise.all([
      this.prisma.user.findFirst({ where: { schoolId, phone: cleanPhone } }),
      this.prisma.staffProfile.findUnique({
        where: { schoolId_employeeCode: { schoolId, employeeCode: dto.employeeCode.trim() } },
      }),
      this.prisma.role.findUnique({ where: { code: RoleCode.TEACHER } }),
    ]);

    if (existingPhone) throw new ConflictException('A user with this mobile number already exists in this school.');
    if (existingCode) throw new ConflictException('Employee code already exists in this school.');

    const pinHash = await hashSecret(dto.pinOrPassword ?? '1234');

    return this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          schoolId,
          roleId: teacherRole!.id,
          phone: cleanPhone,
          fullName: dto.fullName.trim(),
          email: dto.email?.trim() || null,
          pinOrPasswordHash: pinHash,
          isPreRegistered: true,
          isActive: true,
        },
      });

      return tx.staffProfile.create({
        data: {
          schoolId,
          userId: createdUser.id,
          employeeCode: dto.employeeCode.trim(),
          designation: dto.designation.trim(),
          qualification: dto.qualification?.trim() || null,
          isTeacher: dto.isTeacher ?? true,
        },
        include: {
          user: { select: { id: true, fullName: true, phone: true, email: true, isActive: true } },
        },
      });
    });
  }

  async update(id: string, dto: UpdateStaffDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.staffProfile.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Staff profile not found.');

    return this.prisma.$transaction(async (tx) => {
      if (dto.fullName !== undefined || dto.email !== undefined || dto.isActive !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
            ...(dto.email !== undefined ? { email: dto.email.trim() || null } : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          },
        });
      }

      return tx.staffProfile.update({
        where: { id },
        data: {
          ...(dto.designation !== undefined ? { designation: dto.designation.trim() } : {}),
          ...(dto.qualification !== undefined ? { qualification: dto.qualification } : {}),
          ...(dto.isTeacher !== undefined ? { isTeacher: dto.isTeacher } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        include: {
          user: { select: { id: true, fullName: true, phone: true, email: true, isActive: true } },
        },
      });
    });
  }
}
