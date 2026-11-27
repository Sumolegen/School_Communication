import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { buildPaginatedResult, hashSecret, normalizePagination, resolveEffectiveSchoolId } from '@shared/utils';
import { CreateUserDto, UpdateOwnProfileDto, UpdateUserDto, UsersQueryDto } from './users.dto';

const USER_PUBLIC_SELECT = {
  id: true,
  schoolId: true,
  phone: true,
  fullName: true,
  email: true,
  avatarUrl: true,
  isPreRegistered: true,
  isActive: true,
  lastLoginAt: true,
  deletionRequestedAt: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: { id: true, code: true, name: true },
  },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UsersQueryDto, user: AuthUser) {
    const schoolId =
      user.role === RoleCode.SUPER_ADMIN && !query.schoolId
        ? undefined
        : resolveEffectiveSchoolId(user, query.schoolId);

    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Record<string, unknown> = {
      ...(schoolId ? { schoolId } : {}),
      ...(query.roleCode ? { role: { code: query.roleCode } } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_PUBLIC_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthUser) {
    const record = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
    if (!record) throw new NotFoundException('User not found.');
    if (user.role !== RoleCode.SUPER_ADMIN && record.schoolId !== user.schoolId) {
      throw new ForbiddenException('Cross-school user access is forbidden.');
    }
    return record;
  }

  async create(dto: CreateUserDto, user: AuthUser) {
    if (dto.roleCode === RoleCode.SUPER_ADMIN && user.role !== RoleCode.SUPER_ADMIN) {
      throw new ForbiddenException('Only Platform Super Admin can create Super Admin users.');
    }

    const schoolId =
      dto.roleCode === RoleCode.SUPER_ADMIN ? null : resolveEffectiveSchoolId(user, dto.schoolId);

    const role = await this.prisma.role.findUnique({ where: { code: dto.roleCode } });
    if (!role) throw new BadRequestException(`Unknown role code "${dto.roleCode}".`);

    const cleanPhone = dto.phone.replace(/[\s\-+]/g, '');
    const existing = await this.prisma.user.findFirst({
      where: { schoolId, phone: cleanPhone },
    });
    if (existing) {
      throw new ConflictException('A user with this mobile number is already registered in this school.');
    }

    const pinOrPasswordHash = await hashSecret(dto.pinOrPassword ?? '1234');

    return this.prisma.user.create({
      data: {
        schoolId,
        roleId: role.id,
        phone: cleanPhone,
        fullName: dto.fullName.trim(),
        email: dto.email?.trim() || null,
        pinOrPasswordHash,
        isPreRegistered: true,
        isActive: true,
      },
      select: USER_PUBLIC_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto, user: AuthUser) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found.');
    if (user.role !== RoleCode.SUPER_ADMIN && existing.schoolId !== user.schoolId) {
      throw new ForbiddenException('Cross-school user modification is forbidden.');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim() || null } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.fcmToken !== undefined ? { fcmToken: dto.fcmToken } : {}),
      },
      select: USER_PUBLIC_SELECT,
    });
  }

  async updateOwnProfile(dto: UpdateOwnProfileDto, user: AuthUser) {
    const data: Record<string, unknown> = {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
      ...(dto.email !== undefined ? { email: dto.email.trim() || null } : {}),
      ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      ...(dto.fcmToken !== undefined ? { fcmToken: dto.fcmToken } : {}),
    };
    if (dto.newPinOrPassword) {
      data.pinOrPasswordHash = await hashSecret(dto.newPinOrPassword);
    }

    return this.prisma.user.update({
      where: { id: user.userId },
      data,
      select: USER_PUBLIC_SELECT,
    });
  }

  async requestAccountDeletion(user: AuthUser) {
    return this.prisma.user.update({
      where: { id: user.userId },
      data: { deletionRequestedAt: new Date() },
      select: USER_PUBLIC_SELECT,
    });
  }
}
