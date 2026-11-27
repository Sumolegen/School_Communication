import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId } from '@shared/utils';
import { UpsertSchoolPermissionOverrideDto } from './permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllCatalog() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
  }

  async getEffectiveRolePermissions(roleCode: RoleCode, schoolId?: string | null): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) return [];

    const set = new Set<string>(role.rolePermissions.map((rp) => rp.permission.code));

    if (schoolId) {
      const overrides = await this.prisma.schoolPermissionOverride.findMany({
        where: { schoolId, roleId: role.id },
        include: { permission: true },
      });
      for (const override of overrides) {
        if (override.granted) {
          set.add(override.permission.code);
        } else {
          set.delete(override.permission.code);
        }
      }
    }

    return Array.from(set).sort();
  }

  async getSchoolOverrides(user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    return this.prisma.schoolPermissionOverride.findMany({
      where: { schoolId },
      include: {
        role: { select: { code: true, name: true } },
        permission: { select: { code: true, module: true, description: true } },
      },
      orderBy: [{ roleId: 'asc' }, { permissionId: 'asc' }],
    });
  }

  async upsertSchoolOverride(dto: UpsertSchoolPermissionOverrideDto, user: AuthUser, schoolIdParam?: string) {
    if (dto.roleCode === RoleCode.SUPER_ADMIN) {
      throw new BadRequestException('Cannot override platform Super Admin permissions at school level.');
    }

    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    const [role, permission] = await Promise.all([
      this.prisma.role.findUnique({ where: { code: dto.roleCode } }),
      this.prisma.permission.findUnique({ where: { code: dto.permissionCode } }),
    ]);

    if (!role) throw new NotFoundException(`Role "${dto.roleCode}" not found.`);
    if (!permission) throw new NotFoundException(`Permission "${dto.permissionCode}" not found.`);

    return this.prisma.schoolPermissionOverride.upsert({
      where: {
        schoolId_roleId_permissionId: {
          schoolId,
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: { granted: dto.granted },
      create: {
        schoolId,
        roleId: role.id,
        permissionId: permission.id,
        granted: dto.granted,
      },
      include: {
        role: { select: { code: true, name: true } },
        permission: { select: { code: true, description: true } },
      },
    });
  }
}
