import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { NotificationCategory, PriorityLevel, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import {
  assertSectionAccess,
  assertStudentAccess,
  calculatePercentage,
  resolveEffectiveSchoolId,
  resolveGrade,
} from '@shared/utils';
import { BulkEnterMarksDto } from './marks.dto';

@Injectable()
export class MarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: CoreNotificationsService,
  ) {}

  async listMarks(
    user: AuthUser,
    params: { studentId?: string; termId?: string; assessmentId?: string; sectionId?: string },
  ) {
    const schoolId = resolveEffectiveSchoolId(user);
    const where: Record<string, unknown> = { schoolId };

    if (params.studentId) {
      await assertStudentAccess(this.prisma, user, params.studentId);
      where.studentId = params.studentId;
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const defaultStu = user.linkedStudentIds[0];
      if (!defaultStu) return [];
      where.studentId = defaultStu;
    }

    if (params.assessmentId) {
      where.assessmentId = params.assessmentId;
    } else if (params.termId || params.sectionId) {
      if (params.sectionId) {
        await assertSectionAccess(this.prisma, user, params.sectionId);
      }
      where.assessment = {
        ...(params.termId ? { examTermId: params.termId } : {}),
        ...(params.sectionId ? { sectionId: params.sectionId } : {}),
      };
    } else if (user.role === RoleCode.TEACHER && !params.studentId) {
      where.assessment = {
        sectionId: { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] },
      };
    }

    return this.prisma.examMark.findMany({
      where,
      include: {
        student: { select: { id: true, admissionNo: true, fullName: true, rollNo: true } },
        assessment: {
          include: {
            subject: true,
            examTerm: true,
            section: { include: { schoolClass: true } },
          },
        },
      },
      orderBy: [{ assessment: { examDate: 'desc' } }, { student: { rollNo: 'asc' } }],
    });
  }

  async bulkEnterMarks(dto: BulkEnterMarksDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: dto.assessmentId, schoolId },
      include: { subject: true, examTerm: true },
    });
    if (!assessment) throw new NotFoundException('Assessment not found in this school.');

    await assertSectionAccess(this.prisma, user, assessment.sectionId, assessment.subjectId);

    const [students, gradeScales] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where: {
          schoolId,
          sectionId: assessment.sectionId,
          id: { in: dto.entries.map((e) => e.studentId) },
        },
        include: { parentLinks: { select: { parentUserId: true } } },
      }),
      this.prisma.gradeScale.findMany({ where: { schoolId } }),
    ]);

    const studentMap = new Map(students.map((s) => [s.id, s]));
    if (studentMap.size !== new Set(dto.entries.map((e) => e.studentId)).size) {
      throw new BadRequestException('All students must belong to the assessment class section.');
    }

    for (const entry of dto.entries) {
      if (entry.marksObtained > assessment.maxMarks) {
        throw new BadRequestException(
          `Marks obtained (${entry.marksObtained}) cannot exceed maxMarks (${assessment.maxMarks}).`,
        );
      }
    }

    const saved = await this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const entry of dto.entries) {
        const percentage = calculatePercentage(entry.marksObtained, assessment.maxMarks);
        const grade = resolveGrade(percentage, gradeScales);
        const isPassed = entry.marksObtained >= assessment.passMarks;

        const mark = await tx.examMark.upsert({
          where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: entry.studentId } },
          update: {
            marksObtained: entry.marksObtained,
            percentage,
            grade,
            isPassed,
            remarks: entry.remarks ?? null,
            enteredById: user.userId,
          },
          create: {
            schoolId,
            assessmentId: assessment.id,
            studentId: entry.studentId,
            marksObtained: entry.marksObtained,
            percentage,
            grade,
            isPassed,
            remarks: entry.remarks ?? null,
            enteredById: user.userId,
          },
        });
        results.push(mark);
      }
      return results;
    });

    // Notify parents & students of published marks
    for (const stu of students) {
      const recipients = [
        ...(stu.userId ? [stu.userId] : []),
        ...stu.parentLinks.map((p) => p.parentUserId),
      ];
      if (recipients.length > 0) {
        await this.notificationsService.dispatchToUsers({
          schoolId,
          recipientUserIds: recipients,
          studentId: stu.id,
          title: `Marks Published: ${assessment.subject.name}`,
          body: `${assessment.examTerm.name} results for ${stu.fullName} are now available.`,
          category: NotificationCategory.MARKS,
          priority: PriorityLevel.NORMAL,
          referenceType: 'ASSESSMENT',
          referenceId: assessment.id,
        });
      }
    }

    return { savedCount: saved.length, marks: saved };
  }
}
