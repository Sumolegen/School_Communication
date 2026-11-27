import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertSectionAccess, getStudentOrParentSectionIds, resolveEffectiveSchoolId } from '@shared/utils';
import { BulkUpsertTimetableDto, CreateTimetableEntryDto } from './schedules.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchedule(user: AuthUser, sectionId?: string, teacherStaffId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);

    if (sectionId) {
      await assertSectionAccess(this.prisma, user, sectionId);
    }

    const where: Record<string, unknown> = { schoolId };

    if (sectionId) {
      where.sectionId = sectionId;
    } else if (user.role === RoleCode.TEACHER && user.staffId) {
      where.teacherStaffId = user.staffId;
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const allowedSections = await getStudentOrParentSectionIds(this.prisma, user);
      where.sectionId = { in: allowedSections.length ? allowedSections : ['__none__'] };
    } else if (teacherStaffId) {
      where.teacherStaffId = teacherStaffId;
    }

    return this.prisma.timetableEntry.findMany({
      where,
      include: {
        section: { include: { schoolClass: true } },
        subject: true,
        teacher: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNo: 'asc' }],
    });
  }

  async createOrUpsertEntry(dto: CreateTimetableEntryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId } });
    if (!section) throw new NotFoundException('Section not found in this school.');

    const [subject, teacher] = await Promise.all([
      this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } }),
      this.prisma.staffProfile.findFirst({ where: { id: dto.teacherStaffId, schoolId } }),
    ]);

    if (!subject) throw new BadRequestException('Subject not found in this school.');
    if (!teacher) throw new BadRequestException('Teacher not found in this school.');

    const academicYearId = dto.academicYearId ?? section.academicYearId;

    return this.prisma.timetableEntry.upsert({
      where: {
        academicYearId_sectionId_dayOfWeek_periodNo: {
          academicYearId,
          sectionId: section.id,
          dayOfWeek: dto.dayOfWeek,
          periodNo: dto.periodNo,
        },
      },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        subjectId: subject.id,
        teacherStaffId: teacher.id,
      },
      create: {
        schoolId,
        academicYearId,
        sectionId: section.id,
        dayOfWeek: dto.dayOfWeek,
        periodNo: dto.periodNo,
        startTime: dto.startTime,
        endTime: dto.endTime,
        subjectId: subject.id,
        teacherStaffId: teacher.id,
      },
      include: {
        subject: true,
        teacher: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });
  }

  async bulkUpsert(dto: BulkUpsertTimetableDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId } });
    if (!section) throw new NotFoundException('Section not found in this school.');

    const academicYearId = dto.academicYearId ?? section.academicYearId;

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of dto.entries) {
        const saved = await tx.timetableEntry.upsert({
          where: {
            academicYearId_sectionId_dayOfWeek_periodNo: {
              academicYearId,
              sectionId: section.id,
              dayOfWeek: item.dayOfWeek,
              periodNo: item.periodNo,
            },
          },
          update: {
            startTime: item.startTime,
            endTime: item.endTime,
            subjectId: item.subjectId,
            teacherStaffId: item.teacherStaffId,
          },
          create: {
            schoolId,
            academicYearId,
            sectionId: section.id,
            dayOfWeek: item.dayOfWeek,
            periodNo: item.periodNo,
            startTime: item.startTime,
            endTime: item.endTime,
            subjectId: item.subjectId,
            teacherStaffId: item.teacherStaffId,
          },
        });
        results.push(saved);
      }
      return results;
    });
  }

  async remove(id: string, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.timetableEntry.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Timetable entry not found.');
    await this.prisma.timetableEntry.delete({ where: { id } });
    return { deleted: true, id };
  }
}
