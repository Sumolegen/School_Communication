import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      orderBy: { code: 'asc' },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  findByCode(code: RoleCode) {
    return this.prisma.role.findUnique({
      where: { code },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }
}
