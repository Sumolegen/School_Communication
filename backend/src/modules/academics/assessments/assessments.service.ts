import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import { assertSectionAccess, getStudentOrParentSectionIds, resolveEffectiveSchoolId, toDateOnly } from '@shared/utils';
import { AssessmentsQueryDto, CreateAssessmentDto } from './assessments.dto';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AssessmentsQueryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const where: Record<string, unknown> = {
      schoolId,
      ...(query.examTermId ? { examTermId: query.examTermId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    };

    if (query.sectionId) {
      await assertSectionAccess(this.prisma, user, query.sectionId);
      where.sectionId = query.sectionId;
    } else if (user.role === RoleCode.TEACHER) {
      where.sectionId = { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] };
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      const allowed = await getStudentOrParentSectionIds(this.prisma, user);
      where.sectionId = { in: allowed.length ? allowed : ['__none__'] };
    }

    return this.prisma.assessment.findMany({
      where,
      include: {
        examTerm: true,
        section: { include: { schoolClass: true } },
        subject: true,
        _count: { select: { marks: true } },
      },
      orderBy: { examDate: 'asc' },
    });
  }

  async create(dto: CreateAssessmentDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    if (dto.passMarks > dto.maxMarks) {
      throw new BadRequestException('passMarks cannot exceed maxMarks.');
    }

    const [term, section, subject] = await Promise.all([
      this.prisma.examTerm.findFirst({ where: { id: dto.examTermId, schoolId } }),
      this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId } }),
      this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } }),
    ]);

    if (!term) throw new NotFoundException('Exam term not found in this school.');
    if (!section) throw new NotFoundException('Section not found in this school.');
    if (!subject) throw new NotFoundException('Subject not found in this school.');

    await assertSectionAccess(this.prisma, user, section.id, subject.id);

    return this.prisma.assessment.create({
      data: {
        schoolId,
        examTermId: term.id,
        sectionId: section.id,
        subjectId: subject.id,
        title: dto.title.trim(),
        maxMarks: dto.maxMarks,
        passMarks: dto.passMarks,
        examDate: toDateOnly(dto.examDate),
      },
      include: {
        examTerm: true,
        section: { include: { schoolClass: true } },
        subject: true,
      },
    });
  }
}
