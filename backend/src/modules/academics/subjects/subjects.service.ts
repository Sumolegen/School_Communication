import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId } from '@shared/utils';
import { CreateSubjectDto, UpdateSubjectDto } from './subjects.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    return this.prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  create(dto: CreateSubjectDto, user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    return this.prisma.subject.create({
      data: {
        schoolId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
      },
    });
  }

  async update(id: string, dto: UpdateSubjectDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.subject.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Subject not found.');

    return this.prisma.subject.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }
}
