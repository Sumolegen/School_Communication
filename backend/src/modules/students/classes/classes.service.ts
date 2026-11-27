import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { getStudentOrParentSectionIds, resolveEffectiveSchoolId } from '@shared/utils';
import { CreateClassDto, CreateSectionDto, UpdateSectionDto } from './classes.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async listClasses(user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);

    let sectionFilter: Record<string, unknown> = { schoolId };
    if (user.role === RoleCode.TEACHER) {
      sectionFilter = {
        schoolId,
        id: { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] },
      };
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const ids = await getStudentOrParentSectionIds(this.prisma, user);
      sectionFilter = { schoolId, id: { in: ids.length ? ids : ['__none__'] } };
    }

    return this.prisma.schoolClass.findMany({
      where: { schoolId },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        sections: {
          where: sectionFilter,
          include: {
            academicYear: { select: { id: true, name: true, isCurrent: true } },
            classTeacher: {
              include: { user: { select: { id: true, fullName: true } } },
            },
            _count: { select: { students: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async listSections(user: AuthUser, academicYearId?: string, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);

    const where: Record<string, unknown> = {
      schoolId,
      ...(academicYearId ? { academicYearId } : {}),
    };

    if (user.role === RoleCode.TEACHER) {
      where.id = { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] };
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const ids = await getStudentOrParentSectionIds(this.prisma, user);
      where.id = { in: ids.length ? ids : ['__none__'] };
    }

    return this.prisma.section.findMany({
      where,
      include: {
        schoolClass: true,
        academicYear: { select: { id: true, name: true, isCurrent: true } },
        classTeacher: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        _count: { select: { students: true } },
      },
      orderBy: [{ schoolClass: { displayOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async createClass(dto: CreateClassDto, user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    return this.prisma.schoolClass.create({
      data: {
        schoolId,
        name: dto.name.trim(),
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  async createSection(dto: CreateSectionDto, user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);
    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: dto.classId, schoolId },
    });
    if (!schoolClass) throw new NotFoundException('Class not found in this school.');

    let academicYearId = dto.academicYearId;
    if (!academicYearId) {
      const currentYear = await this.prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
      });
      if (!currentYear) {
        throw new BadRequestException('No active academic year found for this school.');
      }
      academicYearId = currentYear.id;
    }

    if (dto.classTeacherId) {
      const teacher = await this.prisma.staffProfile.findFirst({
        where: { id: dto.classTeacherId, schoolId },
      });
      if (!teacher) throw new BadRequestException('Class teacher does not belong to this school.');
    }

    return this.prisma.section.create({
      data: {
        schoolId,
        classId: dto.classId,
        academicYearId,
        name: dto.name.trim(),
        classTeacherId: dto.classTeacherId ?? null,
      },
      include: { schoolClass: true, academicYear: true },
    });
  }

  async updateSection(id: string, dto: UpdateSectionDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const section = await this.prisma.section.findFirst({ where: { id, schoolId } });
    if (!section) throw new NotFoundException('Section not found.');

    if (dto.classTeacherId) {
      const teacher = await this.prisma.staffProfile.findFirst({
        where: { id: dto.classTeacherId, schoolId },
      });
      if (!teacher) throw new BadRequestException('Class teacher does not belong to this school.');
    }

    return this.prisma.section.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.classTeacherId !== undefined ? { classTeacherId: dto.classTeacherId } : {}),
      },
      include: { schoolClass: true, academicYear: true },
    });
  }
}
