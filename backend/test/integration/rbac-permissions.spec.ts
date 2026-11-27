import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@config/prisma.service';
import { CoreNotificationsService } from '@core/notifications/notifications.service';
import { MarksService } from '@modules/academics/marks/marks.service';
import { ParentCommunicationService } from '@modules/communication/parent-communication/parent-communication.service';
import { RoleCode } from '@shared/enums';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { AuthUser } from '@shared/interfaces';
import { calculatePercentage, resolveGrade } from '@shared/utils';

function mockContext(user: AuthUser): ExecutionContext {
  return {
    getHandler: () => (() => undefined),
    getClass: () => class Dummy {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RBAC, Permissions, Messaging Controls, and Grading Rules', () => {
  const reflector = new Reflector();

  it('RolesGuard and PermissionsGuard reject unauthorized roles/permissions', () => {
    const rolesGuard = new RolesGuard(reflector);
    const permsGuard = new PermissionsGuard(reflector);

    const parentUser: AuthUser = {
      userId: 'parent-1',
      schoolId: 'school-a',
      role: RoleCode.PARENT,
      permissions: ['STUDENT_VIEW', 'MESSAGE_SEND'],
      phone: '9876543212',
      fullName: 'Parent',
      linkedStudentIds: ['stu-1'],
      assignedSectionIds: [],
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce([RoleCode.SCHOOL_ADMIN]);
    expect(() => rolesGuard.canActivate(mockContext(parentUser))).toThrow(ForbiddenException);

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(['CIRCULAR_PUBLISH']);
    expect(() => permsGuard.canActivate(mockContext(parentUser))).toThrow(ForbiddenException);
  });

  it('ParentCommunicationService blocks parent replies when one-way broadcast mode is active', async () => {
    const prismaMock = {
      school: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'school-a',
          messagingBroadcastOnly: true,
          messagingStartHour: null,
          messagingEndHour: null,
        }),
      },
    } as unknown as PrismaService;

    const notificationsMock = { dispatchToUsers: jest.fn() } as unknown as CoreNotificationsService;
    const service = new ParentCommunicationService(prismaMock, notificationsMock);

    const parentUser: AuthUser = {
      userId: 'parent-1',
      schoolId: 'school-a',
      role: RoleCode.PARENT,
      permissions: ['MESSAGE_SEND'],
      phone: '9876543212',
      fullName: 'Parent',
      linkedStudentIds: ['stu-1'],
      assignedSectionIds: [],
    };

    await expect(
      service.sendMessage({ threadId: 'thread-1', body: 'Hello teacher' }, parentUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('MarksService rejects marks exceeding maxMarks and resolves grade/percentage accurately', async () => {
    expect(calculatePercentage(85, 100)).toBe(85);
    expect(
      resolveGrade(85, [
        { gradeLabel: 'A+', minPercentage: 90, maxPercentage: 100 },
        { gradeLabel: 'A', minPercentage: 80, maxPercentage: 89.99 },
      ]),
    ).toBe('A');

    const prismaMock = {
      assessment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'assm-1',
          schoolId: 'school-a',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          maxMarks: 50,
          passMarks: 18,
          subject: { name: 'Math' },
          examTerm: { name: 'Unit Test 1' },
        }),
      },
      section: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sec-1',
          schoolId: 'school-a',
          academicYearId: 'ay-1',
          classTeacherId: 'staff-1',
        }),
      },
      staffAssignment: { findFirst: jest.fn().mockResolvedValue({ id: 'assign-1' }) },
      studentProfile: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'stu-1', fullName: 'Aarav', userId: null, parentLinks: [] },
        ]),
      },
      gradeScale: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const notificationsMock = { dispatchToUsers: jest.fn() } as unknown as CoreNotificationsService;
    const service = new MarksService(prismaMock, notificationsMock);

    const teacherUser: AuthUser = {
      userId: 'teacher-1',
      schoolId: 'school-a',
      role: RoleCode.TEACHER,
      permissions: ['MARKS_ENTER'],
      phone: '9876543211',
      fullName: 'Teacher',
      staffId: 'staff-1',
      linkedStudentIds: [],
      assignedSectionIds: ['sec-1'],
    };

    await expect(
      service.bulkEnterMarks(
        { assessmentId: 'assm-1', entries: [{ studentId: 'stu-1', marksObtained: 65 }] },
        teacherUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
