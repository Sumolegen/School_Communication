import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '../enums';
import { AuthUser } from '../interfaces';

export function resolveEffectiveSchoolId(user: AuthUser, requestedSchoolId?: string): string {
  if (user.role === RoleCode.SUPER_ADMIN) {
    const resolved = requestedSchoolId ?? user.schoolId;
    if (!resolved) {
      throw new BadRequestException('schoolId query/parameter is required for Super Admin scoped operations.');
    }
    return resolved;
  }

  if (!user.schoolId) {
    throw new ForbiddenException('Missing school tenant context.');
  }

  if (requestedSchoolId && requestedSchoolId !== user.schoolId) {
    throw new ForbiddenException('Cross-school tenant access is denied.');
  }

  return user.schoolId;
}

export async function assertStudentAccess(
  prisma: PrismaService,
  user: AuthUser,
  studentId: string,
): Promise<{ id: string; schoolId: string; sectionId: string; academicYearId: string; fullName: string }> {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      schoolId: true,
      sectionId: true,
      academicYearId: true,
      fullName: true,
      userId: true,
    },
  });

  if (!student) {
    throw new NotFoundException('Student not found.');
  }

  if (user.role !== RoleCode.SUPER_ADMIN && student.schoolId !== user.schoolId) {
    throw new ForbiddenException('Cross-school student access is denied.');
  }

  if (user.role === RoleCode.STUDENT && student.userId !== user.userId) {
    throw new ForbiddenException('Students may only access their own records.');
  }

  if (user.role === RoleCode.PARENT && !user.linkedStudentIds.includes(student.id)) {
    throw new ForbiddenException('Parents may only access their linked children.');
  }

  if (user.role === RoleCode.TEACHER && !user.assignedSectionIds.includes(student.sectionId)) {
    throw new ForbiddenException('Teachers may only access students in their assigned classes.');
  }

  return student;
}

export async function assertSectionAccess(
  prisma: PrismaService,
  user: AuthUser,
  sectionId: string,
  subjectId?: string,
): Promise<{ id: string; schoolId: string; academicYearId: string }> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { id: true, schoolId: true, academicYearId: true, classTeacherId: true },
  });

  if (!section) {
    throw new NotFoundException('Class section not found.');
  }

  if (user.role !== RoleCode.SUPER_ADMIN && section.schoolId !== user.schoolId) {
    throw new ForbiddenException('Cross-school section access is denied.');
  }

  if (user.role === RoleCode.TEACHER) {
    if (!user.staffId) {
      throw new ForbiddenException('Teacher profile is missing.');
    }

    const isClassTeacher = section.classTeacherId === user.staffId;
    const assignment = await prisma.staffAssignment.findFirst({
      where: {
        schoolId: section.schoolId,
        staffId: user.staffId,
        sectionId: section.id,
        ...(subjectId ? { OR: [{ subjectId }, { isClassTeacher: true }] } : {}),
      },
      select: { id: true },
    });

    if (!isClassTeacher && !assignment) {
      throw new ForbiddenException('You are not assigned to this class section or subject.');
    }
  }

  if (user.role === RoleCode.PARENT || user.role === RoleCode.STUDENT) {
    const allowedSections = await getStudentOrParentSectionIds(prisma, user);
    if (!allowedSections.includes(section.id)) {
      throw new ForbiddenException('Access denied for this class section.');
    }
  }

  return section;
}

export async function getStudentOrParentSectionIds(prisma: PrismaService, user: AuthUser): Promise<string[]> {
  if (user.linkedStudentIds.length === 0) return [];
  const students = await prisma.studentProfile.findMany({
    where: { id: { in: user.linkedStudentIds }, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    select: { sectionId: true },
  });
  return Array.from(new Set(students.map((s) => s.sectionId)));
}
