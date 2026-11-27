import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId } from '@shared/utils';
import { BulkGradeScaleDto, GradeScaleDto } from './grades.dto';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    return this.prisma.gradeScale.findMany({
      where: { schoolId },
      orderBy: { minPercentage: 'desc' },
    });
  }

  upsertOne(dto: GradeScaleDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    return this.prisma.gradeScale.upsert({
      where: { schoolId_gradeLabel: { schoolId, gradeLabel: dto.gradeLabel.trim() } },
      update: {
        minPercentage: dto.minPercentage,
        maxPercentage: dto.maxPercentage,
        remarks: dto.remarks ?? null,
      },
      create: {
        schoolId,
        gradeLabel: dto.gradeLabel.trim(),
        minPercentage: dto.minPercentage,
        maxPercentage: dto.maxPercentage,
        remarks: dto.remarks ?? null,
      },
    });
  }

  replaceBulk(dto: BulkGradeScaleDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    return this.prisma.$transaction(async (tx) => {
      await tx.gradeScale.deleteMany({ where: { schoolId } });
      await tx.gradeScale.createMany({
        data: dto.scales.map((s) => ({
          schoolId,
          gradeLabel: s.gradeLabel.trim(),
          minPercentage: s.minPercentage,
          maxPercentage: s.maxPercentage,
          remarks: s.remarks ?? null,
        })),
      });
      return tx.gradeScale.findMany({ where: { schoolId }, orderBy: { minPercentage: 'desc' } });
    });
  }
}
