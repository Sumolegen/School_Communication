import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId, toDateOnly } from '@shared/utils';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './academic-years.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
    });
  }

  async getCurrent(user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    const current = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      orderBy: { startDate: 'desc' },
    });
    if (!current) {
      throw new NotFoundException('No active academic year configured for this school.');
    }
    return current;
  }

  async create(dto: CreateAcademicYearDto, user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    const startDate = toDateOnly(dto.startDate);
    const endDate = toDateOnly(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('Academic year endDate must be after startDate.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          where: { schoolId, isCurrent: true },
          data: { isCurrent: false },
        });
      }
      return tx.academicYear.create({
        data: {
          schoolId,
          name: dto.name.trim(),
          startDate,
          endDate,
          isCurrent: dto.isCurrent ?? false,
        },
      });
    });
  }

  async update(id: string, dto: UpdateAcademicYearDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.academicYear.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Academic year not found.');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          where: { schoolId, isCurrent: true, id: { not: id } },
          data: { isCurrent: false },
        });
      }
      return tx.academicYear.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.startDate !== undefined ? { startDate: toDateOnly(dto.startDate) } : {}),
          ...(dto.endDate !== undefined ? { endDate: toDateOnly(dto.endDate) } : {}),
          ...(dto.isCurrent !== undefined ? { isCurrent: dto.isCurrent } : {}),
        },
      });
    });
  }
}
