import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RelationshipType, RoleCode } from '@shared/enums';
import { AuthUser } from '@shared/interfaces';
import {
  assertStudentAccess,
  buildPaginatedResult,
  hashSecret,
  normalizePagination,
  resolveEffectiveSchoolId,
  toDateOnly,
} from '@shared/utils';
import { CreateStudentDto, LinkParentDto, StudentsQueryDto, UpdateStudentDto } from './profiles.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: StudentsQueryDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user, query.schoolId);
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Record<string, unknown> = {
      schoolId,
      ...(query.sectionId ? { sectionId: query.sectionId } : {}),
      ...(query.academicYearId ? { academicYearId: query.academicYearId } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { admissionNo: { contains: query.search, mode: 'insensitive' } },
              { rollNo: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (user.role === RoleCode.TEACHER) {
      where.sectionId = query.sectionId
        ? user.assignedSectionIds.includes(query.sectionId)
          ? query.sectionId
          : '__none__'
        : { in: user.assignedSectionIds.length ? user.assignedSectionIds : ['__none__'] };
    } else if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
      where.id = { in: user.linkedStudentIds.length ? user.linkedStudentIds : ['__none__'] };
    }

    const [items, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ rollNo: 'asc' }, { fullName: 'asc' }],
        include: {
          section: { include: { schoolClass: true } },
          academicYear: { select: { id: true, name: true } },
          parentLinks: {
            include: {
              parentUser: { select: { id: true, fullName: true, phone: true, email: true } },
            },
          },
        },
      }),
      this.prisma.studentProfile.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthUser) {
    await assertStudentAccess(this.prisma, user, id);
    const student = await this.prisma.studentProfile.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            schoolClass: true,
            classTeacher: { include: { user: { select: { id: true, fullName: true } } } },
          },
        },
        academicYear: { select: { id: true, name: true } },
        parentLinks: {
          include: {
            parentUser: { select: { id: true, fullName: true, phone: true, email: true } },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found.');
    return student;
  }

  async create(dto: CreateStudentDto, user: AuthUser, schoolIdParam?: string) {
    const schoolId = resolveEffectiveSchoolId(user, schoolIdParam);

    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, schoolId },
    });
    if (!section) throw new NotFoundException('Target section not found in this school.');

    const academicYearId = dto.academicYearId ?? section.academicYearId;
    const existingAdm = await this.prisma.studentProfile.findUnique({
      where: { schoolId_admissionNo: { schoolId, admissionNo: dto.admissionNo.trim() } },
    });
    if (existingAdm) {
      throw new ConflictException(`Admission number "${dto.admissionNo}" already exists.`);
    }

    const parentRole = await this.prisma.role.findUnique({ where: { code: RoleCode.PARENT } });
    const studentRole = await this.prisma.role.findUnique({ where: { code: RoleCode.STUDENT } });
    const defaultPinHash = await hashSecret(dto.parentPin ?? '1234');
    const studentPinHash = dto.studentPin ? await hashSecret(dto.studentPin) : defaultPinHash;

    return this.prisma.$transaction(async (tx) => {
      let studentUserId: string | null = null;
      if (dto.studentLoginPhone && studentRole) {
        const cleanStudentPhone = dto.studentLoginPhone.replace(/[\s\-+]/g, '');
        const existingStudentUser = await tx.user.findFirst({
          where: { schoolId, phone: cleanStudentPhone },
        });
        if (existingStudentUser) {
          throw new BadRequestException('Student login mobile number is already in use.');
        }
        const createdStuUser = await tx.user.create({
          data: {
            schoolId,
            roleId: studentRole.id,
            phone: cleanStudentPhone,
            fullName: dto.fullName.trim(),
            pinOrPasswordHash: studentPinHash,
            isPreRegistered: true,
            isActive: true,
          },
        });
        studentUserId = createdStuUser.id;
      }

      const cleanGuardianPhone = dto.guardianPhone?.replace(/[\s\-+]/g, '');
      if (dto.parentFullName?.trim() && !cleanGuardianPhone) {
        throw new BadRequestException('Parent mobile number (guardianPhone) is required when parentFullName is provided.');
      }

      const student = await tx.studentProfile.create({
        data: {
          schoolId,
          userId: studentUserId,
          admissionNo: dto.admissionNo.trim(),
          fullName: dto.fullName.trim(),
          sectionId: section.id,
          academicYearId,
          dateOfBirth: dto.dateOfBirth ? toDateOnly(dto.dateOfBirth) : null,
          gender: dto.gender ?? null,
          bloodGroup: dto.bloodGroup ?? null,
          rollNo: dto.rollNo ?? null,
          guardianPhone: cleanGuardianPhone ?? null,
          address: dto.address ?? null,
        },
      });

      if (cleanGuardianPhone && parentRole) {
        let parentUser = await tx.user.findFirst({
          where: { schoolId, phone: cleanGuardianPhone },
        });
        if (!parentUser) {
          parentUser = await tx.user.create({
            data: {
              schoolId,
              roleId: parentRole.id,
              phone: cleanGuardianPhone,
              fullName: dto.parentFullName?.trim() || `Parent of ${dto.fullName.trim()}`,
              pinOrPasswordHash: defaultPinHash,
              isPreRegistered: true,
              isActive: true,
            },
          });
        } else if (dto.parentFullName?.trim() && parentUser.fullName.startsWith('Parent of ')) {
          parentUser = await tx.user.update({
            where: { id: parentUser.id },
            data: { fullName: dto.parentFullName.trim() },
          });
        }
        await tx.parentStudentLink.upsert({
          where: { parentUserId_studentId: { parentUserId: parentUser.id, studentId: student.id } },
          update: {},
          create: {
            schoolId,
            parentUserId: parentUser.id,
            studentId: student.id,
            relationship: dto.parentRelationship ?? RelationshipType.GUARDIAN,
            isPrimary: true,
          },
        });
      }

      return tx.studentProfile.findUnique({
        where: { id: student.id },
        include: {
          section: { include: { schoolClass: true } },
          parentLinks: { include: { parentUser: { select: { id: true, fullName: true, phone: true } } } },
        },
      });
    });
  }

  async update(id: string, dto: UpdateStudentDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const existing = await this.prisma.studentProfile.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Student not found.');

    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, schoolId } });
      if (!section) throw new NotFoundException('Target section not found in this school.');
    }

    return this.prisma.studentProfile.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.sectionId !== undefined ? { sectionId: dto.sectionId } : {}),
        ...(dto.dateOfBirth !== undefined ? { dateOfBirth: toDateOnly(dto.dateOfBirth) } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup } : {}),
        ...(dto.rollNo !== undefined ? { rollNo: dto.rollNo } : {}),
        ...(dto.guardianPhone !== undefined
          ? { guardianPhone: dto.guardianPhone.replace(/[\s\-+]/g, '') }
          : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        section: { include: { schoolClass: true } },
        parentLinks: { include: { parentUser: { select: { id: true, fullName: true, phone: true } } } },
      },
    });
  }

  async linkParent(studentId: string, dto: LinkParentDto, user: AuthUser) {
    const schoolId = resolveEffectiveSchoolId(user);
    const student = await this.prisma.studentProfile.findFirst({ where: { id: studentId, schoolId } });
    if (!student) throw new NotFoundException('Student not found.');

    const parentRole = await this.prisma.role.findUnique({ where: { code: RoleCode.PARENT } });
    if (!parentRole) throw new BadRequestException('Parent role not initialized.');

    const cleanPhone = dto.parentPhone.replace(/[\s\-+]/g, '');
    const pinHash = await hashSecret(dto.parentPin ?? '1234');

    return this.prisma.$transaction(async (tx) => {
      let parentUser = await tx.user.findFirst({ where: { schoolId, phone: cleanPhone } });
      if (!parentUser) {
        parentUser = await tx.user.create({
          data: {
            schoolId,
            roleId: parentRole.id,
            phone: cleanPhone,
            fullName: dto.parentFullName.trim(),
            pinOrPasswordHash: pinHash,
            isPreRegistered: true,
            isActive: true,
          },
        });
      } else if (dto.parentFullName?.trim() && parentUser.fullName !== dto.parentFullName.trim()) {
        parentUser = await tx.user.update({
          where: { id: parentUser.id },
          data: { fullName: dto.parentFullName.trim() },
        });
      }

      if (!student.guardianPhone || dto.isPrimary !== false) {
        await tx.studentProfile.update({
          where: { id: studentId },
          data: { guardianPhone: cleanPhone },
        });
      }

      return tx.parentStudentLink.upsert({
        where: { parentUserId_studentId: { parentUserId: parentUser.id, studentId } },
        update: {
          relationship: dto.relationship ?? RelationshipType.GUARDIAN,
          isPrimary: dto.isPrimary ?? true,
        },
        create: {
          schoolId,
          parentUserId: parentUser.id,
          studentId,
          relationship: dto.relationship ?? RelationshipType.GUARDIAN,
          isPrimary: dto.isPrimary ?? true,
        },
        include: {
          parentUser: { select: { id: true, fullName: true, phone: true } },
        },
      });
    });
  }
}
