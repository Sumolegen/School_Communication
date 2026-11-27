import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { AuthUser } from '@shared/interfaces';
import { resolveEffectiveSchoolId } from '@shared/utils';
import { CreateStaffAssignmentDto } from './assignments.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAssignments(user: AuthUser, staffId?: string, sectionId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    return this.prisma.staffAssignment.findMany({
      where: {
        schoolId,
        ...(staffId ? { staffId } : {}),
        ...(sectionId ? { sectionId } : {}),
      },
      include: {
        staff: { include: { user: { select: { id: true, fullName: true } } } },
        section: { include: { schoolClass: true } },
        subject: true,
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyAssignments(user: AuthUser) {
    if (!user.staffId) {
      return [];
    }
    return this.listAssignments(user, user.staffId);
  }

  async create(dto: CreateStaffAssignmentDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);

    const [staff, section] = await Promise.all([
      this.prisma.staffProfile.findFirst({ where: { id: dto.staffId, schoolId } }),
      this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId } }),
    ]);

    if (!staff) throw new NotFoundException('Staff member not found in this school.');
    if (!section) throw new NotFoundException('Section not found in this school.');

    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } });
      if (!subject) throw new BadRequestException('Subject not found in this school.');
    }

    const academicYearId = dto.academicYearId ?? section.academicYearId;

    return this.prisma.$transaction(async (tx) => {
      if (dto.isClassTeacher) {
        await tx.section.update({
          where: { id: section.id },
          data: { classTeacherId: staff.id },
        });
      }

      return tx.staffAssignment.create({
        data: {
          schoolId,
          academicYearId,
          staffId: staff.id,
          sectionId: section.id,
          subjectId: dto.subjectId ?? null,
          isClassTeacher: dto.isClassTeacher ?? false,
        },
        include: {
          staff: { include: { user: { select: { id: true, fullName: true } } } },
          section: { include: { schoolClass: true } },
          subject: true,
        },
      });
    });
  }

  async remove(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.staffAssignment.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Assignment not found.');
    await this.prisma.staffAssignment.delete({ where: { id } });
    return { deleted: true, id };
  }
}
