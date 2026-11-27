import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@config/prisma.service';
import { RoleCode } from '@shared/enums';
import { TenantGuard } from '@shared/guards/tenant.guard';
import { AuthUser } from '@shared/interfaces';
import { assertSectionAccess, assertStudentAccess, resolveEffectiveSchoolId } from '@shared/utils';

function mockContext(req: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => (() => undefined),
    getClass: () => class Dummy {},
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('Tenant Isolation & Ownership Enforcement', () => {
  const reflector = new Reflector();
  const guard = new TenantGuard(reflector);

  const schoolAUser: AuthUser = {
    userId: 'user-1',
    schoolId: 'school-a',
    role: RoleCode.SCHOOL_ADMIN,
    permissions: [],
    phone: '9876543210',
    fullName: 'Admin A',
    linkedStudentIds: [],
    assignedSectionIds: [],
  };

  it('blocks requests attempting to query or mutate another schoolId', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(() =>
      guard.canActivate(
        mockContext({ user: schoolAUser, query: { schoolId: 'school-b' }, params: {}, body: {} }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows requests scoped to the authenticated user schoolId', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const allowed = guard.canActivate(
      mockContext({ user: schoolAUser, query: { schoolId: 'school-a' }, params: {}, body: {} }),
    );
    expect(allowed).toBe(true);
  });

  it('resolveEffectiveSchoolId prevents cross-school spoofing for non-super-admin', () => {
    expect(resolveEffectiveSchoolId(schoolAUser)).toBe('school-a');
    expect(() => resolveEffectiveSchoolId(schoolAUser, 'school-b')).toThrow(ForbiddenException);
  });

  it('assertStudentAccess enforces parent-child linkage and school isolation', async () => {
    const prismaMock = {
      studentProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'stu-1',
          schoolId: 'school-a',
          sectionId: 'sec-1',
          academicYearId: 'ay-1',
          fullName: 'Aarav',
          userId: 'stu-user-1',
        }),
      },
    } as unknown as PrismaService;

    const parentWithLink: AuthUser = {
      ...schoolAUser,
      role: RoleCode.PARENT,
      linkedStudentIds: ['stu-1'],
    };
    const parentWithoutLink: AuthUser = {
      ...schoolAUser,
      role: RoleCode.PARENT,
      linkedStudentIds: ['stu-other'],
    };

    await expect(assertStudentAccess(prismaMock, parentWithLink, 'stu-1')).resolves.toMatchObject({
      id: 'stu-1',
    });
    await expect(assertStudentAccess(prismaMock, parentWithoutLink, 'stu-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('assertSectionAccess enforces teacher assignment boundaries', async () => {
    const prismaMock = {
      section: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sec-1',
          schoolId: 'school-a',
          academicYearId: 'ay-1',
          classTeacherId: 'staff-other',
        }),
      },
      staffAssignment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const unassignedTeacher: AuthUser = {
      ...schoolAUser,
      role: RoleCode.TEACHER,
      staffId: 'staff-1',
      assignedSectionIds: ['sec-2'],
    };

    await expect(assertSectionAccess(prismaMock, unassignedTeacher, 'sec-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
