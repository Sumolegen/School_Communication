import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { NotificationCategory, PriorityLevel, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertStudentAccess, resolveEffectiveSchoolId } from '@shared/utils';
import { CreateAcademicUpdateDto } from './academic-updates.dto';

@Injectable()
export class AcademicUpdatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async list(user: AuthUser, studentId?: string) {
    const schoolId = resolveEffectiveSchoolId(user);
    const where: Record<string, unknown> = { schoolId };

    if (studentId) {
      await assertStudentAccess(this.prisma, user, studentId);
      where.studentId = studentId;
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      where.studentId = { in: user.linkedStudentIds.length ? user.linkedStudentIds : ['__none__'] };
    } else if (user.role === RoleCode.TEACHER) {
      where.student = {
        sectionId: { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] },
      };
    }

    return this.prisma.academicUpdate.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNo: true,
            section: { include: { schoolClass: true } },
          },
        },
        examTerm: { select: { id: true, name: true, termType: true } },
        teacher: { include: { user: { select: { id: true, fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateAcademicUpdateDto, user: AuthUser) {
    const student = await assertStudentAccess(this.prisma, user, dto.studentId);

    let teacherId = user.staffId;
    if (!teacherId) {
      const fallback = await this.prisma.staffProfile.findFirst({
        where: { schoolId: student.schoolId, isTeacher: true },
        select: { id: true },
      });
      if (!fallback) throw new BadRequestException('No teacher profile available to create academic update.');
      teacherId = fallback.id;
    }

    const update = await this.prisma.academicUpdate.create({
      data: {
        schoolId: student.schoolId,
        academicYearId: student.academicYearId,
        studentId: student.id,
        examTermId: dto.examTermId ?? null,
        teacherId,
        title: dto.title.trim(),
        summary: dto.summary.trim(),
        remarks: dto.remarks?.trim() || null,
      },
      include: {
        student: { select: { id: true, fullName: true, userId: true, parentLinks: true } },
        examTerm: true,
        teacher: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    const recipients = [
      ...(update.student.userId ? [update.student.userId] : []),
      ...update.student.parentLinks.map((p) => p.parentUserId),
    ];

    await this.notificationsService.dispatchToUsers({
      schoolId: student.schoolId,
      recipientUserIds: recipients,
      studentId: student.id,
      title: `Academic Update: ${update.title}`,
      body: update.summary,
      category: NotificationCategory.MARKS,
      priority: PriorityLevel.NORMAL,
      referenceType: 'ACADEMIC_UPDATE',
      referenceId: update.id,
    });

    return update;
  }
}
