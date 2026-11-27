import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId, toDateOnly } from '@shared/utils';
import { CreateExamTermDto } from './exams.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, academicYearId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    return this.prisma.examTerm.findMany({
      where: {
        schoolId,
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: {
        academicYear: { select: { id: true, name: true } },
        _count: { select: { assessments: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async create(dto: CreateExamTermDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const startDate = toDateOnly(dto.startDate);
    const endDate = toDateOnly(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('Exam term endDate must be on or after startDate.');
    }

    let academicYearId = dto.academicYearId;
    if (!academicYearId) {
      const current = await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
      if (!current) throw new BadRequestException('No active academic year configured.');
      academicYearId = current.id;
    }

    return this.prisma.examTerm.create({
      data: {
        schoolId,
        academicYearId,
        name: dto.name.trim(),
        termType: dto.termType,
        startDate,
        endDate,
      },
    });
  }

  async remove(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.examTerm.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Exam term not found.');
    await this.prisma.examTerm.delete({ where: { id } });
    return { deleted: true, id };
  }
}
